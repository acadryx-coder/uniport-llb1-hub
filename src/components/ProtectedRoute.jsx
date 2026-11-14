import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, setPendingRedirect } from '../lib/auth.js'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // 1. Wait for Supabase to finish checking the session
  if (loading) {
    return (
      <div className="view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', opacity: 0.5 }}>
        <div className="empty">Loading LLB 1 Hub…</div>
      </div>
    )
  }

  // 2. If no user after loading, redirect to login
  if (!user) {
    const target = location.pathname + location.search
    setPendingRedirect(target)
    return <Navigate to="/login" replace state={{ from: target }} />
  }

  // 3. Otherwise, render the app
  return <Outlet />
}
