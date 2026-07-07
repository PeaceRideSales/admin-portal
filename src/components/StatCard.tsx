interface StatCardProps {
  label: string
  value: number | string | undefined
  icon: React.ReactNode
  color?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose'
  suffix?: string
}

const colorMap = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'bg-blue-100 text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'bg-amber-100 text-amber-600' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  icon: 'bg-indigo-100 text-indigo-600' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: 'bg-rose-100 text-rose-600' },
}

export default function StatCard({ label, value, icon, color = 'blue', suffix }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl p-4 md:p-5 border border-white shadow-sm flex items-center gap-4`}>
      <div className={`${c.icon} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className={`text-2xl font-bold ${c.text} mt-0.5`}>
          {value ?? 0}{suffix}
        </p>
      </div>
    </div>
  )
}
