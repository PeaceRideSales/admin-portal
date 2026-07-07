import { useState, useEffect } from 'react'
import { Activity, User, Target, Settings } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const actionIcons = {
  VERIFY_DRIVER: <Target className="w-4 h-4 text-emerald-600" />,
  DECLINE_DRIVER: <Target className="w-4 h-4 text-red-600" />,
  UPDATE_SETTINGS: <Settings className="w-4 h-4 text-blue-600" />,
  DEFAULT: <Activity className="w-4 h-4 text-slate-400" />
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLogs() }, [page])

  async function fetchLogs() {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/audit-logs?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = res.ok ? await res.json() : { data: [], total: 0 }
      setLogs(json.data || [])
      setTotal(json.total || 0)
    } catch { 
      setLogs([])
      setTotal(0)
    }
    finally { setLoading(false) }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm">Security and activity history ({total} records)</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Admin</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Entity</th>
                    <th className="px-6 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {log.admin?.email || log.admin_id}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {actionIcons[log.action as keyof typeof actionIcons] || actionIcons.DEFAULT}
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-slate-500 font-mono text-xs bg-slate-50 px-2 py-1 rounded">
                          {log.entity_type}:{log.entity_id}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="max-w-xs truncate text-xs text-slate-500">
                          {JSON.stringify(log.details)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span>
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium text-slate-700"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm font-medium text-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
