import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil, Plus } from 'lucide-react'
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
  getOrderPaid,
  getOrderTotal,
  todayISO,
} from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

const CARD = 'card rise overflow-hidden'

function BackLink({ to, children }) {
  return (
    <Link to={to} className="press -ml-1 flex items-center gap-0.5 self-start rounded-full py-1 pl-1 pr-3 text-small font-semibold text-primary hover:text-text">
      <ChevronLeft size={18} />
      {children}
    </Link>
  )
}

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
    <form onSubmit={handleSubmit} className="pop mx-5 mb-5 flex flex-col gap-3 rounded-3xl bg-text/[0.04] p-4 ring-1 ring-text/[0.05]">
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
      <div className="pop flex flex-col items-start gap-4">
        <h1 className="text-heading font-bold">Order not found</h1>
        <p className="text-primary">There is no order #{id}. It may have been deleted.</p>
        <Button to="/orders">Back to orders</Button>
      </div>
    )
  }

  const total = getOrderTotal(order)
  const paid = getOrderPaid(order)
  const balance = getOrderBalance(order)
  const percent = total > 0 ? Math.min(Math.max(paid / total, 0), 1) * 100 : 0
  const payments = order.payments.slice().sort((a, b) => b.date.localeCompare(a.date))
  const events = order.trackingEvents ?? []

  const details = [
    ['Proxy', order.proxyName],
    ['Platform', order.platform],
    ['Recipient', order.recipient],
    ['Order date', formatDate(order.orderDate)],
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="rise">
        <BackLink to="/orders">Orders</BackLink>
      </div>

      {/* One column on a phone, two from 768px: order + items, then payments + tracking. */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-6">
        <div className="flex flex-col gap-4">
          <section className={CARD} aria-labelledby="order-heading" style={{ '--i': 1 }}>
            <div className="flex items-center justify-between gap-3 p-5">
              <h1 id="order-heading" className="text-heading font-bold">
                Order #{order.id}
              </h1>
              <StatusBadge status={order.status} />
            </div>

            <dl className="divided border-t border-text/[0.08]">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 px-5 py-3">
                  <dt className="text-primary">{label}</dt>
                  <dd className="break-words text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            {order.notes && (
              <p className="mx-5 mt-2 break-words rounded-2xl bg-text/[0.05] p-4 text-small">{order.notes}</p>
            )}

            <div className="p-5">
              <Button to={`/orders/${order.id}/edit`} variant="accent">
                <Pencil size={16} />
                Edit order
              </Button>
            </div>
          </section>

          <section className={CARD} aria-labelledby="items-heading" style={{ '--i': 2 }}>
            <h2 id="items-heading" className="px-5 pb-1 pt-5 text-subheading font-semibold">
              Items ({order.items.length})
            </h2>
            <ul className="divided">
              {order.items.map((item) => (
                <ItemRow key={item.id} name={item.name} price={item.price} quantity={item.quantity} />
              ))}
            </ul>
            <p className="flex justify-between border-t border-text/[0.08] px-5 py-4 text-subheading font-semibold tabular-nums">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={CARD} aria-labelledby="payments-heading" style={{ '--i': 3 }}>
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 id="payments-heading" className="text-subheading font-semibold">
                Payments
              </h2>
              {payments.length > 0 && (
                <Link to={`/payments?order=${order.id}`} className="press text-small font-semibold text-primary hover:text-text">
                  View all
                </Link>
              )}
            </div>

            {/* How much of the total is paid, as a bar that fills in. */}
            <div className="px-5 pb-4 pt-3">
              <div
                role="progressbar"
                aria-label="Paid so far"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(percent)}
                className="h-2.5 overflow-hidden rounded-full bg-text/10"
              >
                <div className="bar-grow h-full rounded-full bg-text" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 flex justify-between text-small tabular-nums text-primary">
                <span>{formatMoney(paid)} paid</span>
                <span>{formatMoney(total)}</span>
              </p>
            </div>

            {payments.length === 0 ? (
              <p className="border-t border-text/[0.08] px-5 py-4 text-small text-primary">No payments logged yet.</p>
            ) : (
              <ul className="divided border-t border-text/[0.08]">
                {payments.map((payment) => (
                  <PaymentRow key={payment.id} amount={payment.amount} date={payment.date} method={payment.method} />
                ))}
              </ul>
            )}

            <p className="flex justify-between border-t border-text/[0.08] px-5 py-4 text-subheading font-semibold tabular-nums">
              <span>{balance < 0 ? 'Overpaid by' : 'Remaining balance'}</span>
              <span>{formatMoney(Math.abs(balance))}</span>
            </p>

            {logging ? (
              <PaymentForm order={order} balance={balance} onDone={() => setLogging(false)} />
            ) : (
              <div className="px-5 pb-5">
                <Button variant="accent" onClick={() => setLogging(true)}>
                  <Plus size={18} />
                  Log payment
                </Button>
              </div>
            )}
          </section>

          <section className={`${CARD} p-5`} aria-labelledby="tracking-heading" style={{ '--i': 4 }}>
            <h2 id="tracking-heading" className="mb-3 text-subheading font-semibold">
              Tracking
            </h2>

            {order.trackingNumber ? (
              <p className="mb-4 break-all rounded-2xl bg-text/[0.05] px-4 py-3 text-small tabular-nums text-primary">
                Tracking #: <span className="font-semibold text-text">{order.trackingNumber}</span>
              </p>
            ) : (
              <p className="text-small text-primary">No tracking number yet. Add one by editing the order.</p>
            )}

            {events.length > 0 && (
              <ol className="mt-1 flex flex-col">
                {events.map((event, index) => {
                  const latest = index === events.length - 1
                  return (
                    <li key={`${event.label}-${event.date}`} className="relative flex items-baseline gap-3 pb-5 pl-7 last:pb-0">
                      {index < events.length - 1 && (
                        <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-3 w-px bg-text/15" />
                      )}
                      <span aria-hidden="true" className="absolute left-0 top-1.5 flex h-[13px] w-[13px] items-center justify-center">
                        {latest && <span className="ping-soft absolute inset-0 rounded-full bg-text" />}
                        <span className={`relative h-[13px] w-[13px] rounded-full ${latest ? 'bg-text' : 'bg-text/25'}`} />
                      </span>
                      <div className={`flex-1 ${latest ? 'font-semibold' : 'text-primary'}`}>
                        <p>{event.label}</p>
                        {event.description && (
                          <p className="mt-1 text-small font-normal text-primary">{event.description}</p>
                        )}
                        {event.location && (
                          <p className="mt-1 text-small font-normal text-primary">{event.location}</p>
                        )}
                      </div>
                      <span className="text-small tabular-nums text-primary">{formatDate(event.date)}</span>
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
