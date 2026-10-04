import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import TopBar from '../components/organisms/TopBar.jsx'
import TabBar from '../components/organisms/TabBar.jsx'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'

function LoadingSkeleton({ slow }) {
  return (
    <div role="status" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-9 w-56" />
        <div className="skeleton h-4 w-40" />
      </div>
      <div className="skeleton h-44 w-full !rounded-4xl" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((n) => (
          <div key={n} className="skeleton h-[74px] w-full !rounded-3xl" />
        ))}
      </div>
      <p className="text-center text-small text-primary">
        Loading your orders{slow ? '. The server may be waking up, which can take up to a minute.' : '...'}
      </p>
    </div>
  )
}

export default function AppLayout() {
  const { status, error, slow, reload } = useOrders()
  const { pathname } = useLocation()

  const showFab = status === 'ready' && (pathname === '/' || pathname === '/orders')

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-float"
      >
        Skip to content
      </a>
      <TopBar />
      <TabBar />

      <div className="md:pl-28">
        <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-32 pt-4 md:pb-12">
          {status === 'loading' && <LoadingSkeleton slow={slow} />}

          {status === 'error' && (
            <div role="alert" className="card pop flex flex-col items-start gap-3 p-5">
              <p>Could not load your orders: {error?.message}</p>
              <Button onClick={reload}>Try again</Button>
            </div>
          )}

          {status === 'ready' && <Outlet />}
        </main>
      </div>

      {showFab && (
        <Link
          to="/orders/new"
          aria-label="New order"
          className="pop press group fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-text text-surface shadow-float md:bottom-8 md:right-8"
        >
          <Plus size={26} strokeWidth={2.25} className="transition-transform duration-500 ease-spring group-hover:rotate-90" />
        </Link>
      )}
    </div>
  )
}
