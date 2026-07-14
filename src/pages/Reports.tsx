import { useState, useEffect } from 'react'
import { FileSpreadsheet, UserSquare2, ChevronDown } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function Reports() {
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  async function fetchAgents() {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setAgents(await res.json())
      }
    } catch { /* silent */ }
  }

  function handleExportAll() {
    exportData(`${API}/export/all`, `peace-ride-all-drivers-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  async function handleSyncGoogleSheets() {
    if (!confirm('This will overwrite the target Google Sheet with the latest driver data. Make sure your Google Sheet ID is saved in Settings. Continue?')) {
      return
    }
    setSyncing(true)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${API}/export/google-sheets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Sync failed')
      }
      alert(data.message || 'Successfully synced to Google Sheets!')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSyncing(false)
    }
  }

  function handleExportAgent() {
    if (!selectedAgent) return
    exportData(`${API}/export/agent/${selectedAgent}`, `peace-ride-agent-${selectedAgent}-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function exportData(url: string, filename: string) {
    setLoading(true)
    const token = localStorage.getItem('admin_token')
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Export failed. Check your database permissions.');
      }
      return res.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
    .catch(err => {
      alert(err.message)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Global Export */}
      <div className="clay-card p-6">
        <div className="flex items-start">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Export All Data</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Download a complete Excel spreadsheet containing all drivers registered by all agents.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleExportAll}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:bg-slate-300"
              >
                {loading ? 'Generating...' : 'Download Global Export'}
              </button>
              <button
                onClick={handleSyncGoogleSheets}
                disabled={syncing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors disabled:bg-slate-300"
              >
                {syncing ? 'Syncing...' : 'Sync to Google Sheets'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Agent Export */}
      <div className="clay-card p-6">
        <div className="flex items-start">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 mr-4">
            <UserSquare2 size={24} />
          </div>
          <div className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900">Export Individual Agent</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Select an agent to download an Excel sheet containing only the drivers they have registered.
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select 
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg block p-2.5 pr-8 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select an agent...</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.full_name || `@${a.telegram_username}`}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <button
                onClick={handleExportAgent}
                disabled={loading || !selectedAgent}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors disabled:bg-slate-300 shrink-0"
              >
                {loading ? 'Generating...' : 'Export Agent'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
