import { formatMoney } from '../../lib/orders.js'

export default function ItemRow({ name, price, quantity }) {
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="break-words font-medium">{name}</p>
        <p className="text-small tabular-nums text-primary">
          {formatMoney(price)} × {quantity}
        </p>
      </div>
      <p className="shrink-0 font-semibold tabular-nums">{formatMoney(price * quantity)}</p>
    </li>
  )
}
