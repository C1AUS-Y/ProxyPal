import { NavLink } from 'react-router-dom'
import { Home, MoreHorizontal, ShoppingBag, Wallet } from 'lucide-react'

const TABS = [
  { label: 'Home', to: '/', Icon: Home, end: true },
  { label: 'Orders', to: '/orders', Icon: ShoppingBag },
  { label: 'Payments', to: '/payments', Icon: Wallet },
  { label: 'More', to: '/account', Icon: MoreHorizontal },
]

// Bottom bar on a phone, a rail down the left side from 768px up.
export default function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around bg-accent px-2 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:inset-x-auto md:bottom-0 md:left-0 md:top-14 md:w-24 md:flex-col md:items-center md:justify-start md:gap-4 md:px-0 md:pt-6 md:shadow-[2px_0_10px_rgba(0,0,0,0.1)]"
    >
      {TABS.map(({ label, to, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="flex flex-col items-center gap-1 text-small font-medium text-text">
          {({ isActive }) => (
            <>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition-colors ${
                  isActive ? 'bg-text text-surface' : 'bg-bg text-primary'
                }`}
              >
                <Icon size={20} />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
