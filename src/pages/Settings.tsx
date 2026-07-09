import { useState, useEffect } from 'react'
import { DollarSign, Save, CheckCircle, Car } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function Settings() {
  const [priceLatest, setPriceLatest] = useState('150')
  const [priceOlder, setPriceOlder] = useState('120')
  const [googleSheetId, setGoogleSheetId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setPriceLatest(String(data.price_latest_model ?? 150))
        setPriceOlder(String(data.price_older_model ?? 120))
        setGoogleSheetId(data.google_sheet_id || '')
      }
    } catch { setError('Failed to load settings') }
    finally { setLoading(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          price_latest_model: parseFloat(priceLatest) || 150,
          price_older_model: parseFloat(priceOlder) || 120,
          google_sheet_id: googleSheetId
        })
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Could not save settings. Please try again.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Configure global payout rates for agents</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Settings saved successfully!
          </div>
        )}

        {/* Tiered Global Pricing */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Global Payout Rates (Birr)</h3>
              <p className="text-xs text-slate-500">Default rates applied to all agents unless overridden individually in Payouts</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Latest Model / EV */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase tracking-wider">Latest / EV</span>
                Latest Model (2020+) or Electric Vehicle
              </label>
              <div className="relative">
                <input
                  type="number" min="0" step="1" value={priceLatest}
                  onChange={e => setPriceLatest(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900"
                  placeholder="150"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">Birr</span>
              </div>
            </div>

            {/* Older Model */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">Older</span>
                Older / Standard Model (Pre-2020)
              </label>
              <div className="relative">
                <input
                  type="number" min="0" step="1" value={priceOlder}
                  onChange={e => setPriceOlder(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900"
                  placeholder="120"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">Birr</span>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-blue-500 font-medium">Latest / EV — 10 drivers</p>
                <p className="text-xl font-bold text-blue-700">{((parseFloat(priceLatest) || 0) * 10).toLocaleString()} Birr</p>
              </div>
              <div>
                <p className="text-xs text-blue-500 font-medium">Older — 10 drivers</p>
                <p className="text-xl font-bold text-blue-700">{((parseFloat(priceOlder) || 0) * 10).toLocaleString()} Birr</p>
              </div>
            </div>
          </div>
        </div>

        {/* Google Sheets */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Google Sheets Integration</h3>
              <p className="text-xs text-slate-500">Sync driver data to a Google Sheet for reporting</p>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Google Sheet ID</label>
            <input
              type="text" value={googleSheetId}
              onChange={e => setGoogleSheetId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
            <p className="text-xs text-slate-500 mt-2">
              Found in your Google Sheets URL between <code>/d/</code> and <code>/edit</code>.
            </p>
          </div>
        </div>

        <button
          type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
