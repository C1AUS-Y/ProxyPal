import { readFileSync } from 'node:fs'
import * as track17 from './track17.js'

const CARRIERS = JSON.parse(readFileSync(new URL('./data/carriers.json', import.meta.url), 'utf8'))

// carriers from this country are listed first (ex. J&T has one entry per country)
const HOME_COUNTRY = (process.env.FALLBACK_COUNTRY || 'PH').toUpperCase()

export const getCarrier = code => CARRIERS.find(c => c.code === Number(code)) ?? null
export const isKnownCarrier = code => getCarrier(code) !== null

// returns a 2-letter country code or null if it isnt one
function cleanCountry(country) {
  const code = String(country ?? '').trim().toUpperCase()
  return code.length === 2 ? code : null
}

function homeFirst(list) {
  const home = list.filter(c => c.country === HOME_COUNTRY)
  const others = list.filter(c => c.country !== HOME_COUNTRY)
  return [...home, ...others]
}

export function listCountries() {
  const counts = {}
  for (const c of CARRIERS) {
    if (!c.country) continue
    counts[c.country] = (counts[c.country] || 0) + 1
  }
  return Object.entries(counts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

export function searchCarriers(query, limit = 20, country = null) {
  const q = String(query ?? '').trim().toLowerCase()
  const countryCode = cleanCountry(country)
  const pool = countryCode ? CARRIERS.filter(c => c.country === countryCode) : CARRIERS

  // country picked and nothing typed: list that country's couriers if user doesnt know
  if (q === '' && countryCode) {
    return [...pool].sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit)
  }
  if (q.length < 2) return []

  // typing a number looks up a courier code
  if (/^\d+$/.test(q)) return pool.filter(c => String(c.code) === q).slice(0, limit)

  const matches = pool
    .filter(c => c.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.length - b.name.length)
  return homeFirst(matches).slice(0, limit)
}

//common couriers and formats for matchin
const RULES = [
  { test: /^1Z[0-9A-Z]{16}$/, names: ['ups'], sure: true },
  { test: /^(92|93|94|95)\d{18,24}$/, names: ['usps'], sure: true },
  { test: /^PH\d{9,14}[A-Z]{0,2}$/, names: ['flash express (ph)*', 'lbc express', 'ninjavan (ph)*', 'j&t express (ph)*', 'shopeeexpress(ph)*'], perName: 1 },
  { test: /^(JT|JNT)\d{10,14}$/, names: ['j&t express*'] },
  { test: /^SPX/, names: ['shopee express*', 'shopeeexpress*', 'spx express*'] },
  { test: /^\d{12}$/, names: ['yamato (*', 'sagawa*', 'fedex'] },
  { test: /^\d{10,11}$/, names: ['dhl express'] },
]

// suggested when nothing else fits, never picked automatically
const COMMON = ['japan post', 'yamato (*', 'sagawa*', 'dhl express', 'fedex', 'ups', 'j&t express*', 'lbc express', 'ninjavan*', 'flash express*']

function nameMatches(carrier, name) {
  const carrierName = carrier.name.toLowerCase()
  if (name.endsWith('*')) return carrierName.startsWith(name.slice(0, -1))
  return carrierName === name
}

function findByName(pool, names, perName = 2) {
  const found = []
  for (const name of names) {
    const matches = pool.filter(c => nameMatches(c, name))
    found.push(...homeFirst(matches).slice(0, perName))
  }
  return found
}

export function matchCarrier(number, country = null) {
  const n = String(number ?? '').trim().toUpperCase()
  if (!n) return { carrier: null, suggestions: [] }

  const countryCode = cleanCountry(country)
  const pool = countryCode ? CARRIERS.filter(c => c.country === countryCode) : CARRIERS

  let carrier = null
  const suggestions = []

  // international post format like EE123456789JP: the last 2 letters are the origin country
  const upu = n.match(/^[A-Z]{2}\d{9}([A-Z]{2})$/)
  if (upu) {
    const posts = pool.filter(c => c.country === upu[1] && /\b(post|ems)\b/i.test(c.name)).slice(0, 3)
    suggestions.push(...posts)
    if (posts.length === 1) carrier = posts[0]
  }

  for (const rule of RULES) {
    if (!rule.test.test(n)) continue
    const found = findByName(pool, rule.names, rule.perName)
    suggestions.push(...found)
    if (rule.sure && found.length === 1) carrier = found[0]
  }
  suggestions.push(...findByName(pool, COMMON, 1))

  // drop duplicates, keep the first 5
  const unique = suggestions.filter((c, i) => suggestions.findIndex(s => s.code === c.code) === i)
  return { carrier, suggestions: unique.slice(0, 5) }
}

export const suggestCarriers = (number, country = null) => matchCarrier(number, country).suggestions

// only calls 17track once we know the courier: either the user picked one,
// or the number's format clearly belongs to one otherwise returns suggestions
export async function trackIfMatched(number, carrier = null) {
  if (!number) return { result: null, carrier: null, needsCarrier: false, suggestions: [] }

  let code = null
  if (carrier && isKnownCarrier(carrier)) code = Number(carrier)
  else if (!carrier) code = matchCarrier(number).carrier?.code ?? null

  if (!code) {
    return { result: null, carrier: null, needsCarrier: true, suggestions: suggestCarriers(number) }
  }

  const accepted = await track17.registerNumber(number, code)

  if (accepted?.alreadyRegistered) {
    const result = await track17.getStatus(number, code)
    return { result, carrier: code, needsCarrier: false, suggestions: [] }
  }
  return { result: null, carrier: code, needsCarrier: false, suggestions: [] }
}