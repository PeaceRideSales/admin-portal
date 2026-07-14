import { useState, useEffect } from 'react'
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

  // Always dark mode — locked permanently
  useEffect(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  function handleLogout() {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900 overflow-hidden w-full max-w-[100vw] transition-colors duration-300">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar (Floating on mobile) */}
      <aside className={`fixed inset-y-4 left-4 z-30 w-64 flex flex-col rounded-3xl clay-card-blue overflow-hidden transform transition-all duration-300 ease-out md:relative md:inset-y-4 md:left-4 md:mr-4 md:mb-4 ${
        sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 md:translate-x-0 md:opacity-100'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-blue-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
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
                `flex items-center px-3 py-3 mx-2 my-1 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'clay-pressed-blue text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
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
                `flex items-center px-3 py-3 mx-2 my-1 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'clay-pressed-blue text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-blue-400/30">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-3 text-sm font-bold text-blue-100 rounded-2xl hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative md:py-4 md:pr-4">
        <header className="h-16 clay-card flex items-center px-4 md:px-6 shrink-0 mx-4 md:mx-0 mt-4 md:mt-0 z-10">
          <button className="mr-4 md:hidden text-slate-400 dark:text-slate-300 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse" />
            <h2 className="text-slate-800 dark:text-white font-bold text-sm tracking-wide">Admin Portal</h2>
          </div>
        </header>
        
        {/* Added pb-24 to make room for bottom nav on mobile, pt-4 for header gap */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 min-w-0 pb-24 md:pb-6">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 clay-card flex justify-around items-center h-16 px-2 z-20">
          {navItems.slice(0, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                  isActive ? 'clay-pressed text-blue-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold tracking-tight">{item.label === 'Reports & Export' ? 'Reports' : item.label}</span>
            </NavLink>
          ))}
        </div>

      </main>
    </div>
  )
}
