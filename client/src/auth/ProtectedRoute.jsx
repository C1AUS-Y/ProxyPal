// wraps the routes that need a logged-in user
// if there's no session, send them to /login instead

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
