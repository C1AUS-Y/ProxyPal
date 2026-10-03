import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { OrdersProvider } from './orders/OrdersContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import AddEditOrderPage from './pages/AddEditOrderPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// every screen as a route; everything except /login needs a logged-in user
export default function App() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
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
          </Route>
        </Routes>
      </OrdersProvider>
    </AuthProvider>
  )
}