import { supabase } from '../lib/supabaseClient.js'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const labels = ['Ordered', 'Shipped', 'In Transit', 'Delivered']
const values = ['ordered', 'shipped', 'in_transit', 'delivered']

function toPage(row) {
  return {
    id: row.id,
    proxyName: row.proxy_name,
    platform: row.platform,
    recipient: row.recipient,
    orderDate: row.order_date || '',
    status: labels[values.indexOf(row.status)] || 'Ordered',
    trackingNumber: row.tracking_number,
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
    trackingEvents: row.tracking_events || [],
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
