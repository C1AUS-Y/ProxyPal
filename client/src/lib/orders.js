export const STATUSES = ['Ordered', 'Shipped', 'In Transit', 'Delivered']
export const PAYMENT_METHODS = ['Bank Transfer', 'GCash', 'Maya', 'Cash', 'Alipay', 'Other']

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
export const formatMoney = (amount) => money.format(Number(amount) || 0)

export function formatDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

//YYYY-MM-DD.
export function todayISO() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

// round to nearest cent as num
const cents = (n) => Math.round(n * 100) / 100

export const getOrderTotal = (order) =>
  cents(order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0))

export const getOrderPaid = (order) =>
  cents(order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0))

// neg values mean overpaid
export const getOrderBalance = (order) => cents(getOrderTotal(order) - getOrderPaid(order))

export const isActive = (order) => order.status !== 'Delivered'

export function getAllPayments(orders) {
  return orders
    .flatMap((order) => order.payments.map((payment) => ({ ...payment, orderId: order.id })))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export const sortOrders = (orders) =>
  orders
    .slice()
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate) || Number(b.id) - Number(a.id))
