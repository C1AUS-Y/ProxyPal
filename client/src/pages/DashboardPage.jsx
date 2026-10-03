import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Package, Wallet } from 'lucide-react'
import OrderCard from '../components/molecules/OrderCard.jsx'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { formatMoney, getOrderBalance, isActive } from '../lib/orders.js'
import { getDisplayName } from '../lib/profile.js'
import useCountUp from '../lib/useCountUp.js'
import usePageTitle from '../lib/usePageTitle.js'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-surface/10 p-3.5 ring-1 ring-surface/15 backdrop-blur-md">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface/15">
        <Icon size={19} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-subheading font-bold tabular-nums leading-6">{value}</p>
        <p className="truncate text-small opacity-70">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  usePageTitle('Home')
  const { orders } = useOrders()
  const { user } = useAuth()

  const active = orders.filter(isActive).length
  const completed = orders.length - active
  const owed = orders.reduce((sum, order) => sum + Math.max(getOrderBalance(order), 0), 0)

  const owedShown = useCountUp(owed)
  const activeShown = Math.round(useCountUp(active, 800))
  const completedShown = Math.round(useCountUp(completed, 800))

  return (
    <div className="flex flex-col gap-7">
      <div className="rise">
        <p className="text-small font-medium text-primary">{greeting()}</p>
        <h1 className="text-heading font-bold">{getDisplayName(user)}</h1>
      </div>

      <section
        aria-label="Overview"
        className="rise relative overflow-hidden rounded-4xl bg-text p-6 text-surface shadow-float"
        style={{ '--i': 1 }}
      >
        <div aria-hidden="true" className="drift pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-surface/15 blur-3xl" />
        <div
          aria-hidden="true"
          className="float-slow pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-surface/10 blur-3xl"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-surface/10 via-transparent to-transparent" />

        <div className="relative">
          <p className="flex items-center gap-2 text-small font-medium opacity-70">
            <Wallet size={15} />
            Total owed
          </p>
          <p className="mt-1 break-words text-[44px] font-bold leading-[1.05] tracking-tight tabular-nums sm:text-[56px]">
            {formatMoney(owedShown)}
          </p>
          <p className="mt-1 text-small opacity-70">
            {active === 0 ? 'Nothing waiting on delivery.' : `Across ${active} active order${active === 1 ? '' : 's'}.`}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <MiniStat icon={Package} label="Active orders" value={activeShown} />
            <MiniStat icon={CheckCircle2} label="Completed" value={completedShown} />
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="rise" style={{ '--i': 2 }}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 id="recent-heading" className="text-subheading font-semibold">
            Recent orders
          </h2>
          {orders.length > 0 && (
            <Link to="/orders" className="press flex items-center gap-0.5 text-small font-semibold text-primary hover:text-text">
              View all
              <ChevronRight size={15} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-text/[0.06]">
              <Package size={26} strokeWidth={1.5} />
            </span>
            <p className="max-w-xs text-primary">No orders yet. Log the first one to start tracking what you owe.</p>
            <Button to="/orders/new">Add an order</Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            {orders.slice(0, 4).map((order, index) => (
              <OrderCard key={order.id} order={order} index={index + 3} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
