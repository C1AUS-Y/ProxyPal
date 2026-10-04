const TRACK17_KEY = process.env.TRACK17_KEY
const BASE_URL = 'https://api.17track.net/track/v2.4'

const STATUS_MAP = {
  NotFound: 'ordered',
  InfoReceived: 'ordered',
  InTransit: 'in_transit',
  Expired: 'in_transit',
  DeliveryFailure: 'in_transit',
  Exception: 'in_transit',
  AvailableForPickup: 'shipped',
  OutForDelivery: 'shipped',
  Delivered: 'delivered',
}

const EVENT_LABELS = {
  InfoReceived: 'Order information received',
  InTransit: 'In transit',
  AvailableForPickup: 'Available for pickup',
  OutForDelivery: 'Out for delivery',
  DeliveryFailure: 'Delivery failed',
  Delivered: 'Delivered',
  Exception: 'Exception',
  Expired: 'Tracking expired',
}

const CARRIER_LIST_URL = 'https://res.17track.net/asset/carrier/info/apicarrier.all.json'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const MIN_GAP_MS = 400
const MAX_RETRIES = 2
let queue = Promise.resolve()
let lastCallAt = 0

function throttled(task) {
  const run = queue.then(async () => {
    const wait = lastCallAt + MIN_GAP_MS - Date.now()
    if (wait > 0) await sleep(wait)
    try {
      return await task()
    } finally {
      lastCallAt = Date.now()
    }
  })
  queue = run.catch(() => {})
  return run
}

function formatLocation(event) {
  if (typeof event.location === 'string' && event.location) return event.location

  const address = event.address
  if (typeof address === 'string') return address
  if (address && typeof address === 'object') {
    return [address.city, address.state, address.country]
      .filter(part => typeof part === 'string' && part)
      .join(', ')
  }

  return ''
}

async function call(endpoint, body, attempt = 0) {
  if (!TRACK17_KEY) throw new Error('TRACK17_KEY is not configured')

  if (process.env.TRACK17_DRY_RUN === '1') {
    console.log(`[dry run] would call ${endpoint}:`, JSON.stringify(body))
    return { code: 0, data: { accepted: [], rejected: [] } }
  }

  const response = await throttled(() =>
    fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        '17token': TRACK17_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  )

  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
  }

  const retryable = response.status === 429
  if (retryable && attempt < MAX_RETRIES) {
    await sleep(1000 * (attempt + 1))
    return call(endpoint, body, attempt + 1)
  }

  if (data === null) {
    throw new Error(`17track returned a non-JSON reply (HTTP ${response.status}): ${text.slice(0, 200)}`)
  }

  if (!response.ok) throw new Error(data?.message || `17track returned ${response.status}`)

  return data
}

function isAlreadyRegistered(error) {
  if (!error) return false
  return error.code === -18019901 || /already\s+registered/i.test(error.message || '')
}

export async function registerNumber(number, carrier = null) {
  if (!number) return null

  const item = {
    number: number.trim(),
    lang: 'en',
    translation_mode: 'UseThirdPartyServices',
  }

  if (carrier) item.carrier = Number(carrier)

  const result = await call('register', [item])
  const accepted = result.data?.accepted?.[0]
  const rejected = result.data?.rejected?.[0]

  if (accepted) return accepted

  if (rejected && isAlreadyRegistered(rejected.error)) {
    return { number: rejected.number, carrier: carrier ? Number(carrier) : null, alreadyRegistered: true }
  }

  if (rejected) {
    const error = new Error(rejected.error?.message || '17track rejected the tracking number')
    error.code = rejected.error?.code
    error.trackingNumber = rejected.number
    throw error
  }

  return null
}

export async function getStatus(number, carrier = null) {
  if (!number) return null

  const item = {
    number: number.trim(),
    lang: 'en',
    translation_mode: 'UseThirdPartyServices',
  }

  if (carrier) item.carrier = Number(carrier)

  const result = await call('gettrackinfo', [item])
  const accepted = result.data?.accepted?.[0]

  if (!accepted) return null

  const trackInfo = accepted.track_info
  const rawStatus = trackInfo?.latest_status?.status
  const providers = trackInfo?.tracking?.providers || []

  const events = providers.flatMap(provider =>
    (provider.events || []).map(event => ({
      label: EVENT_LABELS[event.stage] || event.stage || 'Tracking update',
      description: event.description_translation?.description || event.description || '',
      date: event.time_iso ? event.time_iso.slice(0, 10) : null,
      time: event.time_iso || null,
      location: formatLocation(event),
      stage: event.stage || '',
      subStatus: event.sub_status || '',
    }))
  )

  events.sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0))

  return {
    status: STATUS_MAP[rawStatus] || 'ordered',
    rawStatus: rawStatus || null,
    events,
    carrier: accepted.carrier || carrier || null,
  }
}

export async function getCarrierList() {
  const response = await fetch(CARRIER_LIST_URL)

  if (!response.ok) throw new Error(`carrier list returned ${response.status}`)

  const data = await response.json()
  return Array.isArray(data) ? data : data.data || data.carriers || []
}