import { Link } from 'react-router-dom'
import { ChevronRight, Wallet } from 'lucide-react'
import { formatDate, formatMoney } from '../../lib/orders.js'

export default function PaymentRow({ amount, date, method, orderRef, to, index = 0 }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{formatDate(date)}</p>
        <p className="truncate text-small text-primary">{orderRef ? `${orderRef} · ${method}` : method}</p>
      </div>
      <p className="shrink-0 font-semibold tabular-nums">{formatMoney(amount)}</p>
    </>
  )

  if (to) {
    return (
      <li className="rise" style={{ '--i': index }}>
        <Link to={to} className="card lift press group flex items-center gap-3.5 px-4 py-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-text/[0.06] text-text transition duration-300 ease-spring group-hover:scale-105">
            <Wallet size={22} strokeWidth={1.75} />
          </span>
          {content}
          <ChevronRight size={18} className="shrink-0 text-primary/60 transition duration-300 ease-ios group-hover:translate-x-1" />
        </Link>
      </li>
    )
  }

  return <li className="flex items-center justify-between gap-4 px-5 py-3.5">{content}</li>
}
