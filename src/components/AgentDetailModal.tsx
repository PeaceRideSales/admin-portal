import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, AlertCircle, DollarSign, Save } from 'lucide-react'
import Modal from './Modal'

interface AgentDetailModalProps {
  agent: any | null
  onClose: () => void
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void
  onUpdatePrice: (id: string, price: number | null) => void
}

const statusStyle = {
  APPROVED: 'bg-emerald-100 text-emerald-800',
  PENDING:  'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function AgentDetailModal({ agent, onClose, onUpdateStatus, onUpdatePrice }: AgentDetailModalProps) {
  const [priceInput, setPriceInput] = useState('')
  const [priceSaved, setPriceSaved] = useState(false)

  // Sync price input when agent changes
  useEffect(() => {
    if (agent) {
      setPriceInput(agent.price_per_driver !== null && agent.price_per_driver !== undefined
        ? String(agent.price_per_driver)
        : '')
      setPriceSaved(false)
    }
  }, [agent?.id])

  function handleSavePrice() {
    if (!agent) return
    const price = priceInput === '' ? null : parseFloat(priceInput)
    onUpdatePrice(agent.id, price)
    setPriceSaved(true)
    setTimeout(() => setPriceSaved(false), 2500)
  }

  const [activeTab, setActiveTab] = useState<'details' | 'drivers'>('details')
  const [drivers, setDrivers] = useState<any[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  useEffect(() => {
    if (agent && activeTab === 'drivers') {
      fetchDrivers()
    }
  }, [agent?.id, activeTab])

  async function fetchDrivers() {
    if (!agent) return
    setLoadingDrivers(true)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/drivers?agent_id=${agent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setDrivers(json.data || [])
      }
    } catch { /* ignore */ }
    finally { setLoadingDrivers(false) }
  }

  async function handleVerify(driverId: string) {
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/drivers/${driverId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchDrivers()
  }

  async function handleDecline(driverId: string) {
    const note = prompt('Enter reason for declining (optional):')
    if (note === null) return // cancelled
    const token = localStorage.getItem('admin_token')
    await fetch(`${API}/drivers/${driverId}/decline`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ admin_note: note })
    })
    fetchDrivers()
  }

  return (
    <Modal isOpen={!!agent} onClose={() => { onClose(); setActiveTab('details') }} title="Agent Details">
      {agent && (
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'drivers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Drivers ({agent.driver_count ?? 0})
            </button>
          </div>

          {activeTab === 'details' ? (
            <>
              {/* Avatar & name */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{agent.full_name || 'Unknown'}</h3>
                <p className="text-slate-500 text-sm">@{agent.telegram_username}</p>
              </div>

              {agent.appealed && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col gap-1 mb-2">
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4" /> Account Appealed
                  </div>
                  <p className="text-sm text-purple-900 italic leading-relaxed">"{agent.appeal_reason}"</p>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Drivers</div>
                  <div className="text-2xl font-bold text-slate-900">{agent.driver_count ?? 0}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Status</div>
                  <span className={`inline-flex px-3 py-1 text-xs uppercase font-bold rounded-full ${statusStyle[agent.status as keyof typeof statusStyle]}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Price per driver */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-blue-800">Custom Price Per Driver</p>
                </div>
                <p className="text-xs text-blue-600">
                  Leave blank to use the global default price. Custom price overrides global for this agent only.
                </p>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Use global price"
                      value={priceInput}
                      onChange={e => { setPriceInput(e.target.value); setPriceSaved(false) }}
                      className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <button onClick={handleSavePrice}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      priceSaved
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}>
                    {priceSaved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
                {agent.price_per_driver !== null && agent.price_per_driver !== undefined && (
                  <button onClick={() => { setPriceInput(''); onUpdatePrice(agent.id, null) }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors underline">
                    Remove custom price (revert to global)
                  </button>
                )}
              </div>

              {/* Payment Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Details</h4>
                {agent.payment_method && agent.payment_details ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold text-slate-900">{agent.payment_method}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Account / Phone:</span>
                      <span className="font-mono font-semibold text-slate-900 select-all">{agent.payment_details}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No payment details provided yet.</p>
                )}
              </div>

              {/* Agent Documents */}
              {agent.documents && agent.documents.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Documents</h4>
                  <div className="flex flex-col gap-2">
                    {agent.documents.map((doc: any, i: number) => {
                      const docUrl = typeof doc === 'string' ? doc : (doc?.url || doc?.document_url || doc?.file_url || doc?.fileUrl || '')
                      const docName = (typeof doc === 'object' && doc?.type_id) ? doc.type_id : `Document ${i + 1}`
                      return (
                        <a key={i} href={docUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                          View Document: {docName}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Status actions */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Actions</h4>
                {agent.status === 'PENDING' && (
                  <>
                    <button onClick={() => onUpdateStatus(agent.id, 'APPROVED')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                      <CheckCircle className="w-5 h-5 mr-2" /> Approve Agent
                    </button>
                    <button onClick={() => onUpdateStatus(agent.id, 'REJECTED')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors">
                      <XCircle className="w-5 h-5 mr-2" /> Reject Agent
                    </button>
                  </>
                )}
                {agent.status === 'APPROVED' && (
                  <button onClick={() => onUpdateStatus(agent.id, 'REJECTED')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors">
                    <AlertCircle className="w-5 h-5 mr-2" /> Revoke Access
                  </button>
                )}
                {agent.status === 'REJECTED' && (
                  <button onClick={() => onUpdateStatus(agent.id, 'APPROVED')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                    <CheckCircle className="w-5 h-5 mr-2" /> Re-Approve Agent
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {loadingDrivers ? (
                <div className="text-center py-8 text-slate-500">Loading drivers...</div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No drivers registered yet.</div>
              ) : (
                drivers.map(d => (
                  <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{d.full_name}</h4>
                        <p className="text-xs text-slate-500 font-mono">{d.phone}</p>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        d.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400">Plate:</span> <span className="font-semibold text-slate-700 uppercase">{d.license_plate}</span></div>
                      <div><span className="text-slate-400">Car:</span> <span className="font-semibold text-slate-700">{d.car_type}</span></div>
                    </div>

                    {d.documents && d.documents.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Documents</span>
                        {d.documents.map((doc: any, i: number) => (
                          <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">
                            View {doc.type_id}
                          </a>
                        ))}
                      </div>
                    )}

                    {d.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => handleVerify(d.id)} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 rounded text-xs transition-colors">Verify</button>
                        <button onClick={() => handleDecline(d.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-1.5 rounded text-xs transition-colors">Decline</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </Modal>
  )
}
