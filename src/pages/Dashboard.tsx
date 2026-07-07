import { useState, useEffect } from 'react'
import { Users, Car, TrendingUp, AlertCircle } from 'lucide-react'
import StatCard from '../components/StatCard'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function Dashboard() {
  const [stats, setStats] = useState<any>({})
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const token = localStorage.getItem('admin_token')
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [statsRes, leadRes] = await Promise.all([
        fetch(`${API}/stats`, { headers }),
        fetch(`${API}/stats/leaderboard`, { headers })
      ])
      setStats(statsRes.ok ? await statsRes.json() : {})
      const ld = leadRes.ok ? await leadRes.json() : []
      setLeaderboard(Array.isArray(ld) ? ld : [])
    } catch { setStats({}); setLeaderboard([]) }
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
