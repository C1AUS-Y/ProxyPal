// Pure helpers. No React, no network.

export const STATUSES = ['Ordered', 'Shipped', 'In Transit', 'Delivered']
export const PAYMENT_METHODS = ['Bank Transfer', 'GCash', 'Maya', 'Cash', 'Alipay', 'Other']

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
export const formatMoney = (amount) => money.format(Number(amount) || 0)

// "2026-04-12" -> "Apr 12, 2026". Built from parts so the browser's timezone
// can never shift it to the day before.
export function formatDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Today in the visitor's own timezone, as YYYY-MM-DD.
export function todayISO() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

// Round to cents so 0.1 + 0.2 style errors never reach the screen.
const cents = (n) => Math.round(n * 100) / 100

export const getOrderTotal = (order) =>
  cents(order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0))

export const getOrderPaid = (order) =>
  cents(order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0))

// What is still owed. Negative means overpaid.
export const getOrderBalance = (order) => cents(getOrderTotal(order) - getOrderPaid(order))

export const isActive = (order) => order.status !== 'Delivered'

// Every payment across every order, newest first, each knowing its order.
export function getAllPayments(orders) {
  return orders
    .flatMap((order) => order.payments.map((payment) => ({ ...payment, orderId: order.id })))
    .sort((a, b) => b.date.localeCompare(a.date))
}

// Newest order first. Used by the mock API and by the provider, so an order you
// just added or re-dated lands in the same place a reload would put it.
export const sortOrders = (orders) =>
  orders
    .slice()
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate) || Number(b.id) - Number(a.id))
