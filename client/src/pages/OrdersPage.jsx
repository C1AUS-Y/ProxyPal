import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import SearchBar from '../components/molecules/SearchBar.jsx'
import OrderCard from '../components/molecules/OrderCard.jsx'
import StatusBadge from '../components/atoms/StatusBadge.jsx'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { formatMoney, getOrderBalance, getOrderTotal } from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

const matches = (order, query) =>
  [`#${order.id}`, order.proxyName, order.recipient, order.platform, order.status, ...order.items.map((i) => i.name)]
    .join(' ')
    .toLowerCase()
    .includes(query)

function Balance({ order }) {
  const balance = getOrderBalance(order)
  if (balance > 0) return <span className="font-bold">{formatMoney(balance)}</span>
  return <span className="text-primary">{balance < 0 ? 'Overpaid' : 'Paid'}</span>
}

export default function OrdersPage() {
  usePageTitle('Orders')
  const { orders } = useOrders()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const shown = needle ? orders.filter((order) => matches(order, needle)) : orders

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-heading font-bold">Orders</h1>

      <SearchBar
        label="Search orders"
        placeholder="Search orders..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {orders.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-md">
          <p className="text-primary">No orders yet.</p>
          <Button to="/orders/new">Add an order</Button>
        </div>
      )}

      {orders.length > 0 && shown.length === 0 && (
        <p className="text-primary">No orders match &ldquo;{query.trim()}&rdquo;.</p>
      )}

      {shown.length > 0 && (
        <>
          {/* Phone: stacked cards. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {shown.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>

          {/* 768px and up: table rows. */}
          <table className="hidden w-full border-separate border-spacing-y-2 text-left md:table">
            <thead>
              <tr className="text-small text-primary">
                <th scope="col" className="px-4 font-medium">Order</th>
                <th scope="col" className="px-4 font-medium">Recipient</th>
                <th scope="col" className="px-4 font-medium">Platform</th>
                <th scope="col" className="px-4 font-medium">Status</th>
                <th scope="col" className="px-4 text-right font-medium">Total</th>
                <th scope="col" className="px-4 text-right font-medium">Balance</th>
                <th scope="col" className="w-10"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="cursor-pointer bg-surface shadow-md transition-shadow hover:shadow-lg [&>td]:px-4 [&>td]:py-3 [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
                >
                  <td>
                    <Link to={`/orders/${order.id}`} className="font-medium underline-offset-2 hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td>{order.recipient}</td>
                  <td>{order.platform}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="text-right">{formatMoney(getOrderTotal(order))}</td>
                  <td className="text-right"><Balance order={order} /></td>
                  <td className="text-primary"><ChevronRight size={18} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <Link
        to="/orders/new"
        aria-label="New order"
        className="fixed bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-surface shadow-lg transition-colors hover:bg-text md:bottom-8 md:right-8"
      >
        <Plus size={26} />
      </Link>
    </div>
  )
}
