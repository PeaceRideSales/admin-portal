import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import AgentDetailModal from '../components/AgentDetailModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const statusStyle: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-800',
  PENDING:  'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function Agents() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => { fetchAgents() }, [])

  async function fetchAgents() {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/agents`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.ok ? await res.json() : []
      setAgents(Array.isArray(data) ? data : [])
    } catch { setAgents([]) }
    finally { setLoading(false) }
  }

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/agents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    setSelected(null)
    fetchAgents()
  }

  async function updatePrice(id: string, price: number | null) {
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/payout/agents/${id}/price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price }),
    })
    fetchAgents()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
        <p className="text-slate-500 text-sm">{agents.length} total agents</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {agents.map(agent => (
            <div key={agent.id} onClick={() => setSelected(agent)}
              className="p-4 md:px-6 hover:bg-blue-50 cursor-pointer transition-colors group flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                    {agent.full_name || 'Unknown Name'}
                  </h4>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusStyle[agent.status]}`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">@{agent.telegram_username}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-slate-900">{agent.driver_count}</p>
                  <p className="text-xs text-slate-400">drivers</p>
                </div>
                <Eye className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="p-10 text-center text-slate-400">No agents registered yet.</div>
          )}
        </div>
      </div>

      <AgentDetailModal
        agent={selected}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateStatus}
        onUpdatePrice={updatePrice}
      />
    </div>
  )
}
