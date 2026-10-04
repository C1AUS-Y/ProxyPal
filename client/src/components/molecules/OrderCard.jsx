import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import StatusBadge from '../atoms/StatusBadge.jsx'

export default function OrderCard({ order, index = 0 }) {
  const count = order.items.length

  return (
    <li className="rise" style={{ '--i': index }}>
      <Link to={`/orders/${order.id}`} className="card lift press group flex items-center gap-3.5 px-4 py-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-text/[0.06] text-text transition duration-300 ease-spring group-hover:scale-105 group-hover:bg-text group-hover:text-surface">
          <Package size={22} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">Order #{order.orderNo}</span>
          <span className="block truncate text-small text-primary">
            {order.recipient} · {count} item{count === 1 ? '' : 's'}
          </span>
        </span>
        <StatusBadge status={order.status} />
        <ChevronRight
          size={18}
          className="shrink-0 text-primary/60 transition duration-300 ease-ios group-hover:translate-x-1 group-hover:text-text"
        />
      </Link>
    </li>
  )
}