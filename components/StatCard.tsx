import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon?: React.ReactNode
  color?: string
  sub?: string
  className?: string
}

export default function StatCard({ title, value, icon, color = 'text-accent', sub, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-subtext text-xs font-medium uppercase tracking-wider">{title}</p>
        {icon && <span className={cn('opacity-70', color)}>{icon}</span>}
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      {sub && <p className="text-subtext text-xs mt-1">{sub}</p>}
    </div>
  )
}
