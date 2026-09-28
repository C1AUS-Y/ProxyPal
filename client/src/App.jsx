import { Route, Routes } from 'react-router-dom'
import { OrdersProvider } from './orders/OrdersContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import AddEditOrderPage from './pages/AddEditOrderPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// The screen map from docs/02-mockup.md, as routes. The router itself lives in
// main.jsx so this component can be rendered inside any router (a test, say).
export default function App() {
  return (
    <OrdersProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/new" element={<AddEditOrderPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/:id/edit" element={<AddEditOrderPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </OrdersProvider>
  )
}
