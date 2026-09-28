import { formatMoney } from '../../lib/orders.js'

export default function ItemRow({ name, price, quantity }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-accent py-2 last:border-0">
      <div className="min-w-0">
        <p className="break-words">{name}</p>
        <p className="text-small text-primary">
          {formatMoney(price)} x {quantity}
        </p>
      </div>
      <p className="shrink-0 font-medium">{formatMoney(price * quantity)}</p>
    </li>
  )
}
