// Client-side session reader — parses the cookie to get current user info

export interface SessionInfo {
  type: 'admin' | 'user'
  id?: string
  username?: string
  permissions?: string[]
}

export function getSessionInfo(): SessionInfo | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/ledger_session=([^;]+)/)
  if (!match) return null
  const val = decodeURIComponent(match[1])
  if (val === 'authenticated') return { type: 'admin' }
  try {
    return JSON.parse(val) as SessionInfo
  } catch {
    return null
  }
}

export function isAdmin(): boolean {
  const s = getSessionInfo()
  return s?.type === 'admin'
}

export function hasPermission(perm: string): boolean {
  const s = getSessionInfo()
  if (!s) return false
  if (s.type === 'admin') return true
  return s.permissions?.includes(perm) ?? false
}
