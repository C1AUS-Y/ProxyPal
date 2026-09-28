import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import SearchBar from '../components/molecules/SearchBar.jsx'
import PaymentRow from '../components/molecules/PaymentRow.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { formatDate, formatMoney, getAllPayments } from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

export default function PaymentsPage() {
  usePageTitle('Payments')
  const { orders } = useOrders()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  // Order Detail's "View all" link arrives here as /payments?order=12.
  const [params] = useSearchParams()
  const orderFilter = params.get('order')

  const all = getAllPayments(orders).filter((p) => !orderFilter || String(p.orderId) === orderFilter)
  const needle = query.trim().toLowerCase()
  const shown = needle ? all.filter((p) => `#${p.orderId} ${p.method} ${formatDate(p.date)}`.toLowerCase().includes(needle)) : all

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-heading font-bold">Payments</h1>

      {orderFilter && (
        <p className="text-small text-primary">
          Showing payments for Order #{orderFilter}.{' '}
          <Link to="/payments" className="font-medium underline underline-offset-2">
            Show all
          </Link>
        </p>
      )}

      <SearchBar
        label="Search payments"
        placeholder="Search payments..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {shown.length === 0 && (
        <p className="text-primary">
          {all.length === 0 ? 'No payments logged yet. Open an order to log one.' : `No payments match "${query.trim()}".`}
        </p>
      )}

      {shown.length > 0 && (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {shown.map((p) => (
              <PaymentRow
                key={p.id}
                amount={p.amount}
                date={p.date}
                method={p.method}
                orderRef={`Order #${p.orderId}`}
                to={`/orders/${p.orderId}`}
              />
            ))}
          </ul>

          <table className="hidden w-full border-separate border-spacing-y-2 text-left md:table">
            <thead>
              <tr className="text-small text-primary">
                <th scope="col" className="px-4 font-medium">Date</th>
                <th scope="col" className="px-4 font-medium">Order</th>
                <th scope="col" className="px-4 font-medium">Method</th>
                <th scope="col" className="px-4 text-right font-medium">Amount</th>
                <th scope="col" className="w-10"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/orders/${p.orderId}`)}
                  className="cursor-pointer bg-surface shadow-md transition-shadow hover:shadow-lg [&>td]:px-4 [&>td]:py-3 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
                >
                  <td>{formatDate(p.date)}</td>
                  <td>
                    <Link to={`/orders/${p.orderId}`} className="font-medium underline-offset-2 hover:underline">
                      Order #{p.orderId}
                    </Link>
                  </td>
                  <td>{p.method}</td>
                  <td className="text-right font-medium">{formatMoney(p.amount)}</td>
                  <td className="text-primary"><ChevronRight size={18} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
