interface StatCardProps {
  label: string
  value: number | string | undefined
  icon: React.ReactNode
  color?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose'
  suffix?: string
}

const colorMap = {
  blue:    { text: 'text-blue-700 dark:text-blue-400',       icon: 'clay-btn-blue text-white' },
  emerald: { text: 'text-emerald-700 dark:text-emerald-400', icon: 'clay-btn-emerald text-white' },
  amber:   { text: 'text-amber-700 dark:text-amber-400',     icon: 'clay-btn-amber text-white' },
  indigo:  { text: 'text-indigo-700 dark:text-indigo-400',   icon: 'clay-btn-indigo text-white' },
  rose:    { text: 'text-rose-700 dark:text-rose-400',       icon: 'clay-btn-rose text-white' },
}

export default function StatCard({ label, value, icon, color = 'blue', suffix }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="clay-card p-4 md:p-5 flex items-center gap-4">
      <div className={`${c.icon} w-12 h-12 flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className={`text-2xl font-bold ${c.text} mt-0.5`}>
          {value ?? 0}{suffix}
        </p>
      </div>
    </div>
  )
}
