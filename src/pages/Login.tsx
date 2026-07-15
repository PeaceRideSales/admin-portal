import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')

      localStorage.setItem('admin_token', data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center clay-bg-blue py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 clay-card-blue p-10">
        <div>
          <div className="mx-auto h-20 w-20 bg-blue-500 rounded-3xl flex items-center justify-center text-white clay-btn-blue">
            <img src="/logo.png" alt="Peace Ride" className="w-12 h-12 object-contain " onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <h2 className="mt-8 text-center text-3xl font-extrabold text-white">
            Admin Portal
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-blue-100 mb-2 ml-1">Email address</label>
              <input
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 clay-pressed-blue placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white sm:text-sm border-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-100 mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 clay-pressed-blue placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white sm:text-sm border-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 clay-btn-blue text-sm text-white focus:outline-none disabled:opacity-50 mt-4"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
