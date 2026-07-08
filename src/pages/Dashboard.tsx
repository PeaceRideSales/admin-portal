import { useState, useEffect } from 'react'
import { Users, Car, TrendingUp, AlertCircle, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import StatCard from '../components/StatCard'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const token = localStorage.getItem('admin_token')
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [statsRes, leadRes, chartsRes] = await Promise.all([
        fetch(`${API}/stats`, { headers }),
        fetch(`${API}/stats/leaderboard`, { headers }),
        fetch(`${API}/stats/charts`, { headers })
      ])
      setStats(statsRes.ok ? await statsRes.json() : {})
      
      const ld = leadRes.ok ? await leadRes.json() : []
      setLeaderboard(Array.isArray(ld) ? ld : [])

      if (chartsRes.ok) {
        setChartData(await chartsRes.json())
      }
    } catch { 
      setStats({}); 
      setLeaderboard([]);
    }
    finally { setLoading(false) }
  }

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
