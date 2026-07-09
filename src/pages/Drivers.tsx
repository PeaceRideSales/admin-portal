import { useState } from 'react'
import { Car, MapPin, Eye, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DriverDetailModal from '../components/DriverDetailModal'
import { api } from '../api'

const statusBadge = {
  VERIFIED: { icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-100', label: 'Verified' },
  PENDING:  { icon: Clock,       cls: 'text-amber-600  bg-amber-100',   label: 'Pending' },
  DECLINED: { icon: XCircle,     cls: 'text-red-600    bg-red-100',     label: 'Declined' },
}

export default function Drivers() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'DECLINED'>('ALL')
  const [selected, setSelected] = useState<any | null>(null)

  const { data = { data: [], total: 0 }, isLoading: loading } = useQuery({
    queryKey: ['drivers', page, limit],
    queryFn: () => api.get(`/drivers?page=${page}&limit=${limit}`)
  })

  const drivers = data.data || []
  const total = data.total || 0

  const verifyDriver = useMutation({
    mutationFn: (id: string) => api.patch(`/drivers/${id}/verify`, {}),
    onSuccess: () => {
      setSelected(null)
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    }
  })

  const declineDriver = useMutation({
    mutationFn: ({ id, note }: { id: string, note: string }) => 
      api.patch(`/drivers/${id}/decline`, { admin_note: note }),
    onSuccess: () => {
      setSelected(null)
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    }
  })

  const filtered = drivers
    .filter(d => filter === 'ALL' || d.status === filter)
    .filter(d =>
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.location?.toLowerCase().includes(search.toLowerCase()) ||
      d.car_model?.toLowerCase().includes(search.toLowerCase())
    )

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
          <p className="text-slate-500 text-sm">{total} total registrations</p>
        </div>
        <input type="search" placeholder="Search by name, location, car..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      {/* Status filter tabs (Only filters current page) */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'VERIFIED', 'DECLINED'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 flex-1">
              {filtered.map(driver => {
                const sb = statusBadge[driver.status as keyof typeof statusBadge] || statusBadge.PENDING
                const Icon = sb.icon
                return (
                  <div key={driver.id} onClick={() => setSelected(driver)}
                    className="p-4 md:px-6 hover:bg-blue-50 cursor-pointer transition-colors group flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{driver.full_name}</h4>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sb.cls}`}>
                          <Icon className="w-3 h-3" />{sb.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Car className="w-3 h-3" />{driver.car_model}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{driver.location || 'Unknown'}</span>
                        {driver.vehicle_category && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            driver.vehicle_category === 'LATEST_OR_EV' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {driver.vehicle_category === 'LATEST_OR_EV' ? 'Latest / EV' : 'Older'}
                          </span>
                        )}
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 ml-4" />
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="p-10 text-center text-slate-400">
                  {search || filter !== 'ALL' ? 'No drivers match your filter.' : 'No drivers registered on this page.'}
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span> results
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DriverDetailModal 
        driver={selected} 
        onClose={() => setSelected(null)} 
        onVerify={(id) => verifyDriver.mutate(id)} 
        onDecline={(id, note) => declineDriver.mutate({ id, note })} 
      />
    </div>
  )
}
