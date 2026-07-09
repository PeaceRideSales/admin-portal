import { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, Edit2, Check, X } from 'lucide-react'
import StatCard from '../components/StatCard'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function PriceField({ label, value, onSave, badge, badgeColor }: {
  label: string
  value: number | null
  onSave: (v: number | null) => void
  badge: string
  badgeColor: string
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(value !== null ? String(value) : '')

  function handleSave() {
    onSave(input === '' ? null : parseFloat(input))
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>{badge}</span>
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input type="number" min="0" step="1" value={input}
            onChange={e => setInput(e.target.value)}
            className="w-20 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <span className="text-xs text-slate-400">Birr</span>
          <button onClick={handleSave} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setEditing(false); setInput(value !== null ? String(value) : '') }} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {value !== null ? `${value} Birr` : <span className="text-slate-400 italic text-xs">global default</span>}
          </span>
          <button onClick={() => setEditing(true)} className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function AgentPayoutRow({ agent, onPriceChange }: {
  agent: any
  onPriceChange: (id: string, field: string, value: number | null) => void
}) {
  return (
    <div className="p-4 md:px-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm">{agent.full_name || 'Unknown'}</h4>
          <p className="text-xs text-slate-500">@{agent.telegram_username}</p>
          <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
            <span className="text-emerald-600 font-semibold">{agent.verified_drivers} verified</span>
            <span className="text-amber-600">{agent.pending_drivers} pending</span>
            {agent.declined_drivers > 0 && <span className="text-red-500">{agent.declined_drivers} declined</span>}
          </div>
          {agent.payment_method && agent.payment_details && (
            <div className="mt-1.5 text-xs bg-slate-100 px-2 py-1 rounded inline-block">
              <span className="font-semibold text-slate-600">{agent.payment_method}:</span>{' '}
              <span className="text-slate-800 font-mono select-all">{agent.payment_details}</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-6">
          {/* Per-agent tier price overrides */}
          <div className="min-w-[200px] space-y-1.5 border border-slate-100 rounded-lg px-3 py-2 bg-slate-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Agent Overrides</p>
            <PriceField
              label="Latest / EV"
              value={agent.price_latest_model}
              onSave={v => onPriceChange(agent.id, 'price_latest_model', v)}
              badge="Latest"
              badgeColor="bg-purple-100 text-purple-700"
            />
            <PriceField
              label="Older Model"
              value={agent.price_older_model}
              onSave={v => onPriceChange(agent.id, 'price_older_model', v)}
              badge="Older"
              badgeColor="bg-slate-200 text-slate-600"
            />
          </div>

          {/* Payout total */}
          <div className="text-right min-w-[80px]">
            <p className="text-lg font-bold text-slate-900">{agent.payout.toFixed(0)}</p>
            <p className="text-xs text-slate-400">Birr total</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Payouts() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSummary() }, [])

  async function fetchSummary() {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/payout/summary`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setSummary(await res.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function handlePriceChange(agentId: string, field: string, value: number | null) {
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/payout/agents/${agentId}/price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    })
    fetchSummary()
  }

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-500 text-sm">Earnings based on verified drivers · Tiered by vehicle category</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Payout" value={`${(summary?.total_payout || 0).toFixed(0)} Birr`}
          icon={<DollarSign className="w-5 h-5" />} color="emerald" />
        <StatCard label="Verified Drivers" value={summary?.total_verified_drivers || 0}
          icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <StatCard label="Latest/EV Rate" value={`${summary?.global_price_latest_model || 150} Birr`}
          icon={<Users className="w-5 h-5" />} color="indigo" />
        <StatCard label="Older Rate" value={`${summary?.global_price_older_model || 120} Birr`}
          icon={<Users className="w-5 h-5" />} color="indigo" />
      </div>

      {/* Per-agent table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Per-Agent Breakdown</h3>
          <p className="text-xs text-slate-500 mt-1">Click the ✏️ pencil icon to override prices for a specific agent (leave blank to use global rates)</p>
        </div>
        <div>
          {(summary?.agents || []).map((agent: any) => (
            <AgentPayoutRow key={agent.id} agent={agent} onPriceChange={handlePriceChange} />
          ))}
          {(!summary?.agents?.length) && (
            <div className="p-10 text-center text-slate-400">No approved agents yet.</div>
          )}
        </div>
        {summary?.agents?.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
            <span className="font-bold text-slate-700">Grand Total</span>
            <span className="text-xl font-bold text-blue-700">{(summary?.total_payout || 0).toFixed(0)} Birr</span>
          </div>
        )}
      </div>
    </div>
  )
}
