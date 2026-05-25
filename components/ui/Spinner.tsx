export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <div className={`${s} border-2 border-border border-t-accent rounded-full animate-spin`} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-subtext text-sm">Loading…</p>
      </div>
    </div>
  )
}
