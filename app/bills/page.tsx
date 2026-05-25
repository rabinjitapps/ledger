'use client'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingPage } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, today } from '@/lib/utils'
import { Bill, BillItem, BillDeduction } from '@/types'
import { Plus, FileText, CreditCard, Trash2, Edit, ChevronDown, ChevronUp, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [payBill, setPayBill] = useState<Bill | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [vendors, setVendors] = useState<string[]>([])
  const [accounts, setAccounts] = useState<string[]>([])
  const [funds, setFunds] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/bills?status=${statusFilter}`)
    if (res.ok) setBills(await res.json())
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/vendors').then(r => r.json()).then(d => setVendors(d.map((v: any) => v.name)))
    fetch('/api/accounts').then(r => r.json()).then(d => setAccounts(d.map((a: any) => a.name)))
    fetch('/api/funds').then(r => r.json()).then(d => setFunds(d.map((f: any) => f.name)))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this bill and all its items?')) return
    const res = await fetch('/api/bills', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { toast.success('Bill deleted'); load() }
    else toast.error('Failed to delete')
  }

  const statusCounts = { All: bills.length, UNPAID: 0, PARTIAL: 0, PAID: 0 }
  bills.forEach(b => { if (b.status in statusCounts) (statusCounts as any)[b.status]++ })
  
  const totalOutstanding = bills.filter(b => b.status !== 'PAID').reduce((s, b) => s + (b.total - b.paid_amount), 0)

  return (
    <AppLayout>
      <PageHeader
        title="Bills"
        subtitle="Vendor bill register with partial payment tracking"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> New Bill
          </button>
        }
      />
      <div className="p-6 space-y-4">
        {/* Summary + filters */}
        <div className="flex flex-wrap gap-4 items-start">
          <div className="card flex-1">
            <p className="text-subtext text-xs mb-1">Outstanding Amount</p>
            <p className="text-danger text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['All','UNPAID','PARTIAL','PAID'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${statusFilter === s
                  ? s === 'UNPAID' ? 'bg-danger/20 text-danger border-danger/30'
                  : s === 'PARTIAL' ? 'bg-accent/20 text-accent border-accent/30'
                  : s === 'PAID' ? 'bg-success/20 text-success border-success/30'
                  : 'bg-accent/20 text-accent border-accent/30'
                  : 'bg-bg3 text-subtext border-border hover:border-accent/30'}`}>
                {s} {(statusCounts as any)[s] !== undefined ? `(${(statusCounts as any)[s]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Bills table */}
        <div className="card p-0 overflow-hidden">
          {loading ? <LoadingPage /> : bills.length === 0 ? (
            <EmptyState icon={<FileText size={48} />} title="No bills" description="Create your first bill" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['ID','Date','Bill No','Party','Total','Paid','Due','Status','Due Date','Account'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b, i) => (
                    <>
                      <tr key={b.id} className={`table-row cursor-pointer ${i % 2 === 0 ? 'bg-row-odd' : 'bg-row-even'}`} onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                        <td className="table-td text-subtext">{b.id}</td>
                        <td className="table-td whitespace-nowrap">{formatDate(b.date)}</td>
                        <td className="table-td font-medium text-accent">{b.bill_no}</td>
                        <td className="table-td font-medium">{b.party}</td>
                        <td className="table-td text-right font-mono">{formatCurrency(b.total)}</td>
                        <td className="table-td text-right font-mono text-success">{formatCurrency(b.paid_amount)}</td>
                        <td className="table-td text-right font-mono text-danger">{formatCurrency(b.total - b.paid_amount)}</td>
                        <td className="table-td"><span className={`badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                        <td className="table-td whitespace-nowrap text-subtext">{b.due_date ? formatDate(b.due_date) : '—'}</td>
                        <td className="table-td text-subtext">{b.account}</td>
                        <td className="table-td text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {b.status !== 'PAID' && (
                              <button onClick={() => setPayBill(b)} className="btn-success text-xs py-1 px-2">
                                <CreditCard size={13} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(b.id)} className="text-subtext hover:text-danger transition-colors">
                              <Trash2 size={14} />
                            </button>
                            <button className="text-subtext hover:text-accent">
                              {expandedId === b.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === b.id && (
                        <tr key={`exp-${b.id}`}>
                          <td colSpan={12} className="bg-bg3/50 px-6 py-4">
                            <BillDetails billId={b.id} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddBillModal
          vendors={vendors} accounts={accounts} funds={funds}
          onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }}
        />
      )}
      {payBill && (
        <PaymentModal bill={payBill} accounts={accounts}
          onClose={() => setPayBill(null)} onSaved={() => { setPayBill(null); load() }}
        />
      )}
    </AppLayout>
  )
}

function BillDetails({ billId }: { billId: number }) {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch(`/api/bills?id=${billId}`).then(r => r.json()).then(setData)
  }, [billId])
  if (!data) return <div className="text-subtext text-sm">Loading…</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div>
        <p className="text-subtext text-xs uppercase tracking-wider mb-2">Line Items</p>
        {(data.items || []).map((item: any) => (
          <div key={item.id} className="flex justify-between py-1 border-b border-border/30">
            <span className="text-text">{item.description} ({item.qty} × {formatCurrency(item.rate)})</span>
            <span className="text-text font-medium">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-subtext text-xs uppercase tracking-wider mb-2">Deductions</p>
        {(data.deductions || []).length === 0 ? <p className="text-subtext">None</p> : (data.deductions || []).map((d: any) => (
          <div key={d.id} className="flex justify-between py-1 border-b border-border/30">
            <span className="text-text">{d.ded_type}</span>
            <span className="text-danger">−{formatCurrency(d.ded_amount)}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-subtext text-xs uppercase tracking-wider mb-2">Payment History</p>
        {(data.payments || []).length === 0 ? <p className="text-subtext">No payments yet</p> : (data.payments || []).map((p: any) => (
          <div key={p.id} className="flex justify-between py-1 border-b border-border/30">
            <span className="text-subtext">{formatDate(p.date)} {p.notes && `· ${p.notes}`}</span>
            <span className="text-success">{formatCurrency(p.amount)}</span>
          </div>
        ))}
        {data.notes && <p className="text-subtext mt-2 text-xs">Notes: {data.notes}</p>}
      </div>
    </div>
  )
}

function AddBillModal({ vendors, accounts, funds, onClose, onSaved }: any) {
  const [form, setForm] = useState({ date: today(), bill_no: '', party: '', account: '', fund_name: '', due_date: '', notes: '' })
  const [items, setItems] = useState<BillItem[]>([])
  const [deductions, setDeductions] = useState<BillDeduction[]>([])
  const [newItem, setNewItem] = useState({ description: '', qty: '1', rate: '' })
  const [newDed, setNewDed] = useState({ ded_type: 'SGST', ded_amount: '' })
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    const qty = parseFloat(newItem.qty) || 1
    const rate = parseFloat(newItem.rate) || 0
    if (!newItem.description || !rate) { toast.error('Enter description and rate'); return }
    setItems(prev => [...prev, { description: newItem.description, qty, rate, amount: qty * rate }])
    setNewItem({ description: '', qty: '1', rate: '' })
  }

  const addDed = () => {
    const amt = parseFloat(newDed.ded_amount) || 0
    if (!amt) { toast.error('Enter deduction amount'); return }
    setDeductions(prev => [...prev, { ded_type: newDed.ded_type, ded_amount: amt }])
    setNewDed(d => ({ ...d, ded_amount: '' }))
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const totalDed = deductions.reduce((s, d) => s + d.ded_amount, 0)
  const total = subtotal - totalDed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.party || !form.bill_no) { toast.error('Party and Bill No are required'); return }
    if (!items.length) { toast.error('Add at least one item'); return }
    setLoading(true)
    const res = await fetch('/api/bills', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items, deductions }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Bill created'); onSaved() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text">New Bill</h2>
          <button onClick={onClose}><X size={20} className="text-subtext hover:text-text" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
            <div><label className="label">Bill No *</label><input className="input" value={form.bill_no} onChange={e => setForm(f => ({ ...f, bill_no: e.target.value }))} required /></div>
          </div>
          <div><label className="label">Party (Vendor) *</label>
            <input className="input" list="vendor-list" value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))} required />
            <datalist id="vendor-list">{vendors.map((v: string) => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Account</label>
              <input className="input" list="acct-list" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} />
              <datalist id="acct-list">{accounts.map((a: string) => <option key={a} value={a} />)}</datalist>
            </div>
            <div><label className="label">Fund</label>
              <input className="input" list="fund-list" value={form.fund_name} onChange={e => setForm(f => ({ ...f, fund_name: e.target.value }))} />
              <datalist id="fund-list">{funds.map((f: string) => <option key={f} value={f} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Due Date</label><input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>

          {/* Line items */}
          <div className="border-t border-border pt-3">
            <p className="text-accent text-sm font-semibold mb-2">Line Items</p>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-border/30 text-sm">
                <span className="flex-1">{item.description}</span>
                <span className="text-subtext">{item.qty} × {formatCurrency(item.rate)}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
                <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-danger"><X size={14} /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input className="input flex-1" placeholder="Description" value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} />
              <input className="input w-16" type="number" placeholder="Qty" value={newItem.qty} onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))} />
              <input className="input w-24" type="number" placeholder="Rate" value={newItem.rate} onChange={e => setNewItem(n => ({ ...n, rate: e.target.value }))} />
              <button type="button" onClick={addItem} className="btn-info whitespace-nowrap">+ Add</button>
            </div>
          </div>

          {/* Deductions */}
          <div className="border-t border-border pt-3">
            <p className="text-accent text-sm font-semibold mb-2">Deductions (SGST/CGST/IGST/TDS)</p>
            {deductions.map((d, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-border/30 text-sm">
                <span className="flex-1 text-subtext">{d.ded_type}</span>
                <span className="text-danger">−{formatCurrency(d.ded_amount)}</span>
                <button type="button" onClick={() => setDeductions(prev => prev.filter((_, j) => j !== i))} className="text-danger"><X size={14} /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <select className="select w-28" value={newDed.ded_type} onChange={e => setNewDed(n => ({ ...n, ded_type: e.target.value }))}>
                {['SGST','CGST','IGST','TDS'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input className="input flex-1" type="number" placeholder="Amount" value={newDed.ded_amount} onChange={e => setNewDed(n => ({ ...n, ded_amount: e.target.value }))} />
              <button type="button" onClick={addDed} className="btn-info whitespace-nowrap">+ Add</button>
            </div>
          </div>

          <div className="bg-bg3 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between text-subtext"><span>Sub-Total</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-danger"><span>Total Deductions</span><span>−{formatCurrency(totalDed)}</span></div>
            <div className="flex justify-between text-text font-bold pt-1 border-t border-border"><span>Total</span><span className="text-accent">{formatCurrency(total)}</span></div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Create Bill'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PaymentModal({ bill, accounts, onClose, onSaved }: any) {
  const [form, setForm] = useState({ date: today(), amount: '', notes: '', from_account: bill.account || '', is_adjusted: false })
  const [loading, setLoading] = useState(false)
  const remaining = bill.total - bill.paid_amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.is_adjusted && (!amount || amount > remaining + 0.01)) { toast.error(`Amount must be > 0 and ≤ ${formatCurrency(remaining)}`); return }
    setLoading(true)
    const res = await fetch('/api/bills/payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bill_id: bill.id, ...form, amount: form.is_adjusted ? remaining : amount }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Payment recorded'); onSaved() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">Record Payment</h2>
          <button onClick={onClose}><X size={20} className="text-subtext" /></button>
        </div>
        <div className="bg-bg3 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-subtext">Bill #{bill.bill_no}</span><span className="text-text">{bill.party}</span></div>
          <div className="flex justify-between"><span className="text-subtext">Total</span><span>{formatCurrency(bill.total)}</span></div>
          <div className="flex justify-between"><span className="text-subtext">Paid</span><span className="text-success">{formatCurrency(bill.paid_amount)}</span></div>
          <div className="flex justify-between font-bold border-t border-border pt-1"><span>Remaining</span><span className="text-danger">{formatCurrency(remaining)}</span></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label">Payment Date *</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
          <div><label className="label">Amount (Rs.) *</label>
            <input className="input" type="number" step="0.01" min="0.01" max={remaining + 0.01} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} disabled={form.is_adjusted} required={!form.is_adjusted} />
          </div>
          <div><label className="label">From Account</label>
            <input className="input" list="pay-acct" value={form.from_account} onChange={e => setForm(f => ({ ...f, from_account: e.target.value }))} />
            <datalist id="pay-acct">{accounts.map((a: string) => <option key={a} value={a} />)}</datalist>
          </div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-subtext hover:text-text">
            <input type="checkbox" checked={form.is_adjusted} onChange={e => setForm(f => ({ ...f, is_adjusted: e.target.checked }))} />
            Mark as adjusted/corrected (ignore amount, mark PAID)
          </label>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Record Payment'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
