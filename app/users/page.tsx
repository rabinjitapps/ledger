'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { ALL_PERMISSIONS, PERMISSION_LABELS } from '@/lib/users'
import type { Permission } from '@/lib/users'

import toast from 'react-hot-toast'
import {
  Users, Plus, Trash2, Edit2, ShieldCheck, ShieldOff,
  KeyRound, Check, X, Eye, EyeOff, ToggleLeft, ToggleRight, UserX, UserCheck
} from 'lucide-react'

interface SafeUser {
  id: string
  username: string
  permissions: Permission[]
  isAdmin: boolean
  createdAt: string
  active: boolean
}

const PERM_GROUPS = [
  { label: 'Finance', perms: ['dashboard', 'ledger', 'trial-balance', 'reports'] as Permission[] },
  { label: 'Operations', perms: ['bills', 'vendors', 'cashbook'] as Permission[] },
  { label: 'Configuration', perms: ['accounts', 'funds'] as Permission[] },
]

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<SafeUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Check admin access via API (cookie is httpOnly, unreadable by JS)
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { if (d.type !== 'admin') router.push('/dashboard') })
      .catch(() => router.push('/dashboard'))
  }, [router])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    else toast.error('Failed to load users')
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (user: SafeUser) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    if (res.ok) { toast.success(user.active ? 'User deactivated' : 'User activated'); load() }
    else toast.error('Failed to update user')
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('User deleted'); setDeleteConfirm(null); load() }
    else toast.error('Failed to delete user')
  }

  return (
    <AppLayout>
      <div className="px-6 py-5 border-b border-border bg-bg2/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Users size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">User Management</h1>
            <p className="text-subtext text-sm">Create users and control access permissions</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New User
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg3 border border-border flex items-center justify-center mb-4">
              <Users size={28} className="text-subtext/40" />
            </div>
            <p className="text-text font-medium mb-1">No users yet</p>
            <p className="text-subtext text-sm mb-4">Create your first user account with custom permissions.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Create First User
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.id}
                className={`card transition-all ${!user.active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      user.active ? 'bg-info/10 border border-info/30' : 'bg-bg3 border border-border'
                    }`}>
                      <span className={`text-sm font-bold ${user.active ? 'text-info' : 'text-subtext'}`}>
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text">{user.username}</span>
                        {!user.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-danger/20 text-danger border border-danger/30">
                            Inactive
                          </span>
                        )}
                        {user.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-subtext text-xs mt-0.5">
                        Created {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{user.permissions.length} permission{user.permissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(user)}
                      className={`p-2 rounded-lg border transition-all ${
                        user.active
                          ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
                          : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                      }`}
                      title={user.active ? 'Deactivate user' : 'Activate user'}
                    >
                      {user.active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button
                      onClick={() => setEditUser(user)}
                      className="p-2 rounded-lg border border-border bg-bg3 text-subtext hover:text-accent hover:border-accent/40 transition-all"
                      title="Edit permissions"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="p-2 rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                      title="Delete user"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Permission pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ALL_PERMISSIONS.map(perm => {
                    const has = user.permissions.includes(perm)
                    return (
                      <span
                        key={perm}
                        className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          has
                            ? 'bg-accent/15 text-accent border-accent/30'
                            : 'bg-bg3 text-subtext/40 border-border/50'
                        }`}
                      >
                        {has ? <Check size={10} /> : <X size={10} />}
                        {PERMISSION_LABELS[perm]}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); load() }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center">
                <Trash2 size={18} className="text-danger" />
              </div>
              <h2 className="text-lg font-bold text-text">Delete User</h2>
            </div>
            <p className="text-subtext text-sm mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function CreateUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>(['dashboard'])
  const [loading, setLoading] = useState(false)

  const togglePerm = (p: Permission) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }
  const toggleGroup = (perms: Permission[]) => {
    const allOn = perms.every(p => permissions.includes(p))
    if (allOn) setPermissions(prev => prev.filter(p => !perms.includes(p)))
    else setPermissions(prev => [...new Set([...prev, ...perms])])
  }
  const toggleAll = () => {
    if (permissions.length === ALL_PERMISSIONS.length) setPermissions(['dashboard'])
    else setPermissions([...ALL_PERMISSIONS])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) { toast.error('Username is required'); return }
    if (password.length < 4) { toast.error('Password must be at least 4 characters'); return }
    if (!permissions.length) { toast.error('At least one permission required'); return }
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, permissions }),
    })
    setLoading(false)
    if (res.ok) { toast.success('User created!'); onSaved() }
    else { const d = await res.json(); toast.error(d.error || 'Failed to create user') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Plus size={18} className="text-accent" />
          </div>
          <h2 className="text-lg font-bold text-text">Create New User</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. john_doe"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-9"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 4 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext hover:text-text">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Permissions</label>
              <button type="button" onClick={toggleAll}
                className="text-xs text-accent hover:underline">
                {permissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="bg-bg3 rounded-xl border border-border p-3 space-y-3">
              {PERM_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.perms)}
                      className="text-xs font-semibold text-subtext hover:text-accent transition-colors"
                    >
                      {group.label}
                    </button>
                    {group.perms.every(p => permissions.includes(p)) && (
                      <span className="text-xs text-accent">✓ All</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.perms.map(perm => {
                      const on = permissions.includes(perm)
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePerm(perm)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            on ? 'bg-accent text-bg border-accent font-medium' : 'bg-bg2 text-subtext border-border hover:border-accent/50 hover:text-text'
                          }`}
                        >
                          {on ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                          {PERMISSION_LABELS[perm]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-subtext text-xs mt-1">{permissions.length} of {ALL_PERMISSIONS.length} permissions selected</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" /> : <Plus size={15} />}
              {loading ? 'Creating…' : 'Create User'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({ user, onClose, onSaved }: { user: SafeUser; onClose: () => void; onSaved: () => void }) {
  const [permissions, setPermissions] = useState<Permission[]>(user.permissions)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const togglePerm = (p: Permission) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }
  const toggleGroup = (perms: Permission[]) => {
    const allOn = perms.every(p => permissions.includes(p))
    if (allOn) setPermissions(prev => prev.filter(p => !perms.includes(p)))
    else setPermissions(prev => [...new Set([...prev, ...perms])])
  }
  const toggleAll = () => {
    if (permissions.length === ALL_PERMISSIONS.length) setPermissions(['dashboard'])
    else setPermissions([...ALL_PERMISSIONS])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!permissions.length) { toast.error('At least one permission required'); return }
    if (password && password.length < 4) { toast.error('Password must be at least 4 characters'); return }
    setLoading(true)
    const body: any = { permissions }
    if (password) body.password = password
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (res.ok) { toast.success('User updated!'); onSaved() }
    else { const d = await res.json(); toast.error(d.error || 'Failed to update user') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-info/10 border border-info/30 flex items-center justify-center">
            <Edit2 size={18} className="text-info" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Edit User</h2>
            <p className="text-subtext text-sm">{user.username}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Reset Password <span className="text-subtext/60 normal-case font-normal">(leave blank to keep current)</span></label>
            <div className="relative">
              <input
                className="input pr-9"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (optional)"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext hover:text-text">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Permissions</label>
              <button type="button" onClick={toggleAll}
                className="text-xs text-accent hover:underline">
                {permissions.length === ALL_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="bg-bg3 rounded-xl border border-border p-3 space-y-3">
              {PERM_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => toggleGroup(group.perms)}
                      className="text-xs font-semibold text-subtext hover:text-accent transition-colors">
                      {group.label}
                    </button>
                    {group.perms.every(p => permissions.includes(p)) && (
                      <span className="text-xs text-accent">✓ All</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.perms.map(perm => {
                      const on = permissions.includes(perm)
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePerm(perm)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            on ? 'bg-accent text-bg border-accent font-medium' : 'bg-bg2 text-subtext border-border hover:border-accent/50 hover:text-text'
                          }`}
                        >
                          {on ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                          {PERMISSION_LABELS[perm]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-subtext text-xs mt-1">{permissions.length} of {ALL_PERMISSIONS.length} permissions selected</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" /> : <Check size={15} />}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
