import { User } from 'lucide-react'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { formatMoney, getAllPayments } from '../lib/orders.js'
import { PROFILE } from '../lib/profile.js'
import usePageTitle from '../lib/usePageTitle.js'

export default function AccountPage() {
  usePageTitle('Account')
  const { orders } = useOrders()

  const payments = getAllPayments(orders)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  const stats = [
    ['Orders logged', orders.length],
    ['Payments logged', payments.length],
    ['Total paid', formatMoney(totalPaid)],
  ]

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-primary shadow-md">
        <User size={44} />
      </div>
      <h1 className="text-heading font-bold">{PROFILE.name}</h1>

      <dl className="w-full overflow-hidden rounded-2xl bg-surface shadow-md">
        {stats.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-accent px-4 py-3 last:border-0">
            <dt className="text-primary">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <Button className="w-full" disabled>
        Log out
      </Button>
      <p className="text-center text-small text-primary">
        Sign-in arrives with the database, so there is nothing to log out of yet.
      </p>
    </div>
  )
}
