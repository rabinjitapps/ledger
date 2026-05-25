'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, FileText, Users, BookMarked,
  Building2, Landmark, Scale, BarChart3, LogOut, Menu, X,
  ChevronRight, UserCog,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, perm: 'dashboard'     },
  { href: '/ledger',        label: 'Ledger Book',   icon: BookOpen,        perm: 'ledger'        },
  { href: '/bills',         label: 'Bills',         icon: FileText,        perm: 'bills'         },
  { href: '/cashbook',      label: 'Cashbook',      icon: BookMarked,      perm: 'cashbook'      },
  { href: '/vendors',       label: 'Vendors',       icon: Users,           perm: 'vendors'       },
  { href: '/accounts',      label: 'Accounts',      icon: Building2,       perm: 'accounts'      },
  { href: '/funds',         label: 'Funds',         icon: Landmark,        perm: 'funds'         },
  { href: '/trial-balance', label: 'Trial Balance', icon: Scale,           perm: 'trial-balance' },
  { href: '/reports',       label: 'Reports',       icon: BarChart3,       perm: 'reports'       },
]

const ADMIN_NAV = [
  { href: '/users', label: 'User Management', icon: UserCog },
]

interface SessionData {
  type: 'admin' | 'user' | null
  permissions?: string[]
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const [session, setSession] = useState<SessionData>({ type: null })
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false)
    fetch('/api/auth/session')
      .then(r => r.json())
      .then((d: SessionData) => setSession(d))
      .catch(() => {})
  }, [])

  const isAdmin = session.type === 'admin'
  const visibleNav = NAV.filter(item =>
    isAdmin || session.permissions?.includes(item.perm)
  )

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={cn(
        'flex flex-col bg-bg2 border-r border-border transition-all duration-300 z-40 shrink-0',
        open ? 'w-56' : 'w-16',
        'relative'
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-border min-h-[60px]">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-bg" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-text leading-tight whitespace-nowrap">Ledger Pro</div>
              <div className="text-[10px] text-subtext">v3.0</div>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="absolute -right-3 top-[70px] w-6 h-6 rounded-full bg-bg3 border border-border flex items-center justify-center text-subtext hover:text-accent hover:border-accent transition-colors z-50"
        >
          {open ? <ChevronRight size={12} /> : <ChevronRight size={12} className="rotate-180" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <a
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm transition-all duration-150 group',
                  active
                    ? 'bg-accent/15 text-accent font-semibold'
                    : 'text-subtext hover:text-text hover:bg-bg3'
                )}
                title={!open ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
                {open && <span className="whitespace-nowrap truncate">{label}</span>}
                {active && open && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
              </a>
            )
          })}

          {/* Admin-only section */}
          {isAdmin && (
            <>
              <div className="mx-2 my-2 border-t border-border" />
              {open && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-subtext/50 select-none">
                  Admin
                </p>
              )}
              {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <a
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm transition-all duration-150 group',
                      active
                        ? 'bg-accent/15 text-accent font-semibold'
                        : 'text-subtext hover:text-text hover:bg-bg3'
                    )}
                    title={!open ? label : undefined}
                  >
                    <Icon size={17} className="shrink-0" />
                    {open && <span className="whitespace-nowrap truncate">{label}</span>}
                    {active && open && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </a>
                )
              })}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-2">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-subtext hover:text-danger hover:bg-danger/10 transition-all"
            title={!open ? 'Logout' : undefined}
          >
            <LogOut size={17} className="shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg2">
          <button onClick={() => setOpen(o => !o)} className="text-subtext hover:text-accent">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-text text-sm">Ledger Pro</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
