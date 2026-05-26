'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import Spinner from '@/components/Spinner'
import toast from 'react-hot-toast'
import { FolderOpen, Plus, Trash2, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Fund, Account } from '@/lib/types'

interface FundBalance {
  fund_name: string
  account: string
  totalCR: number
  totalDR: number
  net: number
  outstanding_bills: number
}

export default function FundsPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balances, setBalances] = useState<FundBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', account: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [fr, ar, br] = await Promise.all([
      fetch('/api/funds').then(r => r.json()),
      fetch('/api/accounts').then(r => r.json()),
      fetch('/api/funds/balances').then(r => r.json()).catch(() => []),
    ])
    setFunds(fr || [])
    setAccounts(ar || [])
    setBalances(br || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = funds.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.account.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.account) { toast.error('Name and account required'); return }
    setSaving(true)
    const res = await fetch('/api/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Fund created')
      setForm({ name: '', account: '', description: '' })
      setShowAdd(false)
      load()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this fund?')) return
    const res = await fetch('/api/funds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) { toast.success('Deleted'); load() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  const exportCSV = () => {
    const rows = [['ID', 'Fund Name', 'Account', 'Description', 'Created']]
    filtered.forEach(f => rows.push([String(f.id), f.name, f.account, f.description || '', f.created_at]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'funds.csv'; a.click()
  }

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="Fund Management"
          subtitle="Manage funds and view fund-wise balances"
          icon={<FolderOpen size={22} className="text-accent" />}
          actions={
            <div className="flex gap-2">
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                <Download size={15} /> Export
              </button>
              <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
                <Plus size={15} /> Add Fund
              </button>
            </div>
          }
        />

        {/* Add Fund Form */}
        {showAdd && (
          <div className="card mb-6">
            <h3 className="text-sm font-semibold text-accent mb-4">New Fund</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Fund Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Account *</label>
                <select className="input" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}>
                  <option value="">Select account…</option>
                  {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Fund'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4">
          <input className="input max-w-xs" placeholder="Search funds…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {/* Funds List */}
            <div className="card overflow-hidden p-0 mb-6">
              <div className="px-4 py-3 bg-bg3 border-b border-border">
                <span className="text-sm font-semibold text-accent">Registered Funds</span>
              </div>
              {filtered.length === 0 ? (
                <EmptyState icon={<FolderOpen size={40} />} title="No funds" message="Add a fund to get started" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg3/50">
                      <th className="text-left px-4 py-3 text-subtext font-medium">ID</th>
                      <th className="text-left px-4 py-3 text-subtext font-medium">Fund Name</th>
                      <th className="text-left px-4 py-3 text-subtext font-medium">Account</th>
                      <th className="text-left px-4 py-3 text-subtext font-medium">Description</th>
                      <th className="text-left px-4 py-3 text-subtext font-medium">Created</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f, i) => (
                      <tr key={f.id} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg' : 'bg-bg2/30'} hover:bg-bg3/50`}>
                        <td className="px-4 py-3 text-subtext">{f.id}</td>
                        <td className="px-4 py-3 font-medium text-accent">{f.name}</td>
                        <td className="px-4 py-3 text-text">{f.account}</td>
                        <td className="px-4 py-3 text-subtext">{f.description || '—'}</td>
                        <td className="px-4 py-3 text-subtext">{f.created_at ? new Date(f.created_at).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(f.id)} className="text-danger/50 hover:text-danger transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Fund Balance Summary */}
            {balances.length > 0 && (
              <div className="card overflow-hidden p-0">
                <div className="px-4 py-3 bg-bg3 border-b border-border">
                  <span className="text-sm font-semibold text-accent">Fund-wise Balance Summary</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg3/50">
                      <th className="text-left px-4 py-3 text-subtext font-medium">Fund Name</th>
                      <th className="text-left px-4 py-3 text-subtext font-medium">Account</th>
                      <th className="text-right px-4 py-3 text-subtext font-medium">Total CR</th>
                      <th className="text-right px-4 py-3 text-subtext font-medium">Total DR</th>
                      <th className="text-right px-4 py-3 text-subtext font-medium">Outstanding Bills</th>
                      <th className="text-right px-4 py-3 text-subtext font-medium">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((b, i) => (
                      <tr key={b.fund_name} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg' : 'bg-bg2/30'}`}>
                        <td className="px-4 py-3 font-medium text-accent">{b.fund_name}</td>
                        <td className="px-4 py-3 text-text">{b.account || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono text-success">{formatCurrency(b.totalCR)}</td>
                        <td className="px-4 py-3 text-right font-mono text-danger">{formatCurrency(b.totalDR)}</td>
                        <td className="px-4 py-3 text-right font-mono text-warning">{b.outstanding_bills > 0 ? formatCurrency(b.outstanding_bills) : '—'}</td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${b.net >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(Math.abs(b.net))} {b.net >= 0 ? 'CR' : 'DR'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
