import { useState, useEffect } from 'react'
import { DollarSign, Save, CheckCircle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function Settings() {
  const [price, setPrice] = useState<string>('0')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPrice(String(data.driver_registration_price ?? 0))
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
        body: JSON.stringify({ driver_registration_price: parseFloat(price) || 0 })
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
        <p className="text-slate-500 text-sm">Configure global system settings</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Registration Pricing</h3>
            <p className="text-xs text-slate-500">Set the earnings agents receive per driver registered</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Settings saved successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Price Per Driver Registration
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-900"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This amount will be used to calculate each agent's total earnings in the Mini App.
              If set to $5, an agent with 10 drivers will see $50 in earnings.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">Preview</p>
            <p className="text-xs text-blue-600 mt-1">
              An agent with 10 drivers will earn:{' '}
              <span className="font-bold">${(parseFloat(price || '0') * 10).toFixed(2)}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
