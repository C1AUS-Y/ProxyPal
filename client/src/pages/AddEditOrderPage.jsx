import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import Button from '../components/atoms/Button.jsx'
import Input from '../components/atoms/Input.jsx'
import { useOrders } from '../orders/OrdersContext.jsx'
import { suggestCarriers, searchCarriers, lookupCarrier, listCarrierCountries } from '../api'
import { formatMoney, todayISO } from '../lib/orders.js'
import usePageTitle from '../lib/usePageTitle.js'

const newItem = () => ({
  key: crypto.randomUUID(),
  name: '',
  price: '',
  quantity: '1',
})

const COUNTRY_KEY = 'proxypal.courierCountry'

function readSavedCountry() {
  try {
    return localStorage.getItem(COUNTRY_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveCountry(code) {
  try {
    localStorage.setItem(COUNTRY_KEY, code)
  } catch {
    // private mode etc. The choice just won't be remembered
  }
}

const carrierLabel = carrier => `${carrier.name} [${carrier.code}]`

function CarrierPicker({ value, trackingNumber, onChange }) {
  const [suggestions, setSuggestions] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [lookupError, setLookupError] = useState(null)
  const [country, setCountry] = useState(readSavedCountry)
  const [countryCodes, setCountryCodes] = useState([])

  const countryOptions = useMemo(() => {
    let names = null
    try {
      names = new Intl.DisplayNames(['en'], { type: 'region' })
    } catch {
      // older browser: fall back to the code
    }

    const nameOf = code => {
      try {
        return names?.of(code) ?? code
      } catch {
        return code
      }
    }

    return countryCodes
      .map(({ code }) => ({ code, name: nameOf(code) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [countryCodes])

  useEffect(() => {
    listCarrierCountries()
      .then(setCountryCodes)
      .catch(caught => setLookupError(caught))
  }, [])

  function handleCountry(code) {
    setCountry(code)
    saveCountry(code)
  }

  // an existing order only has the courier code, so fetch its name for display
  useEffect(() => {
    if (!value || value.name) return
    lookupCarrier(value.code).then(found => found && onChange(found)).catch(() => {})
  }, [value, onChange])

  useEffect(() => {
    const number = trackingNumber.trim()
    if (number.length < 8) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      suggestCarriers(number, country)
        .then(list => {
          setSuggestions(list)
          setLookupError(null)
        })
        .catch(caught => {
          setSuggestions([])
          setLookupError(caught)
        })
    }, 400)

    return () => clearTimeout(timer)
  }, [trackingNumber, country])

  useEffect(() => {
    const text = query.trim()
    // with a country picked, an empty box lists that country's couriers
    if (text.length < 2 && !(country && !text)) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      searchCarriers(text, country)
        .then(list => {
          setResults(Array.isArray(list) ? list : [])
          setLookupError(null)
        })
        .catch(caught => {
          setResults([])
          setLookupError(caught)
        })
    }, 300)

    return () => clearTimeout(timer)
  }, [query, country])

  function handleQuery(text) {
    const hit = results.find(carrier => carrierLabel(carrier) === text)

    if (hit) {
      onChange(hit)
      setQuery('')
      setResults([])
    } else {
      setQuery(text)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="pl-1 text-small font-medium text-primary">courier</p>

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-text/[0.05] px-4 py-3">
          <span className="font-medium">{value.name || `courier #${value.code}`}</span>
          <button type="button" onClick={() => onChange(null)} className="text-small font-medium text-primary underline">
            change
          </button>
        </div>
      ) : (
        <>
          <Input as="select" label="courier country" value={country} onChange={e => handleCountry(e.target.value)}>
            <option value="">any country</option>
            {countryOptions.map(option => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </Input>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-small text-primary">likely:</span>
              {suggestions.map(carrier => (
                <button
                  key={carrier.code}
                  type="button"
                  onClick={() => onChange(carrier)}
                  className="rounded-xl bg-accent/60 px-3 py-1.5 text-small font-medium text-primary hover:bg-accent"
                >
                  {carrier.name}
                </button>
              ))}
            </div>
          )}

          <Input
            list="carrier-options"
            placeholder={country ? 'search couriers in this country...' : 'or search for a courier...'}
            value={query}
            onChange={e => handleQuery(e.target.value)}
          />

          <datalist id="carrier-options">
            {results.map(carrier => (
              <option key={carrier.code} value={carrierLabel(carrier)} />
            ))}
          </datalist>
        </>
      )}

      {lookupError && (
        <p role="alert" className="pl-1 text-small font-medium text-primary">
          could not load couriers: {lookupError.message}. check that the API is running the latest code.
        </p>
      )}

      <p className="pl-1 text-small text-primary">
        tracking only starts after a courier is set. nothing is sent to 17track until then.
      </p>
    </div>
  )
}

function OrderForm({ existing }) {
  const navigate = useNavigate()
  const { orders, addOrder, editOrder, removeOrder } = useOrders()

  const [proxyName, setProxyName] = useState(existing?.proxyName ?? '')
  const [platform, setPlatform] = useState(existing?.platform ?? '')
  const [recipient, setRecipient] = useState(existing?.recipient ?? '')
  const [orderDate, setOrderDate] = useState(existing?.orderDate ?? todayISO())
  const [trackingNumber, setTrackingNumber] = useState(existing?.trackingNumber ?? '')
  const [carrier, setCarrier] = useState(
    existing?.trackingCarrier ? { code: existing.trackingCarrier, name: '' } : null
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const [items, setItems] = useState(
    existing
      ? existing.items.map(item => ({
          key: String(item.id),
          id: item.id,
          name: item.name,
          price: String(item.price),
          quantity: String(item.quantity),
        }))
      : [newItem()]
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const recipients = [...new Set(['Me', ...orders.map(order => order.recipient)])]

  const total = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  )

  function updateItem(key, field, value) {
    setItems(current =>
      current.map(item =>
        item.key === key ? { ...item, [field]: value } : item
      )
    )
  }

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
      trackingCarrier: carrier?.code ?? null,
      notes: notes.trim(),
      items: items.map(({ id, name, price, quantity }) => ({
        ...(id ? { id } : {}),
        name: name.trim(),
        price: Number(price),
        quantity: Number(quantity),
      })),
    }

    try {
      const saved = existing
        ? await editOrder(existing.id, input)
        : await addOrder(input)

      navigate(`/orders/${saved.id}`, { replace: true })
    } catch (caught) {
      setError(caught)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`delete order #${existing.id}?`)) return

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
        back
      </Link>

      <h1 className="text-heading font-bold">
        {existing ? `edit order #${existing.id}` : 'add order'}
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="proxy name"
          required
          maxLength={120}
          value={proxyName}
          onChange={e => setProxyName(e.target.value)}
        />

        <Input
          label="platform"
          required
          maxLength={120}
          value={platform}
          onChange={e => setPlatform(e.target.value)}
        />
      </div>

      <Input
        label="recipient"
        required
        maxLength={120}
        list="recipient-options"
        placeholder="me, sister, mom..."
        value={recipient}
        onChange={e => setRecipient(e.target.value)}
      />

      <datalist id="recipient-options">
        {recipients.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="order date"
          type="date"
          required
          value={orderDate}
          onChange={e => setOrderDate(e.target.value)}
        />

        <Input
          label="tracking #"
          maxLength={80}
          placeholder="enter tracking number"
          value={trackingNumber}
          onChange={e => setTrackingNumber(e.target.value)}
        />
      </div>

      <CarrierPicker value={carrier} trackingNumber={trackingNumber} onChange={setCarrier} />

      <div className="rounded-2xl bg-bg p-4 text-small text-primary">
        <p className="font-bold text-text">status updates automatically</p>
        <p className="mt-1">
          17track automatically updates this order when the tracking information changes.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-subheading font-bold">items</h2>

          <Button
            variant="accent"
            type="button"
            onClick={() => setItems(current => [...current, newItem()])}
          >
            <Plus size={18} />
            add item
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
                  label="item name"
                  required
                  maxLength={200}
                  value={item.name}
                  onChange={e => updateItem(item.key, 'name', e.target.value)}
                />
              </div>

              <Input
                label="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={item.price}
                onChange={e => updateItem(item.key, 'price', e.target.value)}
              />

              <Input
                label="qty"
                type="number"
                min="1"
                step="1"
                required
                value={item.quantity}
                onChange={e => updateItem(item.key, 'quantity', e.target.value)}
              />

              <button
                type="button"
                aria-label={`remove item ${index + 1}`}
                disabled={items.length === 1}
                onClick={() =>
                  setItems(current => current.filter(row => row.key !== item.key))
                }
                className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-accent/60 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-3 flex justify-between font-bold">
          <span>total</span>
          <span>{formatMoney(total)}</span>
        </p>
      </section>

      <Input
        label="notes (optional)"
        as="textarea"
        rows={3}
        maxLength={2000}
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      {error && (
        <p role="alert" className="rounded-2xl bg-surface p-3 font-medium shadow-md">
          could not save: {error.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button to={backTo} variant="ghost">
          cancel
        </Button>

        <Button type="submit" disabled={saving}>
          {saving ? 'saving...' : 'confirm'}
        </Button>
      </div>

      {existing && (
        <Button type="button" variant="ghost" className="self-start" onClick={handleDelete} disabled={saving}>
          delete this order
        </Button>
      )}
    </form>
  )
}

export default function AddEditOrderPage() {
  const { id } = useParams()
  const { orders } = useOrders()

  const existing = id
    ? orders.find(order => String(order.id) === id)
    : null

  usePageTitle(id ? 'edit order' : 'add order')

  if (id && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-heading font-bold">order not found</h1>
        <p className="text-primary">there is no order #{id} to edit.</p>
        <Button to="/orders">back to orders</Button>
      </div>
    )
  }

  return <OrderForm key={id ?? 'new'} existing={existing} />
}