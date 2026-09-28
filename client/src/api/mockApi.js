// The stand-in for a backend, so the front end can be built on its own.
// Data lives in the visitor's own browser (localStorage) and goes no further.
// Functions return promises and fail with an Error, like a real API would, so
// screens already handle loading and errors.
//
// An order looks like this (it is the state shape from docs/01-proposal.md):
//   { id, proxyName, platform, recipient, orderDate, status, trackingNumber,
//     trackingEvents: [{ label, date }], notes,
//     items:    [{ id, name, price, quantity }],
//     payments: [{ id, amount, date, method }] }
// The balance is NOT stored. It is items total minus payments total, worked
// out wherever it is shown (src/lib/orders.js).

import seed from './seed.json'
import { todayISO, sortOrders } from '../lib/orders.js'

const KEY = 'proxypal:orders'

// A real network is not instant. Keeping this delay is what forces a loading
// state to exist now, instead of the day the real API arrives.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // Corrupted storage. Start again rather than crashing the app.
      localStorage.removeItem(KEY)
    }
  }
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

function write(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows))
  return rows
}

const sameId = (a, b) => String(a) === String(b)

// Postgres would hand out a serial id. This does the same, so "Order #12" keeps
// working when the real database arrives.
const nextId = (rows) => rows.reduce((max, row) => Math.max(max, Number(row.id)), 0) + 1

const withItemIds = (items = []) =>
  items.map((item) => ({ ...item, id: item.id ?? crypto.randomUUID() }))

export async function listOrders() {
  await delay()
  return sortOrders(read())
}

export async function getOrder(id) {
  await delay()
  const found = read().find((row) => sameId(row.id, id))
  if (!found) throw new Error('Not found')
  return found
}

export async function createOrder(input) {
  await delay()
  const rows = read()
  const orderDate = input.orderDate || todayISO()
  const created = {
    ...input,
    id: nextId(rows),
    orderDate,
    items: withItemIds(input.items),
    payments: [],
    trackingEvents: [{ label: 'Order placed', date: orderDate }],
  }
  write([...rows, created])
  return created
}

export async function updateOrder(id, input) {
  await delay()
  const rows = read()
  const index = rows.findIndex((row) => sameId(row.id, id))
  if (index === -1) throw new Error('Not found')
  rows[index] = {
    ...rows[index],
    ...input,
    id: rows[index].id,
    items: withItemIds(input.items ?? rows[index].items),
  }
  write(rows)
  return rows[index]
}

export async function deleteOrder(id) {
  await delay()
  write(read().filter((row) => !sameId(row.id, id)))
}

export async function addPayment(orderId, payment) {
  await delay()
  const rows = read()
  const index = rows.findIndex((row) => sameId(row.id, orderId))
  if (index === -1) throw new Error('Not found')
  rows[index] = {
    ...rows[index],
    payments: [...rows[index].payments, { ...payment, id: crypto.randomUUID() }],
  }
  write(rows)
  return rows[index]
}
