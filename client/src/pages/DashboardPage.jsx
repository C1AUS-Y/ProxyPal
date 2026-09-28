import { Link } from 'react-router-dom'
import { CheckCircle2, Package, Wallet } from 'lucide-react'
import OrderCard from '../components/molecules/OrderCard.jsx'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { formatMoney, getOrderBalance, isActive } from '../lib/orders.js'
import { PROFILE } from '../lib/profile.js'
import usePageTitle from '../lib/usePageTitle.js'

function SummaryBox({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-surface px-2 py-4 text-center shadow-md">
      <Icon size={20} className="text-primary" />
      <p className="max-w-full break-words text-body font-bold md:text-heading">{value}</p>
      <p className="text-small text-primary">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  usePageTitle('Home')
  const { orders } = useOrders()

  const active = orders.filter(isActive).length
  const completed = orders.length - active
  const owed = orders.reduce((sum, order) => sum + Math.max(getOrderBalance(order), 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading font-bold">Hi, {PROFILE.name}!</h1>
        <p className="text-small text-primary">Here&apos;s your proxy order overview.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <SummaryBox icon={Package} label="Active orders" value={active} />
        <SummaryBox icon={Wallet} label="Total owed" value={formatMoney(owed)} />
        <SummaryBox icon={CheckCircle2} label="Completed" value={completed} />
      </div>

      <section aria-labelledby="recent-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-heading" className="text-subheading font-bold">
            Recent orders
          </h2>
          {orders.length > 0 && (
            <Link to="/orders" className="text-small font-medium text-primary underline underline-offset-2">
              View all
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-md">
            <p className="text-primary">No orders yet. Log the first one to start tracking what you owe.</p>
            <Button to="/orders/new">Add an order</Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-4">
            {orders.slice(0, 4).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
