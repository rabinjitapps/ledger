import crypto from 'crypto'
import { createServiceClient } from './supabase'

const ITERATIONS = 100000
const KEY_LEN    = 32
const DIGEST     = 'sha256'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Permission =
  | 'dashboard'
  | 'ledger'
  | 'bills'
  | 'cashbook'
  | 'accounts'
  | 'funds'
  | 'vendors'
  | 'trial-balance'
  | 'reports'

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard',
  'ledger',
  'bills',
  'cashbook',
  'accounts',
  'funds',
  'vendors',
  'trial-balance',
  'reports',
]

export const PERMISSION_LABELS: Record<Permission, string> = {
  'dashboard':     'Dashboard',
  'ledger':        'Ledger Book',
  'bills':         'Bills',
  'cashbook':      'Cashbook',
  'accounts':      'Accounts',
  'funds':         'Funds',
  'vendors':       'Vendors',
  'trial-balance': 'Trial Balance',
  'reports':       'Reports',
}

export interface AppUser {
  id:           string
  username:     string
  passwordHash: string
  passwordSalt: string
  permissions:  Permission[]
  isAdmin:      false
  createdAt:    string
  active:       boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, key) => {
      if (err) reject(err)
      else resolve(key.toString('hex'))
    })
  })
}

async function loadUsers(): Promise<AppUser[]> {
  const db = createServiceClient()
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'users_list')
    .maybeSingle()

  if (!data?.value) return []
  try { return JSON.parse(data.value) } catch { return [] }
}

async function saveUsers(users: AppUser[]): Promise<void> {
  const db = createServiceClient()
  await db.from('app_settings').upsert(
    { key: 'users_list', value: JSON.stringify(users), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  return loadUsers()
}

export async function verifyUserPassword(
  username: string,
  password: string
): Promise<AppUser | null> {
  const users = await loadUsers()
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.active
  )
  if (!user) return null

  const hash = await hashPassword(password, user.passwordSalt)
  return hash === user.passwordHash ? user : null
}

export async function createUser(
  username: string,
  password: string,
  permissions: Permission[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const users = await loadUsers()

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, error: 'Username already exists' }
  }

  const salt = crypto.randomUUID()
  const hash = await hashPassword(password, salt)

  const newUser: AppUser = {
    id:           crypto.randomUUID(),
    username:     username.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    permissions,
    isAdmin:      false,
    createdAt:    new Date().toISOString(),
    active:       true,
  }

  await saveUsers([...users, newUser])
  return { ok: true }
}

export async function updateUser(
  id: string,
  updates: {
    permissions?: Permission[]
    active?: boolean
    password?: string
    username?: string
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const users = await loadUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return { ok: false, error: 'User not found' }

  const user = { ...users[idx] }

  if (updates.permissions) user.permissions = updates.permissions
  if (updates.active !== undefined) user.active = updates.active
  if (updates.username) {
    const conflict = users.some(
      (u, i) => i !== idx && u.username.toLowerCase() === updates.username!.toLowerCase()
    )
    if (conflict) return { ok: false, error: 'Username already taken' }
    user.username = updates.username.trim()
  }
  if (updates.password) {
    const salt = crypto.randomUUID()
    user.passwordSalt = salt
    user.passwordHash = await hashPassword(updates.password, salt)
  }

  users[idx] = user
  await saveUsers(users)
  return { ok: true }
}

export async function deleteUser(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const users = await loadUsers()
  const filtered = users.filter(u => u.id !== id)
  if (filtered.length === users.length) return { ok: false, error: 'User not found' }
  await saveUsers(filtered)
  return { ok: true }
}
