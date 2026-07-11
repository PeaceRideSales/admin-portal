import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Drivers from './pages/Drivers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Payouts from './pages/Payouts'
import Support from './pages/Support'
import AuditLogs from './pages/AuditLogs'
import Notifications from './pages/Notifications'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'agents',
        element: <Agents />,
      },
      {
        path: 'drivers',
        element: <Drivers />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'audit',
        element: <AuditLogs />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'payouts',
        element: <Payouts />,
      },
      {
        path: 'support',
        element: <Support />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
