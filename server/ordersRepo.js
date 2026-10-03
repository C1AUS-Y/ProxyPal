// this is the db layer for orders/items/payments
export async function getAll(pool, userId) {
  const result = await pool.query(
    `SELECT id FROM orders
     WHERE user_id = $1
     ORDER BY order_date DESC NULLS LAST, id DESC`,
    [userId]
  )

  // the list pages need items and payments too, so load each order in full
  const orders = []
  for (const row of result.rows) {
    orders.push(await getById(pool, userId, row.id))
  }
  return orders
}

export async function getById(pool, userId, id) {
  // get the order + its totals first
  const orderResult = await pool.query(
    `SELECT o.*, t.total, t.paid, t.balance
     FROM orders o
     JOIN order_totals t ON t.order_id = o.id
     WHERE o.id = $1 AND o.user_id = $2`,
    [id, userId]
  )
  const order = orderResult.rows[0]
  if (!order) return null

  // then its items and payments
  const itemsResult = await pool.query(
    'SELECT * FROM items WHERE order_id = $1 ORDER BY id',
    [id]
  )
  const paymentsResult = await pool.query(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY paid_on DESC, id DESC',
    [id]
  )

  return { ...order, items: itemsResult.rows, payments: paymentsResult.rows }
}

// items is an array like [{ name, price, quantity }]
export async function create(pool, userId, { proxyName, platform, recipient, orderDate, trackingNumber, status, notes, items }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, proxy_name, platform, recipient, order_date, tracking_number, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, proxyName, platform, recipient ?? 'Me', orderDate ?? null, trackingNumber ?? null, status ?? 'ordered', notes ?? null]
    )
    const order = orderResult.rows[0]

    for (const item of items ?? []) {
      await client.query(
        `INSERT INTO items (order_id, name, price, quantity)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.name, item.price, item.quantity ?? 1]
      )
    }

    await client.query('COMMIT')
    // return the full order (with items and payments) so the client can show it right away
    return await getById(pool, userId, order.id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// just replaces the whole item list instead of trying to diff it, way simpler
export async function update(pool, userId, id, { proxyName, platform, recipient, orderDate, trackingNumber, notes, items }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderResult = await client.query(
      `UPDATE orders
       SET proxy_name = $1, platform = $2, recipient = $3, order_date = $4,
           tracking_number = $5, notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [proxyName, platform, recipient ?? 'Me', orderDate ?? null, trackingNumber ?? null, notes ?? null, id, userId]
    )

    const order = orderResult.rows[0]

    if (!order) {
      await client.query('ROLLBACK')
      return null
    }

    await client.query('DELETE FROM items WHERE order_id = $1', [id])

    for (const item of items ?? []) {
      await client.query(
        `INSERT INTO items (order_id, name, price, quantity)
         VALUES ($1, $2, $3, $4)`,
        [id, item.name, item.price, item.quantity ?? 1]
      )
    }

    await client.query('COMMIT')
    return await getById(pool, userId, id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function remove(pool, userId, id) {
  // items and payments get deleted automatically (ON DELETE CASCADE in schema.sql)
  const result = await pool.query(
    'DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  )
  return result.rowCount > 0
}

// small helper so payments/tracking can't touch an order that isn't the user's
async function assertOwnedOrder(pool, userId, orderId) {
  const result = await pool.query(
    'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  )
  return result.rows[0] ?? null
}

export async function addPayment(pool, userId, orderId, { amount, paidOn, method, note }) {
  const owned = await assertOwnedOrder(pool, userId, orderId)
  if (!owned) return null

  await pool.query(
    `INSERT INTO payments (order_id, amount, paid_on, method, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, amount, paidOn ?? new Date().toISOString().slice(0, 10), method ?? null, note ?? null]
  )
  // return the whole updated order, the client replaces its copy with this
  return await getById(pool, userId, orderId)
}

// used by the tracking routes to grab the tracking number before calling 17track
export async function getTrackingNumber(pool, userId, orderId) {
  const owned = await assertOwnedOrder(pool, userId, orderId)
  if (!owned) return null
  const result = await pool.query('SELECT tracking_number FROM orders WHERE id = $1', [orderId])
  return result.rows[0].tracking_number
}

export async function setTracking(pool, userId, orderId, status, events) {
  const result = await pool.query(
    'UPDATE orders SET status = $1, tracking_events = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [status, JSON.stringify(events ?? []), orderId, userId]
  )
  return result.rows[0] ?? null
}

export async function setStatus(pool, userId, orderId, status) {
  const result = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [status, orderId, userId]
  )
  return result.rows[0] ?? null
}