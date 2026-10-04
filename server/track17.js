const TRACK17_KEY = process.env.TRACK17_KEY
const BASE_URL = 'https://api.17track.net/track/v2.4'

// 17track statuses -> the statuses our app uses
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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

let queue = Promise.resolve()

function throttled(task) {
  const result = queue.then(task)
  queue = result.catch(() => {}).then(() => sleep(400)) //17Ttrack only allows 3 req per sec, to prevent too many request err, added 400ms pause
  return result
}

async function callApi(endpoint, body) {
  if (!TRACK17_KEY) throw new Error('TRACK17_KEY is not configured')

  for (let attempt = 0; attempt <= 2; attempt++) {
    const res = await throttled(() =>
      fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { '17token': TRACK17_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )

    if (res.status === 429 && attempt < 2) {
      await sleep(1000 * (attempt + 1))
      continue
    }

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`17track returned a non-JSON reply (HTTP ${res.status}): ${text.slice(0, 200)}`)
    }

    if (!res.ok) throw new Error(data.message || `17track returned ${res.status}`)
    return data
  }
}

function makeItem(number, carrier) {
  const item = { number: number.trim(), lang: 'en', translation_mode: 'UseThirdPartyServices' }
  if (carrier) item.carrier = Number(carrier)
  return item
}

function formatLocation(event) {
  if (event.location) return event.location

  const address = event.address
  if (!address) return ''
  if (typeof address === 'string') return address
  return [address.city, address.state, address.country].filter(Boolean).join(', ')
}

export async function registerNumber(number, carrier = null) {
  if (!number) return null

  const result = await callApi('register', [makeItem(number, carrier)])
  const accepted = result.data?.accepted?.[0]
  const rejected = result.data?.rejected?.[0]

  if (accepted) return accepted

  if (rejected) {
    const message = rejected.error?.message || ''
    if (rejected.error?.code === -18019901 || /already\s+registered/i.test(message)) {
      return { alreadyRegistered: true }
    }
    throw new Error(message || '17track rejected the tracking number')
  }

  return null
}

export async function getStatus(number, carrier = null) {
  if (!number) return null

  const result = await callApi('gettrackinfo', [makeItem(number, carrier)])
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

  // oldest first
  events.sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0))

  return {
    status: STATUS_MAP[rawStatus] || 'ordered',
    rawStatus: rawStatus || null,
    events,
    carrier: accepted.carrier || carrier || null,
  }
}