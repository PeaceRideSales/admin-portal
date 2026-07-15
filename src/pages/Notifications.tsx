import { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, Clock, Download, RefreshCw, Search, Send } from 'lucide-react'
import Modal from '../components/Modal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const statusConfig: Record<string, { icon: any; cls: string; label: string }> = {
  COMPLETED: { icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-100', label: 'Sent' },
  PENDING:   { icon: Clock,       cls: 'text-amber-600 bg-amber-100',    label: 'Pending' },
  FAILED:    { icon: XCircle,     cls: 'text-red-600 bg-red-100',        label: 'Failed' },
}

export default function Notifications() {
  const [messages, setMessages] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('ALL')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeType, setComposeType] = useState<'ALL' | 'INDIVIDUAL'>('ALL')
  const [composeMessage, setComposeMessage] = useState('')
  const [composeAgentId, setComposeAgentId] = useState('')
  const [composeSubmitting, setComposeSubmitting] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [agentsLoading, setAgentsLoading] = useState(true)

  // Fetch messages when page changes
  useEffect(() => { fetchMessages() }, [page])

  // Pre-fetch agents on mount so they're ready when modal opens
  useEffect(() => { fetchAgents() }, [])

  useEffect(() => {
    if (isComposeOpen) {
      setComposeType('ALL')
    }
  }, [isComposeOpen])

  async function fetchAgents() {
    setAgentsLoading(true)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/agents`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        console.log('[Compose] Agents loaded:', data.length, data[0])
        setAgents(Array.isArray(data) ? data : [])
        if (data.length > 0) setComposeAgentId(String(data[0].telegram_id))
      } else {
        console.error('[Compose] Failed to fetch agents:', res.status, await res.text())
        setAgents([])
      }
    } catch (e) {
      console.error('[Compose] Error fetching agents:', e)
      setAgents([])
    } finally {
      setAgentsLoading(false)
    }
  }

  async function handleSendNotification() {
    if (!composeMessage.trim()) return
    setComposeSubmitting(true)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: composeType,
          telegram_id: composeType === 'INDIVIDUAL' ? Number(composeAgentId) : undefined,
          message: composeMessage,
        }),
      })
      if (res.ok) {
        setIsComposeOpen(false)
        setComposeMessage('')
        fetchMessages()
      } else {
        const err = await res.json()
        alert(`Failed: ${err.message || JSON.stringify(err)}`)
      }
    } catch (err: any) { alert(`Error: ${err.message}`) }
    finally { setComposeSubmitting(false) }
  }

  async function fetchMessages() {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/notifications?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.data || [])
        setTotal(data.total || 0)
      }
    } catch { } finally { setLoading(false) }
  }

  function downloadCSV() {
    const filtered = messages.filter(m =>
      (statusFilter === 'ALL' || m.status === statusFilter) &&
      (m.chat_id?.includes(search) || m.message?.toLowerCase().includes(search.toLowerCase()))
    )
    const header = ['id', 'chat_id', 'status', 'message', 'error', 'created_at', 'processed_at']
    const rows = filtered.map(m => header.map(h => `"${String(m[h] ?? '').replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = messages.filter(m =>
    (statusFilter === 'ALL' || m.status === statusFilter) &&
    (search === '' || String(m.chat_id).includes(search) || m.message?.toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notification Logs</h1>
          <p className="text-slate-500 text-sm">{total} total messages in the Telegram queue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Send className="w-4 h-4" /> Compose
          </button>
          <button onClick={fetchMessages}
            className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search by chat ID or message…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 text-sm clay-pressed border-0 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'COMPLETED', 'FAILED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${statusFilter === s ? 'clay-pressed text-blue-600' : 'clay-btn text-slate-500 hover:text-blue-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="clay-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(msg => {
              const sc = statusConfig[msg.status] || statusConfig.PENDING
              const Icon = sc.icon
              return (
                <div key={msg.id} 
                     onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                     className="p-4 md:px-6 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>
                        <Icon className="w-3 h-3" />{sc.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Chat: {msg.chat_id}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className={`text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed ${expandedId === msg.id ? '' : 'line-clamp-3'}`}>{msg.message}</p>
                    {msg.error && <p className={`text-xs text-red-500 mt-1 font-mono break-words ${expandedId === msg.id ? '' : 'truncate'}`}>Error: {msg.error}</p>}
                    {msg.processed_at && <p className="text-xs text-slate-400 mt-1">Processed: {new Date(msg.processed_at).toLocaleString()}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-300 bg-slate-50 rounded-b-xl">
            <p className="text-sm text-slate-500">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isComposeOpen} onClose={() => { setIsComposeOpen(false); setComposeMessage('') }} title="Send Notification">
        <div className="space-y-5">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Audience</p>
            <div className="flex rounded-xl overflow-hidden border-2 border-slate-200">
              <button type="button" onClick={() => setComposeType('ALL')}
                className={`flex-1 py-3 text-sm font-bold transition-all ${composeType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                📢 All Agents
              </button>
              <button type="button" onClick={() => setComposeType('INDIVIDUAL')}
                className={`flex-1 py-3 text-sm font-bold transition-all border-l-2 border-slate-200 ${composeType === 'INDIVIDUAL' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                👤 Individual
              </button>
            </div>
          </div>

          {composeType === 'INDIVIDUAL' && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Agent</p>
              {agentsLoading ? (
                <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-400">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" /> Loading agents…
                </div>
              ) : agents.length === 0 ? (
                <div className="w-full py-3 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-400 text-center">No agents found</div>
              ) : (
                <div className="relative">
                  <select value={composeAgentId} onChange={e => setComposeAgentId(e.target.value)}
                    style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm pr-10 appearance-none">
                    {agents.map(a => (
                      <option key={a.id} value={a.telegram_id} style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>
                        {a.full_name}{a.telegram_username ? ` (@${a.telegram_username})` : ` — ID ${a.telegram_id}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▾</div>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</p>
            <textarea rows={5} value={composeMessage} onChange={e => setComposeMessage(e.target.value)}
              placeholder="Type your message here…"
              style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none placeholder-slate-400 shadow-sm" />
            <p className="text-[10px] text-slate-400 mt-1.5">💡 The recipient's name is automatically added as a greeting.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsComposeOpen(false); setComposeMessage('') }}
              className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSendNotification}
              disabled={composeSubmitting || !composeMessage.trim() || (composeType === 'INDIVIDUAL' && !composeAgentId)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md">
              {composeSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send Message</>
              )}
            </button>
          </div>

        </div>
      </Modal>
    </div>
  )
}
