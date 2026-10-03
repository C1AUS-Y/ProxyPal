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

async function call(endpoint, body) {
  if (!TRACK17_KEY) throw new Error('TRACK17_KEY is not configured')

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      '17token': TRACK17_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) throw new Error(data?.message || `17track returned ${response.status}`)

  return data
}

export async function registerNumber(number) {
  if (!number) return null

  const result = await call('register', [{
    number,
    lang: 'en',
    translation_mode: 'UseThirdPartyServices',
  }])

  const accepted = result.data?.accepted?.[0]
  const rejected = result.data?.rejected?.[0]

  if (rejected) throw new Error(rejected.error?.message || '17track rejected the tracking number')

  return accepted || null
}

export async function getStatus(number) {
  if (!number) return null

  const result = await call('gettrackinfo', [{
    number,
    lang: 'en',
    translation_mode: 'UseThirdPartyServices',
  }])

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
      location: event.location || '',
      stage: event.stage || '',
      subStatus: event.sub_status || '',
    }))
  )

  events.sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0))

  return {
    status: STATUS_MAP[rawStatus] || 'ordered',
    rawStatus: rawStatus || null,
    events,
  }
}