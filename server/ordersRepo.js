export async function getAll(pool, userId) {
  const result = await pool.query(
    `SELECT id FROM orders WHERE user_id = $1 ORDER BY order_date DESC NULLS LAST, id DESC`,
    [userId]
  )

  const orders = []
  for (const row of result.rows) orders.push(await getById(pool, userId, row.id))
  return orders
}

export async function getById(pool, userId, id) {
  const orderResult = await pool.query(
    `SELECT o.*, t.total, t.paid, t.balance
     FROM orders o
     JOIN order_totals t ON t.order_id = o.id
     WHERE o.id = $1 AND o.user_id = $2`,
    [id, userId]
  )

  const order = orderResult.rows[0]
  if (!order) return null

  const itemsResult = await pool.query('SELECT * FROM items WHERE order_id = $1 ORDER BY id', [id])
  const paymentsResult = await pool.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY paid_on DESC, id DESC', [id])

  return { ...order, items: itemsResult.rows, payments: paymentsResult.rows }
}

async function insertItems(client, orderId, items) {
  for (const item of items ?? []) {
    await client.query(
      'INSERT INTO items (order_id, name, price, quantity) VALUES ($1, $2, $3, $4)',
      [orderId, item.name, item.price, item.quantity ?? 1]
    )
  }
}

export async function create(pool, userId, { proxyName, platform, recipient, orderDate, trackingNumber, trackingCarrier, status, notes, items }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, proxy_name, platform, recipient, order_date, tracking_number, tracking_carrier, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, proxyName, platform, recipient ?? 'Me', orderDate ?? null, trackingNumber ?? null, trackingCarrier ?? null, status ?? 'ordered', notes ?? null]
    )

    const order = orderResult.rows[0]
    await insertItems(client, order.id, items)

    await client.query('COMMIT')
    return await getById(pool, userId, order.id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function update(pool, userId, id, { proxyName, platform, recipient, orderDate, trackingNumber, trackingCarrier, notes, items }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderResult = await client.query(
      `UPDATE orders
       SET proxy_name = $1, platform = $2, recipient = $3, order_date = $4,
           tracking_number = $5, tracking_carrier = $6, notes = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [proxyName, platform, recipient ?? 'Me', orderDate ?? null, trackingNumber ?? null, trackingCarrier ?? null, notes ?? null, id, userId]
    )

    if (!orderResult.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }

    await client.query('DELETE FROM items WHERE order_id = $1', [id])
    await insertItems(client, id, items)

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
  const result = await pool.query(
    'DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  )
  return result.rowCount > 0
}

export async function addPayment(pool, userId, orderId, { amount, paidOn, method, note }) {
  const owned = await pool.query(
    'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  )
  if (!owned.rows[0]) return null

  await pool.query(
    `INSERT INTO payments (order_id, amount, paid_on, method, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, amount, paidOn ?? new Date().toISOString().slice(0, 10), method ?? null, note ?? null]
  )

  return await getById(pool, userId, orderId)
}

export async function getTrackingInfo(pool, userId, orderId) {
  const result = await pool.query(
    'SELECT tracking_number, tracking_carrier FROM orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  )
  return result.rows[0] ?? null
}

export async function setTracking(pool, userId, orderId, status, events, carrier = null) {
  const result = await pool.query(
    'UPDATE orders SET status = $1, tracking_events = $2, tracking_carrier = COALESCE($3, tracking_carrier) WHERE id = $4 AND user_id = $5 RETURNING *',
    [status, JSON.stringify(events ?? []), carrier, orderId, userId]
  )
  return result.rows[0] ?? null
}

export async function setCarrier(pool, userId, orderId, carrier) {
  const result = await pool.query(
    'UPDATE orders SET tracking_carrier = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
    [carrier, orderId, userId]
  )
  return result.rows[0] ?? null
}