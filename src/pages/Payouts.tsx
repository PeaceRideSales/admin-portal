import { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, Edit2, Check, X, Car, Clock, AlertCircle } from 'lucide-react'
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
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="flex items-center gap-2 text-xs text-slate-300">
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>{badge}</span>
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input type="number" min="0" step="1" value={input}
            onChange={e => setInput(e.target.value)}
            className="w-20 px-2 py-1 text-sm bg-slate-700 border border-blue-500/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <span className="text-xs text-slate-400">Birr</span>
          <button onClick={handleSave} className="p-1 text-emerald-400 hover:bg-emerald-900/30 rounded-lg transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setEditing(false); setInput(value !== null ? String(value) : '') }} className="p-1 text-slate-500 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {value !== null ? `${value} Birr` : <span className="text-slate-500 italic text-xs font-normal">global default</span>}
          </span>
          <button onClick={() => setEditing(true)} className="p-1 text-slate-500 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors">
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
    <div className="p-4 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Agent info */}
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-white text-base">{agent.full_name || 'Unknown'}</h4>
          <p className="text-xs text-slate-400 mt-0.5">@{agent.telegram_username}</p>

          {/* Driver stats */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-lg">
              <Car className="w-3 h-3" />{agent.verified_drivers} verified
            </span>
            {agent.pending_drivers > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-900/30 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" />{agent.pending_drivers} pending
              </span>
            )}
            {agent.declined_drivers > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-900/30 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" />{agent.declined_drivers} declined
              </span>
            )}
          </div>

          {/* Payment method */}
          {agent.payment_method && agent.payment_details && (
            <div className="mt-2 text-xs bg-slate-700/60 px-3 py-1.5 rounded-xl inline-flex items-center gap-2">
              <span className="font-bold text-slate-300">{agent.payment_method}:</span>
              <span className="text-white font-mono select-all tracking-wide">{agent.payment_details}</span>
            </div>
          )}
        </div>

        {/* Right: Override + Payout */}
        <div className="flex flex-col sm:flex-row items-start gap-4 shrink-0">
          {/* Price overrides */}
          <div className="min-w-[210px] border border-slate-600/50 rounded-2xl px-4 py-3 bg-slate-800/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Agent Overrides</p>
            <PriceField
              label="Latest / EV"
              value={agent.price_latest_model}
              onSave={v => onPriceChange(agent.id, 'price_latest_model', v)}
              badge="Latest"
              badgeColor="bg-indigo-900/60 text-indigo-300"
            />
            <PriceField
              label="Older Model"
              value={agent.price_older_model}
              onSave={v => onPriceChange(agent.id, 'price_older_model', v)}
              badge="Older"
              badgeColor="bg-slate-700 text-slate-300"
            />
          </div>

          {/* Payout total */}
          <div className="text-right min-w-[90px] bg-slate-800/60 rounded-2xl px-4 py-3 border border-slate-600/50">
            <p className="text-2xl font-black text-white leading-none">{agent.payout.toFixed(0)}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Birr total</p>
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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Payouts</h1>
        <p className="text-slate-400 text-sm">Earnings based on verified drivers · Tiered by vehicle category</p>
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
          icon={<Users className="w-5 h-5" />} color="amber" />
      </div>

      {/* Per-agent table */}
      <div className="clay-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Per-Agent Breakdown</h3>
            <p className="text-xs text-slate-400 mt-1">Click the ✏️ pencil to override rates per agent — leave blank to use global rates</p>
          </div>
        </div>

        <div className="p-4 space-y-4 bg-slate-900/30">
          {(summary?.agents || []).map((agent: any, idx: number) => {
            const colors = ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-indigo-100', 'bg-rose-100']
            const colorBg = colors[idx % colors.length]
            return (
              <div key={agent.id} className={`clay-list-card ${colorBg}`}>
                <AgentPayoutRow agent={agent} onPriceChange={handlePriceChange} />
              </div>
            )
          })}
          {(!summary?.agents?.length) && (
            <div className="p-10 text-center text-slate-500 font-bold">No approved agents yet.</div>
          )}
        </div>

        {summary?.agents?.length > 0 && (
          <div className="px-6 py-5 bg-slate-800/60 border-t border-slate-700/60 flex justify-between items-center">
            <div>
              <span className="font-bold text-white text-base">Grand Total</span>
              <p className="text-xs text-slate-400 mt-0.5">{summary.agents.length} agents</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">{(summary?.total_payout || 0).toFixed(0)}</span>
              <span className="text-sm text-slate-400 ml-1.5">Birr</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
