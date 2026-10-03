import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Wallet } from 'lucide-react'
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
  const shownTotal = shown.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="rise">
        <h1 className="text-heading font-bold">Payments</h1>
        {shown.length > 0 && (
          <p className="text-small tabular-nums text-primary">
            {shown.length} payment{shown.length === 1 ? '' : 's'} · {formatMoney(shownTotal)} total
          </p>
        )}
      </div>

      {orderFilter && (
        <p className="pop self-start rounded-full bg-text/[0.06] px-4 py-2 text-small text-primary">
          Showing payments for Order #{orderFilter}.{' '}
          <Link to="/payments" className="font-semibold text-text underline underline-offset-2">
            Show all
          </Link>
        </p>
      )}

      <div className="rise" style={{ '--i': 1 }}>
        <SearchBar
          label="Search payments"
          placeholder="Search payments"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {shown.length === 0 && (
        <div className="pop flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-text/[0.06]">
            <Wallet size={26} strokeWidth={1.5} />
          </span>
          <p className="max-w-xs text-primary">
            {all.length === 0 ? 'No payments logged yet. Open an order to log one.' : `No payments match "${query.trim()}".`}
          </p>
        </div>
      )}

      {shown.length > 0 && (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {shown.map((p, index) => (
              <PaymentRow
                key={p.id}
                index={index + 2}
                amount={p.amount}
                date={p.date}
                method={p.method}
                orderRef={`Order #${p.orderId}`}
                to={`/orders/${p.orderId}`}
              />
            ))}
          </ul>

          <div className="card rise hidden overflow-hidden md:block" style={{ '--i': 2 }}>
            <table className="w-full text-left">
              <thead>
                <tr className="text-small text-primary">
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Date</th>
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Order</th>
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Method</th>
                  <th scope="col" className="px-5 pb-2 pt-4 text-right font-medium">Amount</th>
                  <th scope="col" className="w-10 pb-2 pt-4"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/orders/${p.orderId}`)}
                    className="group cursor-pointer border-t border-text/[0.07] transition-colors duration-200 hover:bg-text/[0.04] [&>td]:px-5 [&>td]:py-3.5"
                  >
                    <td>{formatDate(p.date)}</td>
                    <td>
                      <Link to={`/orders/${p.orderId}`} className="font-semibold">
                        Order #{p.orderId}
                      </Link>
                    </td>
                    <td>{p.method}</td>
                    <td className="text-right font-semibold tabular-nums">{formatMoney(p.amount)}</td>
                    <td className="pr-3 text-primary/60">
                      <ChevronRight size={18} className="transition duration-300 ease-ios group-hover:translate-x-1 group-hover:text-text" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
