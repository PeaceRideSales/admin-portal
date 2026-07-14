import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AgentDetailModal from '../components/AgentDetailModal'
import { api } from '../api'

const statusStyle: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-800',
  PENDING:  'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function Agents() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<any | null>(null)

  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get('/agents')
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'APPROVED' | 'REJECTED' }) => 
      api.patch(`/agents/${id}/status`, { status }),
    onSuccess: () => {
      setSelected(null)
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  const updatePrice = useMutation({
    mutationFn: ({ id, price }: { id: string, price: number | null }) => 
      api.patch(`/payout/agents/${id}/price`, { price }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] })
  })

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agents</h1>
        <p className="text-slate-500 text-sm">{agents.length} total agents</p>
      </div>

      <div className="space-y-4">
        {agents.map((agent: any, idx: number) => {
          // pick a subtle colorful tint based on index
          const colors = ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-indigo-100', 'bg-rose-100']
          const colorBg = colors[idx % colors.length]
          return (
            <div key={agent.id} onClick={() => setSelected(agent)}
              className={`clay-list-card p-4 md:px-6 flex items-center justify-between ${colorBg}`}>
              <div className="flex items-center space-x-4 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base transition-colors">
                    {agent.full_name || 'Unknown Name'}
                  </h4>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusStyle[agent.status]}`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">@{agent.telegram_username}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="hidden sm:block text-right bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-2xl">
                  <p className="text-base font-black text-slate-800 dark:text-white">{agent.driver_count}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">drivers</p>
                </div>
                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center clay-btn text-slate-400">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
        {agents.length === 0 && (
          <div className="clay-card p-10 text-center text-slate-400 font-bold">No agents registered yet.</div>
        )}
      </div>

      <AgentDetailModal
        agent={selected}
        onClose={() => setSelected(null)}
        onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
        onUpdatePrice={(id, price) => updatePrice.mutate({ id, price })}
      />
    </div>
  )
}
