import { Users, Car, TrendingUp, AlertCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import StatCard from '../components/StatCard'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { api } from '../api'

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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-500 text-sm">Overview of Peace Ride operations</p>
      </div>

      {/* Goal Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress to 4000 Verified Drivers */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Driver Goal Progress</h3>
              <p className="text-2xl font-black text-slate-900">
                {stats.verified_drivers?.toLocaleString() || 0} <span className="text-lg text-slate-400 font-semibold">/ 4,000 Verified</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-emerald-600 font-bold text-lg">
                {Math.min(100, Math.round(((stats.verified_drivers || 0) / 4000) * 100))}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(100, ((stats.verified_drivers || 0) / 4000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Progress to 1000 Approved Agents */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Agent Goal Progress</h3>
              <p className="text-2xl font-black text-slate-900">
                {stats.total_agents?.toLocaleString() || 0} <span className="text-lg text-slate-400 font-semibold">/ 1,000 Approved</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-blue-600 font-bold text-lg">
                {Math.min(100, Math.round(((stats.total_agents || 0) / 1000) * 100))}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
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
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 xl:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Registrations (Last 30 Days)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => v.substring(5)} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Car Types Chart */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" /> Top Car Models
            </h3>
            <div className="h-64 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.carModels}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.carModels.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#06b6d4', '#f97316'][index % 8]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Locations Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 xl:col-span-3">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" /> Top Locations
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.locations.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Agent Leaderboard</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {leaderboard.map((agent, idx) => (
            <div key={agent.id} className="p-4 md:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                  idx === 1 ? 'bg-slate-300 text-slate-700' :
                  idx === 2 ? 'bg-amber-600 text-white' : 'bg-blue-100 text-blue-700'
                }`}>{idx + 1}</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{agent.full_name || 'Unknown'}</h4>
                  <p className="text-xs text-slate-500">@{agent.telegram_username}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{agent.driver_count}</p>
                <p className="text-xs text-slate-400">drivers</p>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="p-10 text-center text-slate-400">No agents registered yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
