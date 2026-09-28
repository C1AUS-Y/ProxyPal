import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { formatDate, formatMoney } from '../../lib/orders.js'

// A plain row inside a card (Order Detail), or a tappable card that opens the
// order it belongs to (Payments) when given `to`.
export default function PaymentRow({ amount, date, method, orderRef, to }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p>{formatDate(date)}</p>
        <p className="truncate text-small text-primary">{orderRef ? `${orderRef} · ${method}` : method}</p>
      </div>
      <p className="shrink-0 font-medium">{formatMoney(amount)}</p>
    </>
  )

  if (to) {
    return (
      <li>
        <Link
          to={to}
          className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-md transition-shadow hover:shadow-lg"
        >
          {content}
          <ChevronRight size={18} className="shrink-0 text-primary" />
        </Link>
      </li>
    )
  }

  return <li className="flex items-center justify-between gap-4 border-b border-accent py-2 last:border-0">{content}</li>
}
