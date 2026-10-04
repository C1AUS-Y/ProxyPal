import { supabase } from '../lib/supabaseClient.js'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const labels = ['Ordered', 'Shipped', 'In Transit', 'Delivered']
const values = ['ordered', 'shipped', 'in_transit', 'delivered']

// Anything that gets rendered as text must be a string. Saved events can hold objects
// (17TRACK's address is one), and React crashes the whole page on an object child.
function toText(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    return [value.city, value.state, value.country]
      .filter(part => typeof part === 'string' && part)
      .join(', ')
  }
  return ''
}

// tracking_events can come back as a real list, a JSON string (text column) or null,
// depending on how it was saved. Always hand the pages a plain array of safe events.
function toEvents(raw) {
  let value = raw
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(value)) return []

  return value
    .filter(event => event && typeof event === 'object')
    .map(event => ({
      ...event,
      label: toText(event.label),
      description: toText(event.description),
      location: toText(event.location || event.address),
      date: typeof event.date === 'string' ? event.date : null,
    }))
}

function toPage(row) {
  return {
    id: row.id,
    proxyName: row.proxy_name,
    platform: row.platform,
    recipient: row.recipient,
    orderDate: row.order_date || '',
    status: labels[values.indexOf(row.status)] || 'Ordered',
    trackingNumber: row.tracking_number,
    trackingCarrier: row.tracking_carrier ?? null,
    notes: row.notes || '',
    items: (row.items || []).map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
    payments: (row.payments || []).map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      date: payment.paid_on,
      method: payment.method,
    })),
    trackingEvents: toEvents(row.tracking_events),
  }
}

function toServer(input) {
  // status is controlled by 17track, not the user
  const { status: _status, ...order } = input
  return order
}

async function request(path, method = 'GET', body) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('your session has expired. please log in again.')
  }

  const response = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'something went wrong')
  }

  if (response.status === 204) return null

  return response.json()
}

export async function listOrders() {
  const rows = await request('/api/orders')
  return rows.map(toPage)
}

export async function getOrder(id) {
  return toPage(await request(`/api/orders/${id}`))
}

export async function createOrder(input) {
  return toPage(await request('/api/orders', 'POST', toServer(input)))
}

export async function updateOrder(id, input) {
  return toPage(await request(`/api/orders/${id}`, 'PUT', toServer(input)))
}

export async function deleteOrder(id) {
  await request(`/api/orders/${id}`, 'DELETE')
}

export async function addPayment(orderId, payment) {
  return toPage(
    await request(`/api/orders/${orderId}/payments`, 'POST', {
      amount: payment.amount,
      paidOn: payment.date,
      method: payment.method,
    })
  )
}

// courier lookups. These only read the server's bundled carrier list, nothing is sent to 17track
export async function suggestCarriers(number) {
  const data = await request(`/api/carriers/suggest?number=${encodeURIComponent(number)}`)
  return data.suggestions
}

export async function searchCarriers(query) {
  return request(`/api/carriers?q=${encodeURIComponent(query)}`)
}

export async function lookupCarrier(code) {
  const list = await request(`/api/carriers?code=${encodeURIComponent(code)}`)
  return list[0] ?? null
}