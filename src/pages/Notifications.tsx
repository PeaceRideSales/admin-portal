import { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, Clock, Download, RefreshCw, Search } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const statusConfig: Record<string, { icon: any; cls: string; label: string }> = {
  COMPLETED: { icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-100', label: 'Sent' },
  PENDING:   { icon: Clock,        cls: 'text-amber-600 bg-amber-100',   label: 'Pending' },
  FAILED:    { icon: XCircle,      cls: 'text-red-600 bg-red-100',       label: 'Failed' },
}

export default function Notifications() {
  const [messages, setMessages] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'>('ALL')

  useEffect(() => { fetchMessages() }, [page])

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
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  function downloadCSV() {
    const filtered = messages.filter(m =>
      (statusFilter === 'ALL' || m.status === statusFilter) &&
      (m.chat_id?.includes(search) || m.message?.toLowerCase().includes(search.toLowerCase()))
    )
    const header = ['id', 'chat_id', 'status', 'message', 'error', 'created_at', 'processed_at']
    const rows = filtered.map(m =>
      header.map(h => {
        const val = m[h] ?? ''
        // Escape commas and quotes
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(',')
    )
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telegram-notifications-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = messages.filter(m =>
    (statusFilter === 'ALL' || m.status === statusFilter) &&
    (search === '' || m.chat_id?.includes(search) || m.message?.toLowerCase().includes(search.toLowerCase()))
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
          <button
            onClick={fetchMessages}
            className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by chat ID or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 text-sm clay-pressed border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'COMPLETED', 'FAILED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                statusFilter === s ? 'clay-pressed text-blue-600' : 'clay-btn text-slate-500 hover:text-blue-600'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                <div key={msg.id} className="p-4 md:px-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.cls}`}>
                          <Icon className="w-3 h-3" />{sc.label}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Chat: {msg.chat_id}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed line-clamp-3">
                        {msg.message}
                      </p>
                      {msg.error && (
                        <p className="text-xs text-red-500 mt-1 font-mono truncate">Error: {msg.error}</p>
                      )}
                      {msg.processed_at && (
                        <p className="text-xs text-slate-400 mt-1">
                          Processed: {new Date(msg.processed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-300 bg-slate-50 rounded-b-xl">
            <p className="text-sm text-slate-500">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
