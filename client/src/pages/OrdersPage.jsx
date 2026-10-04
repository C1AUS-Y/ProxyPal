import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Package } from 'lucide-react'
import SearchBar from '../components/molecules/SearchBar.jsx'
import Segmented from '../components/molecules/Segmented.jsx'
import OrderCard from '../components/molecules/OrderCard.jsx'
import StatusBadge from '../components/atoms/StatusBadge.jsx'
import Button from '../components/atoms/Button.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { formatMoney, getOrderBalance, getOrderTotal, isActive } from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
]

const matches = (order, query) =>
  [`#${order.orderNo}`, order.proxyName, order.recipient, order.platform, order.status, ...order.items.map((i) => i.name)]
    .join(' ')
    .toLowerCase()
    .includes(query)

function Balance({ order }) {
  const balance = getOrderBalance(order)
  if (balance > 0) return <span className="font-semibold tabular-nums">{formatMoney(balance)}</span>
  return <span className="text-primary">{balance < 0 ? 'Overpaid' : 'Paid'}</span>
}

export default function OrdersPage() {
  usePageTitle('Orders')
  const { orders } = useOrders()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const needle = query.trim().toLowerCase()
  const shown = orders
    .filter((order) => filter === 'all' || (filter === 'active' ? isActive(order) : !isActive(order)))
    .filter((order) => !needle || matches(order, needle))

  return (
    <div className="flex flex-col gap-5">
      <h1 className="rise text-heading font-bold">Orders</h1>

      <div className="rise flex flex-col gap-3 md:flex-row md:items-center" style={{ '--i': 1 }}>
        <div className="md:flex-1">
          <SearchBar
            label="Search orders"
            placeholder="Search orders"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="md:w-72">
          <Segmented label="Filter orders" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
      </div>

      {orders.length === 0 && (
        <div className="card pop flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-text/[0.06]">
            <Package size={26} strokeWidth={1.5} />
          </span>
          <p className="text-primary">No orders yet.</p>
          <Button to="/orders/new">Add an order</Button>
        </div>
      )}

      {orders.length > 0 && shown.length === 0 && (
        <p className="pop py-8 text-center text-primary">
          {needle ? <>No orders match &ldquo;{query.trim()}&rdquo;.</> : 'No orders in this view.'}
        </p>
      )}

      {shown.length > 0 && (
        <>
          {/* Phone: stacked cards. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {shown.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index + 2} />
            ))}
          </ul>

          {/* 768px and up: one card holding the table. */}
          <div className="card rise hidden overflow-hidden md:block" style={{ '--i': 2 }}>
            <table className="w-full text-left">
              <thead>
                <tr className="text-small text-primary">
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Order</th>
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Recipient</th>
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Platform</th>
                  <th scope="col" className="px-5 pb-2 pt-4 font-medium">Status</th>
                  <th scope="col" className="px-5 pb-2 pt-4 text-right font-medium">Total</th>
                  <th scope="col" className="px-5 pb-2 pt-4 text-right font-medium">Balance</th>
                  <th scope="col" className="w-10 pb-2 pt-4"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="group cursor-pointer border-t border-text/[0.07] transition-colors duration-200 hover:bg-text/[0.04] [&>td]:px-5 [&>td]:py-3.5"
                  >
                    <td>
                      <Link to={`/orders/${order.id}`} className="font-semibold">
                        #{order.orderNo}
                      </Link>
                    </td>
                    <td>{order.recipient}</td>
                    <td>{order.platform}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="text-right tabular-nums">{formatMoney(getOrderTotal(order))}</td>
                    <td className="text-right"><Balance order={order} /></td>
                    <td className="pr-3 text-primary/60">
                      <ChevronRight size={18} className="transition duration-300 ease-ios group-hover:translate-x-1 group-hover:text-text" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}