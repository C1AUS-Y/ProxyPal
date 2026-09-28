import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Plus } from 'lucide-react'
import StatusBadge from '../components/atoms/StatusBadge.jsx'
import Button from '../components/atoms/Button.jsx'
import Input from '../components/atoms/Input.jsx'
import ItemRow from '../components/molecules/ItemRow.jsx'
import PaymentRow from '../components/molecules/PaymentRow.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import {
  PAYMENT_METHODS,
  formatDate,
  formatMoney,
  getOrderBalance,
  getOrderTotal,
  todayISO,
} from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

const CARD = 'rounded-2xl bg-surface p-4 shadow-md'

// The "log a payment I just made" flow. Prefilled with what is still owed,
// because paying the whole balance is the common case.
function PaymentForm({ order, balance, onDone }) {
  const { logPayment } = useOrders()
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '')
  const [date, setDate] = useState(todayISO())
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await logPayment(order.id, { amount: Number(amount), date, method })
      onDone()
    } catch (caught) {
      setError(caught)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-2xl bg-bg p-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount (PHP)"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input label="Date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <Input label="Method" as="select" value={method} onChange={(event) => setMethod(event.target.value)}>
        {PAYMENT_METHODS.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </Input>

      {error && (
        <p role="alert" className="text-small font-medium">
          Could not save the payment: {error.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save payment'}
        </Button>
      </div>
    </form>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const { orders } = useOrders()
  const [logging, setLogging] = useState(false)

  const order = orders.find((candidate) => String(candidate.id) === id)
  usePageTitle(order ? `Order #${order.id}` : 'Order not found')

  if (!order) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-heading font-bold">Order not found</h1>
        <p className="text-primary">There is no order #{id}. It may have been deleted.</p>
        <Button to="/orders">Back to orders</Button>
      </div>
    )
  }

  const total = getOrderTotal(order)
  const balance = getOrderBalance(order)
  const payments = order.payments.slice().sort((a, b) => b.date.localeCompare(a.date))
  const events = order.trackingEvents ?? []

  return (
    <div className="flex flex-col gap-4">
      <Link to="/orders" className="flex items-center gap-1 self-start text-small font-medium text-primary">
        <ChevronLeft size={16} />
        Orders
      </Link>

      {/* One column on a phone, two from 768px: order + items, then payments + tracking. */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-6">
        <div className="flex flex-col gap-4">
          <section className={CARD} aria-labelledby="order-heading">
            <div className="flex items-center justify-between gap-3">
              <h1 id="order-heading" className="text-heading font-bold">
                Order #{order.id}
              </h1>
              <StatusBadge status={order.status} />
            </div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-small">
              <dt className="text-primary">Proxy</dt>
              <dd className="break-words">{order.proxyName}</dd>
              <dt className="text-primary">Platform</dt>
              <dd className="break-words">{order.platform}</dd>
              <dt className="text-primary">Recipient</dt>
              <dd className="break-words">{order.recipient}</dd>
              <dt className="text-primary">Order date</dt>
              <dd>{formatDate(order.orderDate)}</dd>
            </dl>

            {order.notes && <p className="mt-3 break-words rounded-xl bg-bg p-3 text-small">{order.notes}</p>}

            <Button to={`/orders/${order.id}/edit`} variant="accent" className="mt-4">
              Edit order
            </Button>
          </section>

          <section className={CARD} aria-labelledby="items-heading">
            <h2 id="items-heading" className="mb-1 text-subheading font-bold">
              Items ({order.items.length})
            </h2>
            <ul>
              {order.items.map((item) => (
                <ItemRow key={item.id} name={item.name} price={item.price} quantity={item.quantity} />
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-accent pt-2 font-bold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={CARD} aria-labelledby="payments-heading">
            <div className="mb-1 flex items-center justify-between">
              <h2 id="payments-heading" className="text-subheading font-bold">
                Payments
              </h2>
              {payments.length > 0 && (
                <Link
                  to={`/payments?order=${order.id}`}
                  className="text-small font-medium text-primary underline underline-offset-2"
                >
                  View all
                </Link>
              )}
            </div>

            {payments.length === 0 ? (
              <p className="py-2 text-small text-primary">No payments logged yet.</p>
            ) : (
              <ul>
                {payments.map((payment) => (
                  <PaymentRow key={payment.id} amount={payment.amount} date={payment.date} method={payment.method} />
                ))}
              </ul>
            )}

            <p className="mt-2 flex justify-between border-t border-accent pt-2 font-bold">
              <span>{balance < 0 ? 'Overpaid by' : 'Remaining balance'}</span>
              <span>{formatMoney(Math.abs(balance))}</span>
            </p>

            {logging ? (
              <PaymentForm order={order} balance={balance} onDone={() => setLogging(false)} />
            ) : (
              <Button variant="accent" className="mt-4" onClick={() => setLogging(true)}>
                <Plus size={18} />
                Log payment
              </Button>
            )}
          </section>

          <section className={CARD} aria-labelledby="tracking-heading">
            <h2 id="tracking-heading" className="mb-2 text-subheading font-bold">
              Tracking
            </h2>

            {order.trackingNumber ? (
              <p className="mb-3 break-all text-small text-primary">Tracking #: {order.trackingNumber}</p>
            ) : (
              <p className="text-small text-primary">No tracking number yet. Add one by editing the order.</p>
            )}

            {events.length > 0 && (
              <ol className="flex flex-col gap-3">
                {events.map((event, index) => {
                  const latest = index === events.length - 1
                  return (
                    <li key={`${event.label}-${event.date}`} className="flex items-center gap-3">
                      <MapPin size={16} className={latest ? 'text-text' : 'text-primary'} />
                      <span className={`flex-1 ${latest ? 'font-bold' : ''}`}>{event.label}</span>
                      <span className="text-small text-primary">{formatDate(event.date)}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
