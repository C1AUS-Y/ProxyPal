import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { listOrders, createOrder, updateOrder, deleteOrder, addPayment } from '../api'
import { sortOrders } from '../lib/orders.js'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading')
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)
  const [slow, setSlow] = useState(false)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setStatus('loading')
    setError(null)

    const timer = showLoading ? setTimeout(() => setSlow(true), 3000) : null

    try {
      const freshOrders = await listOrders()
      setOrders(sortOrders(freshOrders))
      setStatus('ready')
    } catch (caught) {
      setError(caught)
      if (showLoading) setStatus('error')
    } finally {
      if (timer) clearTimeout(timer)
      if (showLoading) setSlow(false)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setOrders([])
      return
    }

    load()

    // check for 17track updates every 15 seconds
    const interval = setInterval(() => load(false), 15000)

    return () => clearInterval(interval)
  }, [user?.id, load])

  async function addOrder(input) {
    const created = await createOrder(input)
    setOrders(current => sortOrders([created, ...current]))
    return created
  }

  async function editOrder(id, input) {
    const updated = await updateOrder(id, input)
    setOrders(current =>
      sortOrders(
        current.map(order =>
          String(order.id) === String(updated.id) ? updated : order
        )
      )
    )
    return updated
  }

  async function removeOrder(id) {
    await deleteOrder(id)
    setOrders(current => current.filter(order => String(order.id) !== String(id)))
  }

  async function logPayment(orderId, payment) {
    const updated = await addPayment(orderId, payment)
    setOrders(current =>
      current.map(order =>
        String(order.id) === String(updated.id) ? updated : order
      )
    )
    return updated
  }

  return (
    <OrdersContext.Provider
      value={{
        status,
        orders,
        error,
        slow,
        reload: load,
        addOrder,
        editOrder,
        removeOrder,
        logPayment,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)

  if (!context) {
    throw new Error('useOrders must be used inside OrdersProvider')
  }

  return context
}