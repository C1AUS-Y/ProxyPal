import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  addPayment,
} from '../api'
import { sortOrders } from '../lib/orders.js'

// State ownership, as planned in docs/01-proposal.md: App owns the orders, with
// items and payments nested inside each one. Screens read them from here and
// change them through the functions below. Nothing else holds a copy.

const OrdersContext = createContext(null)

const replaceOrder = (orders, updated) =>
  orders.map((order) => (String(order.id) === String(updated.id) ? updated : order))

export function OrdersProvider({ children }) {
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)
  const [slow, setSlow] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)

    // A free-tier API sleeps. If this takes a while, say so instead of
    // spinning silently, which looks broken.
    const timer = setTimeout(() => setSlow(true), 3000)

    try {
      setOrders(sortOrders(await listOrders()))
      setStatus('ready')
    } catch (caught) {
      setError(caught)
      setStatus('error')
    } finally {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // The four functions below throw on failure. The screen that called them
  // catches and shows the message next to the form the person is looking at.
  const addOrder = async (input) => {
    const created = await createOrder(input)
    setOrders((current) => sortOrders([created, ...current]))
    return created
  }

  const editOrder = async (id, input) => {
    const updated = await updateOrder(id, input)
    setOrders((current) => sortOrders(replaceOrder(current, updated)))
    return updated
  }

  const removeOrder = async (id) => {
    await deleteOrder(id)
    setOrders((current) => current.filter((order) => String(order.id) !== String(id)))
  }

  const logPayment = async (orderId, payment) => {
    const updated = await addPayment(orderId, payment)
    setOrders((current) => replaceOrder(current, updated))
    return updated
  }

  const value = { status, orders, error, slow, reload: load, addOrder, editOrder, removeOrder, logPayment }

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) throw new Error('useOrders must be used inside <OrdersProvider>')
  return context
}
