import { Link } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import StatusBadge from '../atoms/StatusBadge.jsx'

export default function OrderCard({ order }) {
  const count = order.items.length

  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-3 shadow-md transition-shadow hover:shadow-lg"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg text-primary">
          <Package size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">Order #{order.id}</span>
          <span className="block truncate text-small text-primary">
            {order.recipient} · {count} item{count === 1 ? '' : 's'}
          </span>
        </span>
        <StatusBadge status={order.status} />
        <ChevronRight size={18} className="shrink-0 text-primary" />
      </Link>
    </li>
  )
}
