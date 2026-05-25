'use client'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingPage } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, today } from '@/lib/utils'
import { CashbookEntry } from '@/types'
import { Plus, Trash2, Wallet, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CashbookPage() {
  const [entries, setEntries] = useState<CashbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ type: 'All', from: '', to: '', fund: '' })
  const [vendors, setVendors] = useState<string[]>([])
  const [accounts, setAccounts] = useState<string[]>([])
  const [funds, setFunds] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filter.type !== 'All') p.set('type', filter.type)
    if (filter.from) p.set('from', filter.from)
    if (filter.to) p.set('to', filter.to)
    if (filter.fund) p.set('fund', filter.fund)
    const res = await fetch(`/api/cashbook?${p}`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/vendors').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && setVendors(d.map((v: any) => v.name))).catch(() => {})
    fetch('/api/accounts').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && setAccounts(d.map((a: any) => a.name))).catch(() => {})
    fetch('/api/funds').then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && setFunds(d.map((f: any) => f.name))).catch(() => {})
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return
    const res = await fetch('/api/cashbook', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { toast.success('Entry deleted'); load() }
  }

  const totalReceipts = entries.filter(e => e.type === 'RECEIPT').reduce((s, e) => s + e.amount, 0)
  const totalPayments = entries.filter(e => e.type === 'PAYMENT').reduce((s, e) => s + e.amount, 0)

  return (
    <AppLayout>
      <PageHeader
        title="Cashbook"
        subtitle="Receipt and payment register"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> New Entry
          </button>
        }
      />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card flex flex-wrap gap-3 items-end">
          <div><label className="label">Type</label>
            <select className="select w-28" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
              {['All','RECEIPT','PAYMENT'].map(t => <option key={t}>{t}</option>)}
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
          <button onClick={load} className="btn-primary h-9">Filter</button>
          <button onClick={() => setFilter({ type: 'All', from: '', to: '', fund: '' })} className="btn-secondary h-9">Reset</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center"><p className="text-subtext text-xs mb-1">Total Receipts</p><p className="text-success text-xl font-bold">{formatCurrency(totalReceipts)}</p></div>
          <div className="card text-center"><p className="text-subtext text-xs mb-1">Total Payments</p><p className="text-danger text-xl font-bold">{formatCurrency(totalPayments)}</p></div>
          <div className="card text-center"><p className="text-subtext text-xs mb-1">Net</p><p className={`text-xl font-bold ${totalReceipts - totalPayments >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(totalReceipts - totalPayments)}</p></div>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? <LoadingPage /> : entries.length === 0 ? (
            <EmptyState icon={<Wallet size={48} />} title="No cashbook entries" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Date','Type','Amount','Payer / From','Payee / To','Description','Ref','Fund'].map(h => <th key={h} className="table-th">{h}</th>)}
                  <th className="table-th text-right">Action</th>
                </tr></thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} className={`table-row ${i % 2 === 0 ? 'bg-row-odd' : 'bg-row-even'}`}>
                      <td className="table-td whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="table-td"><span className={e.type === 'RECEIPT' ? 'badge-paid' : 'badge-unpaid'}>{e.type}</span></td>
                      <td className={`table-td text-right font-mono font-semibold ${e.type === 'RECEIPT' ? 'text-success' : 'text-danger'}`}>{formatCurrency(e.amount)}</td>
                      <td className="table-td text-subtext">{e.payer || '—'}</td>
                      <td className="table-td text-subtext">{e.payee || '—'}</td>
                      <td className="table-td max-w-xs truncate">{e.description}</td>
                      <td className="table-td text-subtext">{e.ref}</td>
                      <td className="table-td text-subtext">{e.fund_name}</td>
                      <td className="table-td text-right">
                        <button onClick={() => handleDelete(e.id)} className="text-subtext hover:text-danger transition-colors"><Trash2 size={14} /></button>
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
        <CashbookModal
          vendors={vendors} accounts={accounts} funds={funds}
          onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </AppLayout>
  )
}

function CashbookModal({ vendors, accounts, funds, onClose, onSaved }: any) {
  const [form, setForm] = useState({ date: today(), type: 'RECEIPT', amount: '', payer: '', payee: '', description: '', ref: '', fund_name: '' })
  const [loading, setLoading] = useState(false)
  const combined = [...new Set([...vendors, ...accounts])].sort()

  const isReceipt = form.type === 'RECEIPT'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/cashbook', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
          <h2 className="text-lg font-bold text-text">New Cashbook Entry</h2>
          <button onClick={onClose}><X size={20} className="text-subtext" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
            <div><label className="label">Type *</label>
              <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="RECEIPT">RECEIPT</option>
                <option value="PAYMENT">PAYMENT</option>
              </select>
            </div>
          </div>
          <div><label className="label">Amount (Rs.) *</label><input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required /></div>
          
          <div>
            <label className="label">{isReceipt ? 'Payer (From — who pays you)' : 'Payer / Source Account'}</label>
            <input className="input" list="payer-list" value={form.payer} onChange={e => setForm(f => ({ ...f, payer: e.target.value }))} />
            <datalist id="payer-list">{combined.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="label">{isReceipt ? 'Receiver (To — your account)' : 'Payee (To — who receives)'}</label>
            <input className="input" list="payee-list" value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} />
            <datalist id="payee-list">{combined.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Reference</label><input className="input" value={form.ref} onChange={e => setForm(f => ({ ...f, ref: e.target.value }))} /></div>
            <div><label className="label">Fund</label>
              <input className="input" list="fund-list" value={form.fund_name} onChange={e => setForm(f => ({ ...f, fund_name: e.target.value }))} />
              <datalist id="fund-list">{funds.map((f: string) => <option key={f} value={f} />)}</datalist>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save Entry'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
