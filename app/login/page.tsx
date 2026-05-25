'use client'
import { useState } from 'react'
import { Shield, User, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode]         = useState<'admin' | 'user'>('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!password) { setError('Please enter your password.'); return }
    if (mode === 'user' && !username) { setError('Please enter your username.'); return }

    setLoading(true)
    try {
      const body = mode === 'user'
        ? { password, mode: 'user', username }
        : { password }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Invalid credentials. Please try again.')
      }
    } catch {
      setError('Network error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#2E3350 1px, transparent 1px), linear-gradient(90deg, #2E3350 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
      {/* Glow */}
      <div className="fixed top-[-120px] right-[-120px] w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)' }} />

      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-3 border-b border-border bg-bg2/80">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-bg">
            <path d="M4 4h16v2H4zm0 5h16v2H4zm0 5h10v2H4zm0 5h7v2H4z"/>
          </svg>
        </div>
        <span className="text-sm font-bold text-text">RD&apos;s Ledger Pro</span>
        <span className="ml-auto text-xs text-subtext">Accounts &amp; Bill Register v3.0</span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm bg-bg2 border border-border rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          <div className="px-7 pt-7">
            <h1 className="text-2xl font-bold text-text">Welcome back</h1>
            <p className="text-sm text-subtext mt-1">Sign in to access your ledger</p>
          </div>

          {/* Tabs */}
          <div className="mx-7 mt-5 flex gap-1 p-1 rounded-lg bg-bg3">
            {(['admin', 'user'] as const).map(t => (
              <button key={t}
                onClick={() => { setMode(t); setError(''); setPassword('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                  mode === t ? 'bg-accent text-bg' : 'text-subtext hover:text-text'
                }`}>
                {t === 'admin' ? <Shield size={12} /> : <User size={12} />}
                {t === 'admin' ? 'Admin' : 'User'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="px-7 py-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-danger"
                style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)' }}>
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            {mode === 'user' && (
              <div>
                <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext pointer-events-none" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username" autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-text placeholder:text-subtext outline-none bg-bg3 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-subtext uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext pointer-events-none" />
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoFocus={mode === 'admin'}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm text-text placeholder:text-subtext outline-none bg-bg3 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext hover:text-accent transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-bg bg-accent hover:bg-accent2 disabled:opacity-50 transition-all">
              {loading
                ? <><span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />Signing in…</>
                : <><LogIn size={14} />Login</>}
            </button>

            <p className="text-center text-xs text-subtext">
              Default password: <span className="text-accent font-semibold">admin</span>
            </p>
          </form>
        </div>
      </main>

      <footer className="relative z-10 text-center py-3 text-xs text-border">
        Developed by Rabijnit Dey
      </footer>
    </div>
  )
}
