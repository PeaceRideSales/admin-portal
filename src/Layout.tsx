import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Car, FileSpreadsheet, Settings, LogOut, Menu, X, Wallet, Shield, Bell, HeartHandshake } from 'lucide-react'

const navItems = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/agents',         icon: Users,           label: 'Agents' },
  { to: '/drivers',        icon: Car,             label: 'Drivers' },
  { to: '/payouts',        icon: Wallet,          label: 'Payouts' },
  { to: '/support',        icon: HeartHandshake,  label: 'Support' },
  { to: '/notifications',  icon: Bell,            label: 'Notifications' },
  { to: '/reports',        icon: FileSpreadsheet, label: 'Reports & Export' },
  { to: '/audit',          icon: Shield,          label: 'Audit Logs' },
  { to: '/settings',       icon: Settings,        label: 'Settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden w-full max-w-[100vw]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (Floating on mobile) */}
      <aside className={`fixed inset-y-4 left-4 z-30 w-64 bg-blue-700 flex flex-col rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out md:relative md:inset-0 md:rounded-none md:shadow-none md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 md:opacity-100'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center shadow-inner">
              <img src="/logo.png" alt="Peace Ride" className="w-7 h-7 object-contain filter brightness-0 invert" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Peace Ride</span>
          </div>
          <button className="md:hidden text-blue-200 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto hidden md:block">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Nav inside Sidebar (for extra items like Settings) */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto md:hidden">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-blue-200 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0 shadow-sm">
          <button className="mr-4 md:hidden text-slate-600 hover:text-slate-900" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-slate-700 font-medium text-sm">Admin Portal</h2>
          </div>
        </header>
        
        {/* Added pb-20 to make room for bottom nav on mobile */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 min-w-0 pb-20 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 pb-safe z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {navItems.slice(0, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label === 'Reports & Export' ? 'Reports' : item.label}</span>
            </NavLink>
          ))}
        </div>

      </main>
    </div>
  )
}
