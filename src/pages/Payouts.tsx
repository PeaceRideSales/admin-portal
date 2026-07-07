import { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, Edit2, Check, X } from 'lucide-react'
import StatCard from '../components/StatCard'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function AgentPayoutRow({ agent, globalPrice, onPriceChange }: {
  agent: any
  globalPrice: number
  onPriceChange: (id: string, price: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [priceInput, setPriceInput] = useState(String(agent.price_per_driver))

  function handleSave() {
    const val = priceInput === '' ? null : parseFloat(priceInput)
    onPriceChange(agent.id, val)
    setEditing(false)
  }

  return (
    <div className="p-4 md:px-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900 text-sm">{agent.full_name || 'Unknown'}</h4>
          <p className="text-xs text-slate-500">@{agent.telegram_username}</p>
          <div className="flex gap-3 mt-1 text-xs text-slate-400 flex-wrap">
            <span className="text-emerald-600 font-semibold">{agent.verified_drivers} verified</span>
            <span className="text-amber-600">{agent.pending_drivers} pending</span>
            {agent.declined_drivers > 0 && <span className="text-red-500">{agent.declined_drivers} declined</span>}
          </div>
          {agent.payment_method && agent.payment_details && (
            <div className="mt-2 text-xs bg-slate-100 px-2 py-1.5 rounded inline-block">
              <span className="font-semibold text-slate-600">{agent.payment_method}:</span>{' '}
              <span className="text-slate-800 font-mono select-all">{agent.payment_details}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Price editor */}
          {editing ? (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-sm">$</span>
              <input type="number" min="0" step="0.01" value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus />
              <button onClick={handleSave} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setEditing(false); setPriceInput(String(agent.price_per_driver)) }}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {agent.has_custom_price ? (
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-semibold">${agent.price_per_driver}/driver</span>
                ) : (
                  <span className="text-slate-400">global (${globalPrice})</span>
                )}
              </span>
              <button onClick={() => { setPriceInput(String(agent.price_per_driver)); setEditing(true) }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* Payout amount */}
          <div className="text-right min-w-[80px]">
            <p className="text-lg font-bold text-slate-900">${agent.payout.toFixed(2)}</p>
            <p className="text-xs text-slate-400">payout</p>
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

  async function handlePriceChange(agentId: string, price: number | null) {
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/payout/agents/${agentId}/price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price }),
    })
    fetchSummary()
  }

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const globalPrice = summary?.global_price || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-500 text-sm">Earnings based on verified drivers only</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Payout" value={`$${(summary?.total_payout || 0).toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5" />} color="emerald" />
        <StatCard label="Verified Drivers" value={summary?.total_verified_drivers || 0}
          icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <StatCard label="Global Price/Driver" value={`$${globalPrice.toFixed(2)}`}
          icon={<Users className="w-5 h-5" />} color="indigo" />
      </div>

      {/* Per-agent table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Per-Agent Breakdown</h3>
          <p className="text-xs text-slate-500 mt-1">Click the ✏️ pencil icon to set a custom price for an agent</p>
        </div>
        <div>
          {(summary?.agents || []).map((agent: any) => (
            <AgentPayoutRow key={agent.id} agent={agent} globalPrice={globalPrice} onPriceChange={handlePriceChange} />
          ))}
          {(!summary?.agents?.length) && (
            <div className="p-10 text-center text-slate-400">No approved agents yet.</div>
          )}
        </div>
        {/* Total row */}
        {summary?.agents?.length > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
            <span className="font-bold text-slate-700">Total</span>
            <span className="text-xl font-bold text-blue-700">${(summary?.total_payout || 0).toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
