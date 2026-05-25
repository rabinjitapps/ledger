'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import Spinner from '@/components/Spinner'
import toast from 'react-hot-toast'
import { Building2, TrendingUp, TrendingDown, Plus, Trash2, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/lib/types'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/accounts')
    const data = await res.json()
    setAccounts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalCR = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalDR = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Account created')
      setNewName('')
      setShowAdd(false)
      load()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed')
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete account "${name}"? This cannot be undone.`)) return
    const res = await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (res.ok) { toast.success('Deleted'); load() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  const exportCSV = () => {
    const rows = [['Account', 'Balance', 'Position', 'Created']]
    filtered.forEach(a => {
      const pos = a.balance > 0 ? 'CR' : a.balance < 0 ? 'DR' : 'NIL'
      rows.push([a.name, Math.abs(a.balance).toFixed(2), pos, a.created_at])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'accounts.csv'; a.click()
  }

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="Accounts Summary"
          subtitle="All account balances and positions"
          icon={<Building2 size={22} className="text-accent" />}
          actions={
            <div className="flex gap-2">
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                <Download size={15} /> Export
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
                <Plus size={15} /> Add Account
              </button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-subtext text-sm">Total Accounts</div>
            <div className="text-2xl font-bold text-text mt-1">{accounts.length}</div>
          </div>
          <div className="card">
            <div className="text-subtext text-sm">Total CR Balance</div>
            <div className="text-2xl font-bold text-success mt-1">{formatCurrency(totalCR)}</div>
          </div>
          <div className="card">
            <div className="text-subtext text-sm">Total DR Balance</div>
            <div className="text-2xl font-bold text-danger mt-1">{formatCurrency(totalDR)}</div>
          </div>
          <div className="card">
            <div className="text-subtext text-sm">Net</div>
            <div className={`text-2xl font-bold mt-1 ${totalCR - totalDR >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(totalCR - totalDR)}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            className="input max-w-xs"
            placeholder="Search accounts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Add Account Form */}
        {showAdd && (
          <div className="card mb-4 max-w-sm">
            <h3 className="text-sm font-semibold text-accent mb-3">New Account</h3>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Account name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Add'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={40} />} title="No accounts" message="Add your first account to get started" />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg3">
                  <th className="text-left px-4 py-3 text-subtext font-medium">Account</th>
                  <th className="text-right px-4 py-3 text-subtext font-medium">Balance (Rs.)</th>
                  <th className="text-center px-4 py-3 text-subtext font-medium">Position</th>
                  <th className="text-left px-4 py-3 text-subtext font-medium">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const pos = a.balance > 0 ? 'CR' : a.balance < 0 ? 'DR' : 'NIL'
                  return (
                    <tr key={a.name} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg' : 'bg-bg2/30'} hover:bg-bg3/50 transition-colors`}>
                      <td className="px-4 py-3 font-medium text-text">{a.name}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${a.balance > 0 ? 'text-success' : a.balance < 0 ? 'text-danger' : 'text-subtext'}`}>
                        {formatCurrency(Math.abs(a.balance))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                          pos === 'CR' ? 'bg-success/10 text-success' : pos === 'DR' ? 'bg-danger/10 text-danger' : 'bg-bg3 text-subtext'
                        }`}>
                          {pos === 'CR' ? <TrendingUp size={11} /> : pos === 'DR' ? <TrendingDown size={11} /> : null}
                          {pos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-subtext">{a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(a.name)} className="text-danger/50 hover:text-danger transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-bg3 border-t border-border flex gap-6 text-sm">
              <span className="text-subtext">Total: <span className="text-text font-semibold">{filtered.length}</span></span>
              <span className="text-success">CR: <span className="font-semibold">{formatCurrency(totalCR)}</span></span>
              <span className="text-danger">DR: <span className="font-semibold">{formatCurrency(totalDR)}</span></span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
