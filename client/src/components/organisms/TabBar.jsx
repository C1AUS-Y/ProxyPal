import { NavLink, useLocation } from 'react-router-dom'
import { Home, MoreHorizontal, ShoppingBag, Wallet } from 'lucide-react'

const TABS = [
  { label: 'Home', to: '/', Icon: Home, end: true },
  { label: 'Orders', to: '/orders', Icon: ShoppingBag },
  { label: 'Payments', to: '/payments', Icon: Wallet },
  { label: 'More', to: '/account', Icon: MoreHorizontal },
]

export default function TabBar() {
  const { pathname } = useLocation()
  const index = TABS.findIndex(({ to, end }) => (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)))

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm md:inset-x-auto md:bottom-auto md:left-5 md:top-1/2 md:mx-0 md:max-w-none md:-translate-y-1/2"
    >
      <div className="glass rounded-[30px] p-1.5 shadow-float ring-1 ring-text/[0.08]">
        <div
          className="relative grid grid-cols-4 md:w-[72px] md:grid-cols-1"
          style={{ '--i': Math.max(index, 0) }}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 top-0 h-full w-1/4 translate-x-[calc(var(--i)*100%)] transition-all duration-500 ease-ios md:h-1/4 md:w-full md:translate-x-0 md:translate-y-[calc(var(--i)*100%)] ${
              index < 0 ? 'scale-90 opacity-0' : 'opacity-100'
            }`}
          >
            <span className="block h-full w-full rounded-[24px] bg-text shadow-pop" />
          </span>

          {TABS.map(({ label, to, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="press relative z-10 flex h-14 flex-col items-center justify-center gap-0.5 rounded-[24px] text-[11px] font-semibold md:h-[68px]"
            >
              {({ isActive }) => (
                <span
                  className={`flex flex-col items-center gap-0.5 transition-colors duration-300 ${
                    isActive ? 'text-surface' : 'text-primary'
                  }`}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.25 : 1.75} />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
