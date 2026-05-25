'use client'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingPage } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, today } from '@/lib/utils'
import { LedgerEntry } from '@/types'
import { Plus, Trash2, Filter, BookOpen, Download, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<string[]>([])
  const [funds, setFunds] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ account: '', from: '', to: '', type: 'All', fund: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filter.account) p.set('account', filter.account)
    if (filter.from) p.set('from', filter.from)
    if (filter.to) p.set('to', filter.to)
    if (filter.type !== 'All') p.set('type', filter.type)
    if (filter.fund) p.set('fund', filter.fund)
    const res = await fetch(`/api/ledger?${p}`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(d => setAccounts(d.map((a: any) => a.name)))
    fetch('/api/funds').then(r => r.json()).then(d => setFunds(d.map((f: any) => f.name)))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return
    const res = await fetch('/api/ledger', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { toast.success('Entry deleted'); load() }
    else toast.error('Failed to delete')
  }

  const totalCR = entries.filter(e => e.type === 'CR').reduce((s, e) => s + e.amount, 0)
  const totalDR = entries.filter(e => e.type === 'DR').reduce((s, e) => s + e.amount, 0)

  return (
    <AppLayout>
      <PageHeader
        title="Ledger"
        subtitle="Account-wise transaction entries"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Entry
          </button>
        }
      />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card flex flex-wrap gap-3 items-end">
          <div><label className="label">Account</label>
            <select className="select w-36" value={filter.account} onChange={e => setFilter(f => ({ ...f, account: e.target.value }))}>
              <option value="">All</option>
              {accounts.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div><label className="label">Type</label>
            <select className="select w-24" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
              {['All','CR','DR'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Fund</label>
            <select className="select w-36" value={filter.fund} onChange={e => setFilter(f => ({ ...f, fund: e.target.value }))}>
              <option value="">All</option>
              {funds.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label className="label">From</label><input className="input w-36" type="date" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} /></div>
          <div><label className="label">To</label><input className="input w-36" type="date" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} /></div>
          <button onClick={load} className="btn-primary h-9 flex items-center gap-1.5"><Filter size={14} />Filter</button>
          <button onClick={() => setFilter({ account: '', from: '', to: '', type: 'All', fund: '' })} className="btn-secondary h-9">Reset</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-subtext text-xs mb-1">Total Credits</p>
            <p className="text-success text-xl font-bold">{formatCurrency(totalCR)}</p>
          </div>
          <div className="card text-center">
            <p className="text-subtext text-xs mb-1">Total Debits</p>
            <p className="text-danger text-xl font-bold">{formatCurrency(totalDR)}</p>
          </div>
          <div className="card text-center">
            <p className="text-subtext text-xs mb-1">Net</p>
            <p className={`text-xl font-bold ${totalCR - totalDR >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(totalCR - totalDR)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? <LoadingPage /> : entries.length === 0 ? (
            <EmptyState icon={<BookOpen size={48} />} title="No ledger entries" description="Add your first entry to get started" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Date','Account','Type','Amount','Signed','Narration','Reference','Fund'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                    <th className="table-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} className={`table-row ${i % 2 === 0 ? 'bg-row-odd' : 'bg-row-even'}`}>
                      <td className="table-td whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="table-td font-medium">{e.account}</td>
                      <td className="table-td">
                        <span className={e.type === 'CR' ? 'badge-paid' : 'badge-unpaid'}>{e.type}</span>
                      </td>
                      <td className="table-td text-right font-mono">{formatCurrency(e.amount)}</td>
                      <td className={`table-td text-right font-mono ${e.signed >= 0 ? 'cr-text' : 'dr-text'}`}>
                        {e.signed >= 0 ? '+' : ''}{formatCurrency(Math.abs(e.signed))}
                      </td>
                      <td className="table-td max-w-xs truncate">{e.narration}</td>
                      <td className="table-td text-subtext">{e.ref}</td>
                      <td className="table-td text-subtext">{e.fund_name}</td>
                      <td className="table-td text-right">
                        <button onClick={() => handleDelete(e.id)} className="text-subtext hover:text-danger transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddLedgerModal
          accounts={accounts}
          funds={funds}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </AppLayout>
  )
}

function AddLedgerModal({ accounts, funds, onClose, onSaved }: any) {
  const [form, setForm] = useState({ date: today(), account: '', type: 'CR', amount: '', narration: '', ref: '', fund_name: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.account || !form.narration) { toast.error('Fill all required fields'); return }
    setLoading(true)
    const res = await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Entry added'); onSaved() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text">New Ledger Entry</h2>
          <button onClick={onClose} className="text-subtext hover:text-text"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
            <div><label className="label">Type *</label>
              <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="CR">CR — Credit</option>
                <option value="DR">DR — Debit</option>
              </select>
            </div>
          </div>
          <div><label className="label">Account *</label>
            <input className="input" list="acct-list" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} required />
            <datalist id="acct-list">{accounts.map((a: string) => <option key={a} value={a} />)}</datalist>
          </div>
          <div><label className="label">Amount (Rs.) *</label><input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required /></div>
          <div><label className="label">Narration *</label><input className="input" value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))} placeholder="Description of this entry" required /></div>
          <div><label className="label">Reference</label><input className="input" value={form.ref} onChange={e => setForm(f => ({ ...f, ref: e.target.value }))} /></div>
          <div><label className="label">Fund Name</label>
            <input className="input" list="fund-list" value={form.fund_name} onChange={e => setForm(f => ({ ...f, fund_name: e.target.value }))} />
            <datalist id="fund-list">{funds.map((f: string) => <option key={f} value={f} />)}</datalist>
          </div>
          <p className="text-subtext text-xs">CR = Credit (income/receipt) · DR = Debit (expense/payment)</p>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Entry'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
