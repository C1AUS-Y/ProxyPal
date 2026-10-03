// Courier matching. Everything here runs against the bundled carriers.json and
// never touches the network or the database. 17TRACK is only called from
// trackIfMatched(), and only after a courier has been matched locally.

import { readFileSync } from 'node:fs'
import * as track17 from './track17.js'

const CARRIERS = JSON.parse(readFileSync(new URL('./data/carriers.json', import.meta.url), 'utf8'))
const BY_CODE = new Map(CARRIERS.map(c => [c.code, c]))

// where the user is. Variants of the same courier (J&T has one per country) from
// this country are listed first. Override with FALLBACK_COUNTRY in the env.
const HOME_COUNTRY = (process.env.FALLBACK_COUNTRY || 'PH').toUpperCase()
const MAX_SUGGESTIONS = 5

export const isKnownCarrier = code => BY_CODE.has(Number(code))
export const getCarrier = code => BY_CODE.get(Number(code)) ?? null

export function searchCarriers(query, limit = 20) {
  const q = String(query ?? '').trim().toLowerCase()
  if (q.length < 2) return []
  if (/^\d+$/.test(q)) return CARRIERS.filter(c => String(c.code) === q).slice(0, limit)

  return CARRIERS
    .filter(c => c.name.toLowerCase().includes(q))
    .sort((a, b) => (b.country === HOME_COUNTRY) - (a.country === HOME_COUNTRY) || a.name.length - b.name.length)
    .slice(0, limit)
}

// strong: the number format belongs to exactly one courier. Only then is it matched
// automatically. Weak formats are shared or ambiguous, so they only produce suggestions.
const PATTERNS = [
  { test: /^1Z[0-9A-Z]{16}$/, names: [/^ups$/i], strong: true },
  { test: /^(92|93|94|95)\d{18,24}$/, names: [/^usps$/i], strong: true },
  // PH + digits + a letter (not the 2-letter/9-digit/2-letter post format), e.g. PH261039568270P
  { test: /^PH\d{9,14}[A-Z]{0,2}$/, names: [/^flash express \(ph\)/i, /^lbc express$/i, /^ninjavan \(ph\)/i, /^j&t express \(ph\)/i, /^shopeeexpress\(ph\)/i], per: 1 },
  { test: /^(JT|JNT)\d{10,14}$/, names: [/^j&t express/i] },
  { test: /^SPX/, names: [/^shopee ?express/i, /^spx express/i] },
  { test: /^\d{12}$/, names: [/^yamato\s*\(/i, /^sagawa/i, /^fedex$/i] },
  { test: /^\d{10,11}$/, names: [/^dhl express$/i] },
]

// shown as extra suggestions when nothing else fits. Never auto-matched
const COMMON = [
  /^japan post$/i, /^yamato\s*\(/i, /^sagawa/i, /^dhl express$/i, /^fedex$/i,
  /^ups$/i, /^j&t express/i, /^lbc express$/i, /^ninjavan/i, /^flash express/i,
]

const PER_PATTERN = 2

function byName(patterns, perPattern = PER_PATTERN) {
  return patterns.flatMap(pattern =>
    CARRIERS
      .filter(c => pattern.test(c.name))
      .sort((a, b) => (b.country === HOME_COUNTRY) - (a.country === HOME_COUNTRY))
      .slice(0, perPattern)
  )
}

// Returns { carrier, suggestions }. carrier is set only when the match is certain.
export function matchCarrier(number) {
  const n = String(number ?? '').trim().toUpperCase()
  if (!n) return { carrier: null, suggestions: [] }

  const suggestions = []
  const add = list => {
    for (const c of list) if (!suggestions.some(s => s.code === c.code)) suggestions.push(c)
  }

  let certain = null

  // international post format, e.g. EE123456789JP: the last two letters are the origin country.
  // Certain only if that country has exactly one post carrier.
  const upu = n.match(/^[A-Z]{2}\d{9}([A-Z]{2})$/)
  if (upu) {
    const posts = CARRIERS.filter(c => c.country === upu[1] && /\b(post|ems)\b/i.test(c.name))
    add(posts.slice(0, 3))
    if (posts.length === 1) certain = posts[0]
  }

  for (const pattern of PATTERNS) {
    if (!pattern.test.test(n)) continue
    const found = byName(pattern.names, pattern.per)
    add(found)
    if (pattern.strong && found.length === 1) certain = found[0]
  }

  add(byName(COMMON, 1))
  return { carrier: certain, suggestions: suggestions.slice(0, MAX_SUGGESTIONS) }
}

export const suggestCarriers = number => matchCarrier(number).suggestions

// numbers already sent to 17TRACK by this process, so the same one is never registered twice
const registered = new Set()

// 17TRACK is called ONLY after a courier is matched in carriers.json:
//   - the user picked one (checked against the JSON), or
//   - the number's format belongs to exactly one courier
// otherwise nothing is sent and the suggestions come back for the user to choose from.
// at most one register call per number+courier, and no status call right after it.
export async function trackIfMatched(number, carrier = null) {
  if (!number) return { result: null, carrier: null, needsCarrier: false, suggestions: [] }

  let code = null

  if (carrier) {
    if (!isKnownCarrier(carrier)) {
      return { result: null, carrier: null, needsCarrier: true, suggestions: suggestCarriers(number) }
    }
    code = Number(carrier)
  } else {
    code = matchCarrier(number).carrier?.code ?? null
    if (!code) return { result: null, carrier: null, needsCarrier: true, suggestions: suggestCarriers(number) }
  }

  const key = `${number.trim()}|${code}`
  if (registered.has(key)) return { result: null, carrier: code, needsCarrier: false, suggestions: [] }

  const accepted = await track17.registerNumber(number, code)
  registered.add(key)

  // a brand-new registration has no tracking data yet, so asking for it now would only waste a call
  if (!accepted?.alreadyRegistered) return { result: null, carrier: code, needsCarrier: false, suggestions: [] }

  const result = await track17.getStatus(number, code)
  return { result, carrier: code, needsCarrier: false, suggestions: [] }
}