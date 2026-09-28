import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import Button from '../components/atoms/Button.jsx'
import Input from '../components/atoms/Input.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { STATUSES, formatMoney, todayISO } from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

const blankItem = () => ({ key: crypto.randomUUID(), name: '', price: '', quantity: '1' })

function OrderForm({ existing }) {
  const navigate = useNavigate()
  const { orders, addOrder, editOrder, removeOrder } = useOrders()

  const [proxyName, setProxyName] = useState(existing?.proxyName ?? '')
  const [platform, setPlatform] = useState(existing?.platform ?? '')
  const [recipient, setRecipient] = useState(existing?.recipient ?? '')
  const [orderDate, setOrderDate] = useState(existing?.orderDate ?? todayISO())
  const [trackingNumber, setTrackingNumber] = useState(existing?.trackingNumber ?? '')
  const [status, setStatus] = useState(existing?.status ?? 'Ordered')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [items, setItems] = useState(
    existing
      ? existing.items.map((item) => ({
          key: String(item.id),
          id: item.id,
          name: item.name,
          price: String(item.price),
          quantity: String(item.quantity),
        }))
      : [blankItem()]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Suggest people you have ordered for before, so "Sister" is one tap.
  const recipients = [...new Set(['Me', ...orders.map((order) => order.recipient)])]

  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)

  const updateItem = (key, field, value) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [field]: value } : item)))

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const input = {
      proxyName: proxyName.trim(),
      platform: platform.trim(),
      recipient: recipient.trim(),
      orderDate,
      trackingNumber: trackingNumber.trim() || null,
      status,
      notes: notes.trim(),
      items: items.map(({ id, name, price, quantity }) => ({
        ...(id ? { id } : {}),
        name: name.trim(),
        price: Number(price),
        quantity: Number(quantity),
      })),
    }

    try {
      const saved = existing ? await editOrder(existing.id, input) : await addOrder(input)
      navigate(`/orders/${saved.id}`, { replace: true })
    } catch (caught) {
      setError(caught)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete Order #${existing.id}? Its items and payments go with it.`)) return
    setSaving(true)
    try {
      await removeOrder(existing.id)
      navigate('/orders', { replace: true })
    } catch (caught) {
      setError(caught)
      setSaving(false)
    }
  }

  const backTo = existing ? `/orders/${existing.id}` : '/orders'

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to={backTo} className="flex items-center gap-1 self-start text-small font-medium text-primary">
        <ChevronLeft size={16} />
        Back
      </Link>
      <h1 className="text-heading font-bold">{existing ? `Edit Order #${existing.id}` : 'Add order'}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Proxy name" required maxLength={120} value={proxyName} onChange={(e) => setProxyName(e.target.value)} />
        <Input label="Platform" required maxLength={120} value={platform} onChange={(e) => setPlatform(e.target.value)} />
      </div>

      <Input
        label="Recipient"
        required
        maxLength={120}
        list="recipient-options"
        placeholder="Me, Sister, Mom..."
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <datalist id="recipient-options">
        {recipients.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Order date" type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        <Input label="Tracking #" maxLength={80} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
      </div>

      <Input label="Status" as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </Input>

      <section aria-labelledby="form-items-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="form-items-heading" className="text-subheading font-bold">
            Items
          </h2>
          <Button variant="accent" onClick={() => setItems((current) => [...current, blankItem()])}>
            <Plus size={18} />
            Add item
          </Button>
        </div>

        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-b border-accent pb-3 last:border-0 md:grid-cols-[1fr_8rem_6rem_auto]"
            >
              <div className="col-span-3 md:col-span-1">
                <Input
                  label="Item name"
                  required
                  maxLength={200}
                  value={item.name}
                  onChange={(e) => updateItem(item.key, 'name', e.target.value)}
                />
              </div>
              <Input
                label="Price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                value={item.price}
                onChange={(e) => updateItem(item.key, 'price', e.target.value)}
              />
              <Input
                label="Qty"
                type="number"
                min="1"
                step="1"
                required
                value={item.quantity}
                onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
              />
              <button
                type="button"
                aria-label={`Remove item ${index + 1}`}
                disabled={items.length === 1}
                onClick={() => setItems((current) => current.filter((row) => row.key !== item.key))}
                className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-accent/60 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </p>
      </section>

      <Input
        label="Notes (optional)"
        as="textarea"
        rows={3}
        maxLength={2000}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && (
        <p role="alert" className="rounded-2xl bg-surface p-3 font-medium shadow-md">
          Could not save: {error.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button to={backTo} variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Confirm'}
        </Button>
      </div>

      {existing && (
        <Button variant="ghost" className="self-start" onClick={handleDelete} disabled={saving}>
          Delete this order
        </Button>
      )}
    </form>
  )
}

export default function AddEditOrderPage() {
  const { id } = useParams()
  const { orders } = useOrders()
  const existing = id ? orders.find((order) => String(order.id) === id) : null
  usePageTitle(id ? 'Edit order' : 'Add order')

  if (id && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-heading font-bold">Order not found</h1>
        <p className="text-primary">There is no order #{id} to edit.</p>
        <Button to="/orders">Back to orders</Button>
      </div>
    )
  }

  // key resets the form if you go from one order's edit page straight to another.
  return <OrderForm key={id ?? 'new'} existing={existing} />
}
