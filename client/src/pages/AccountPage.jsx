import { LogOut } from 'lucide-react'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { formatMoney, getAllPayments } from '../lib/orders.js'
import { getDisplayName } from '../lib/profile.js'
import usePageTitle from '../lib/usePageTitle.js'
import { supabase } from '../lib/supabaseClient.js'

export default function AccountPage() {
  usePageTitle('Account')
  const { orders } = useOrders()
  const { user } = useAuth()

  const payments = getAllPayments(orders)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const name = getDisplayName(user)

  const stats = [
    ['Orders logged', orders.length],
    ['Payments logged', payments.length],
    ['Total paid', formatMoney(totalPaid)],
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-4">
      <div className="rise relative">
        <div aria-hidden="true" className="float-slow absolute inset-0 -z-10 scale-125 rounded-full bg-text/10 blur-2xl" />
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-text text-[44px] font-bold text-surface shadow-float ring-4 ring-surface">
          {name.trim().charAt(0).toUpperCase() || 'P'}
        </div>
      </div>

      <div className="rise text-center" style={{ '--i': 1 }}>
        <h1 className="text-heading font-bold">{name}</h1>
        <p className="text-small text-primary">{user?.email}</p>
      </div>

      <dl className="card divided rise w-full overflow-hidden" style={{ '--i': 2 }}>
        {stats.map(([label, value]) => (
          <div key={label} className="flex justify-between px-5 py-4">
            <dt className="text-primary">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="rise w-full" style={{ '--i': 3 }}>
        <Button variant="accent" className="w-full" onClick={handleLogout}>
          <LogOut size={18} />
          Log out
        </Button>
      </div>
    </div>
  )
}
