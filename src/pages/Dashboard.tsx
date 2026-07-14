import { Users, Car, TrendingUp, AlertCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import StatCard from '../components/StatCard'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { api } from '../api'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="clay-card p-4 border border-blue-100/50 dark:border-slate-700/50">
        {label && <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{label}</p>}
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="text-sm font-bold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ backgroundColor: p.color || p.fill || '#3b82f6' }}></span>
            <span className="text-slate-600 dark:text-slate-300">{p.name || 'Value'}:</span>
            <span className="text-slate-900 dark:text-white">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const [statsRes, leadRes, chartsRes] = await Promise.all([
        api.get('/stats'),
        api.get('/stats/leaderboard'),
        api.get('/stats/charts').catch(() => null)
      ])
      return {
        stats: statsRes || {},
        leaderboard: Array.isArray(leadRes) ? leadRes : [],
        chartData: chartsRes
      }
    }
  })

  const stats = data?.stats || {}
  const leaderboard = data?.leaderboard || []
  const chartData = data?.chartData || null

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Overview of Peace Ride operations</p>
      </div>

      {/* Goal Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress to 4000 Verified Drivers */}
        <div className="clay-card p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Driver Goal Progress</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.verified_drivers?.toLocaleString() || 0} <span className="text-lg text-slate-400 dark:text-slate-500 font-semibold">/ 4,000 Verified</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                {Math.min(100, Math.round(((stats.verified_drivers || 0) / 4000) * 100))}%
              </span>
            </div>
          </div>
          <div className="w-full clay-pressed rounded-full h-4 overflow-hidden">
            <div 
              className="bg-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(100, ((stats.verified_drivers || 0) / 4000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Progress to 1000 Approved Agents */}
        <div className="clay-card p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agent Goal Progress</h3>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.total_agents?.toLocaleString() || 0} <span className="text-lg text-slate-400 dark:text-slate-500 font-semibold">/ 1,000 Approved</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                {Math.min(100, Math.round(((stats.total_agents || 0) / 1000) * 100))}%
              </span>
            </div>
          </div>
          <div className="w-full clay-pressed rounded-full h-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(100, ((stats.total_agents || 0) / 1000) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="Total Drivers"      value={stats.total_drivers}      icon={<Car className="w-5 h-5" />}           color="blue" />
        <StatCard label="This Week"          value={stats.drivers_this_week}  icon={<TrendingUp className="w-5 h-5" />}    color="emerald" />
        <StatCard label="This Month"         value={stats.drivers_this_month} icon={<TrendingUp className="w-5 h-5" />}    color="emerald" />
        <StatCard label="Active Agents"      value={stats.total_agents}       icon={<Users className="w-5 h-5" />}         color="indigo" />
        <StatCard label="Pending Approval"   value={stats.pending_agents}     icon={<AlertCircle className="w-5 h-5" />}   color="amber" />
      </div>

      {/* Analytics Charts */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="clay-card p-5 xl:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 clay-btn-blue flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Registrations (Last 30 Days)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#94a3b8" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c3cce6" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} tickFormatter={(v) => v.substring(5)} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" style={{ filter: 'url(#clayShadow)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Car Types Chart */}
          <div className="clay-card p-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 clay-btn-indigo flex items-center justify-center shrink-0">
                <PieChartIcon className="w-4 h-4 text-white" />
              </div>
              Top Car Models
            </h3>
            <div className="h-64 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#94a3b8" floodOpacity={0.6} />
                    </filter>
                  </defs>
                  <Pie
                    data={chartData.carModels}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    style={{ filter: 'url(#pieShadow)' }}
                  >
                    {chartData.carModels.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6'][index % 8]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Locations Bar Chart */}
          <div className="clay-card p-5 xl:col-span-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 clay-btn-emerald flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              Top Locations
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.locations.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="3" dy="3" stdDeviation="3" floodColor="#94a3b8" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#c3cce6" strokeOpacity={0.5} />
                  <XAxis type="number" tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#e0e7ff', opacity: 0.5, radius: 12}} />
                  <Bar dataKey="count" fill="url(#colorBar)" radius={[0, 16, 16, 0]} barSize={24} style={{ filter: 'url(#barShadow)' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="clay-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-300 dark:border-slate-600 flex items-center gap-3">
          <div className="w-8 h-8 clay-btn-blue flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Agent Leaderboard</h3>
        </div>
        <div className="p-4 space-y-3 bg-blue-50/50 dark:bg-slate-800/50">
          {leaderboard.map((agent, idx) => {
            const colors = ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-indigo-100', 'bg-rose-100']
            const colorBg = colors[idx % colors.length]
            return (
              <div key={agent.id} className={`clay-list-card p-4 md:px-6 flex items-center justify-between ${colorBg}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    idx === 0 ? 'bg-amber-400 text-amber-900 shadow-sm' :
                    idx === 1 ? 'bg-slate-300 text-slate-700 shadow-sm' :
                    idx === 2 ? 'bg-amber-600 text-white shadow-sm' : 'bg-white/50 dark:bg-white/10 text-blue-700 dark:text-blue-300'
                  }`}>{idx + 1}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{agent.full_name || 'Unknown'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">@{agent.telegram_username}</p>
                  </div>
                </div>
                <div className="text-right bg-white/50 dark:bg-white/10 px-3 py-1 rounded-xl">
                  <p className="text-sm font-black text-slate-800 dark:text-white">{agent.driver_count}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">drivers</p>
                </div>
              </div>
            )
          })}
          {leaderboard.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-bold">No agents registered yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
