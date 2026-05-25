import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  message?: string   // alias for description
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, message, action, className }: EmptyStateProps) {
  const desc = description || message
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && <div className="text-subtext/30 mb-4">{icon}</div>}
      <p className="text-text font-medium mb-1">{title}</p>
      {desc && <p className="text-subtext text-sm mb-4">{desc}</p>}
      {action}
    </div>
  )
}
