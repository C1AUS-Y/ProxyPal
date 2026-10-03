import express from 'express'
import cors from 'cors'
import { pool } from './db/pool.js'
import { requireAuth } from './auth.js'
import * as orders from './ordersRepo.js'
import * as track17 from './track17.js'
import { trackIfMatched, matchCarrier, suggestCarriers, searchCarriers, getCarrier, isKnownCarrier } from './carrierFallback.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

function validateOrder(body) {
  const errors = []
  const proxyName = typeof body.proxyName === 'string' ? body.proxyName.trim() : ''
  const platform = typeof body.platform === 'string' ? body.platform.trim() : ''
  const recipient = typeof body.recipient === 'string' ? body.recipient.trim() : 'Me'
  const items = Array.isArray(body.items) ? body.items : []
  const trackingCarrier = body.trackingCarrier ? Number(body.trackingCarrier) : null

  if (!proxyName) errors.push('proxyName is required')
  if (proxyName.length > 120) errors.push('proxyName must be 120 characters or fewer')
  if (!platform) errors.push('platform is required')
  if (recipient.length > 120) errors.push('recipient must be 120 characters or fewer')
  if (trackingCarrier !== null && !isKnownCarrier(trackingCarrier)) errors.push('trackingCarrier is not a known courier code')

  const cleanItems = items.map((item, index) => {
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    const price = Number(item.price)
    const quantity = Number(item.quantity ?? 1)

    if (!name) errors.push(`item ${index + 1}: name is required`)
    if (!Number.isFinite(price) || price < 0) errors.push(`item ${index + 1}: price must be a number 0 or greater`)
    if (!Number.isInteger(quantity) || quantity < 1) errors.push(`item ${index + 1}: quantity must be a whole number of 1 or more`)

    return { name, price, quantity }
  })

  return {
    errors,
    value: {
      proxyName,
      platform,
      recipient,
      orderDate: body.orderDate || null,
      trackingNumber: typeof body.trackingNumber === 'string' ? body.trackingNumber.trim() || null : null,
      trackingCarrier,
      status: body.status || 'ordered',
      notes: typeof body.notes === 'string' ? body.notes.trim() || null : null,
      items: cleanItems,
    },
  }
}

async function syncTracking(userId, orderId, number, carrier = null) {
  if (!number) return

  try {
    const { result, carrier: foundCarrier, needsCarrier, suggestions } = await trackIfMatched(number, carrier)

    if (foundCarrier && !carrier) await orders.setCarrier(pool, userId, orderId, foundCarrier)

    if (result) {
      await orders.setTracking(pool, userId, orderId, result.status, result.events, foundCarrier)
    } else if (needsCarrier) {
      const names = suggestions.map(c => `${c.name} (${c.code})`).join(', ')
      console.warn(`no courier matched for ${number}, nothing sent to 17track. Suggestions: ${names || 'none'}`)
    }
  } catch (error) {
    console.error('17track sync failed:', error.message)
  }
}

function validatePayment(body) {
  const errors = []
  const amount = Number(body.amount)

  if (!Number.isFinite(amount) || amount <= 0) errors.push('amount must be a number greater than 0')

  return {
    errors,
    value: {
      amount,
      paidOn: body.paidOn || null,
      method: typeof body.method === 'string' ? body.method.trim() || null : null,
      note: typeof body.note === 'string' ? body.note.trim() || null : null,
    },
  }
}

app.use('/api', requireAuth)

app.get('/api/orders', async (request, response, next) => {
  try {
    response.json(await orders.getAll(pool, request.userId))
  } catch (error) {
    next(error)
  }
})

app.get('/api/orders/:id', async (request, response, next) => {
  try {
    const order = await orders.getById(pool, request.userId, request.params.id)
    if (!order) return response.status(404).json({ error: 'Not found' })
    response.json(order)
  } catch (error) {
    next(error)
  }
})

// all carrier routes read the bundled carriers.json: free, no 17track call
app.get('/api/carriers', (request, response) => {
  const { q, code } = request.query
  if (code) return response.json([getCarrier(code)].filter(Boolean))
  response.json(searchCarriers(q, 20))
})

app.get('/api/carriers/suggest', (request, response) => {
  const number = typeof request.query.number === 'string' ? request.query.number : ''
  const { carrier, suggestions } = matchCarrier(number)
  response.json({ matched: carrier, suggestions })
})

app.post('/api/orders', async (request, response, next) => {
  const { errors, value } = validateOrder(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const order = await orders.create(pool, request.userId, value)
    syncTracking(request.userId, order.id, value.trackingNumber, value.trackingCarrier)
    response.status(201).json(order)
  } catch (error) {
    next(error)
  }
})

app.put('/api/orders/:id', async (request, response, next) => {
  const { errors, value } = validateOrder(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const before = await orders.getTrackingInfo(pool, request.userId, request.params.id)
    if (!before) return response.status(404).json({ error: 'Not found' })

    const order = await orders.update(pool, request.userId, request.params.id, value)
    if (!order) return response.status(404).json({ error: 'Not found' })

    // editing notes or items must not re-send the number to 17track
    const changed =
      value.trackingNumber !== (before.tracking_number ?? null) ||
      Number(value.trackingCarrier ?? 0) !== Number(before.tracking_carrier ?? 0)

    if (value.trackingNumber && changed) {
      syncTracking(request.userId, order.id, value.trackingNumber, value.trackingCarrier)
    }

    response.json(order)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/orders/:id', async (request, response, next) => {
  try {
    const removed = await orders.remove(pool, request.userId, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.post('/api/orders/:id/payments', async (request, response, next) => {
  const { errors, value } = validatePayment(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const payment = await orders.addPayment(pool, request.userId, request.params.id, value)
    if (!payment) return response.status(404).json({ error: 'Not found' })
    response.status(201).json(payment)
  } catch (error) {
    next(error)
  }
})

app.post('/api/orders/:id/tracking', async (request, response, next) => {
  try {
    const tracking = await orders.getTrackingInfo(pool, request.userId, request.params.id)
    if (!tracking) return response.status(404).json({ error: 'Not found' })
    if (!tracking.tracking_number) return response.status(400).json({ error: 'This order has no tracking number' })

    const { result, carrier, needsCarrier, suggestions } = await trackIfMatched(tracking.tracking_number, tracking.tracking_carrier)

    if (needsCarrier) {
      return response.status(422).json({ error: 'Pick the courier for this order first', needsCarrier: true, suggestions })
    }

    if (carrier && !tracking.tracking_carrier) await orders.setCarrier(pool, request.userId, request.params.id, carrier)
    if (result) await orders.setTracking(pool, request.userId, request.params.id, result.status, result.events, carrier)

    response.status(202).json({ registered: true, carrier })
  } catch (error) {
    next(error)
  }
})

app.get('/api/orders/:id/tracking', async (request, response, next) => {
  try {
    const tracking = await orders.getTrackingInfo(pool, request.userId, request.params.id)
    if (!tracking) return response.status(404).json({ error: 'Not found' })
    if (!tracking.tracking_number) return response.status(400).json({ error: 'This order has no tracking number' })

    // no courier saved means nothing is sent to 17track, only local suggestions come back
    if (!tracking.tracking_carrier) {
      const suggestions = suggestCarriers(tracking.tracking_number)
      return response.json({ status: 'ordered', events: [], needsCarrier: true, suggestions })
    }

    const result = await track17.getStatus(tracking.tracking_number, tracking.tracking_carrier)
    if (!result) return response.json({ status: 'ordered', events: [] })

    await orders.setTracking(pool, request.userId, request.params.id, result.status, result.events, result.carrier)
    response.json(result)
  } catch (error) {
    next(error)
  }
})

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server' })
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})