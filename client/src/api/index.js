// The only file components import data functions from.
//
// FRONT END ONLY, for now: everything comes from mockApi.js, which keeps data
// in the browser's localStorage. There is no server and no real API yet.
//
// When the backend exists, this is the one place that changes: add an
// httpApi.js with the same function names and export from it instead. No screen
// needs to be touched.

export {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  addPayment,
} from './mockApi.js'
