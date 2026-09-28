import { Outlet } from 'react-router-dom'
import TopBar from '../components/organisms/TopBar.jsx'
import TabBar from '../components/organisms/TabBar.jsx'
import DemoNotice from '../components/DemoNotice.jsx'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'

export default function AppLayout() {
  const { status, error, slow, reload } = useOrders()

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <TopBar />
      <TabBar />

      {/* md:pl-24 leaves room for the tab rail on wider screens. */}
      <div className="md:pl-24">
        <DemoNotice />
        <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:pb-10">
          {/* Four states, not two: loading, error, empty and data are different
              screens. Empty is handled by each page; the first two live here
              because every page needs the orders before it can draw anything. */}
          {status === 'loading' && (
            <p role="status" className="text-primary">
              Loading your orders{slow ? '. The server may be waking up, which can take up to a minute.' : '...'}
            </p>
          )}

          {status === 'error' && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-md">
              <p>Could not load your orders: {error?.message}</p>
              <Button onClick={reload}>Try again</Button>
            </div>
          )}

          {status === 'ready' && <Outlet />}
        </main>
      </div>
    </div>
  )
}
