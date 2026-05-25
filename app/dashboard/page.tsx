'use client'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { LoadingPage } from '@/components/ui/Spinner'
import { formatCurrency, today } from '@/lib/utils'
import { DashboardStats } from '@/types'
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  AlertCircle, RefreshCw, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<{name:string}[]>([])
  const [filter, setFilter] = useState({ from: '', to: '', account: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.from) params.set('from', filter.from)
    if (filter.to) params.set('to', filter.to)
    if (filter.account) params.set('account', filter.account)
    const res = await fetch(`/api/dashboard?${params}`)
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/accounts').then(r => r.json()).then(setAccounts)
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-bg3 border border-border rounded-lg p-3 text-xs">
        <p className="text-subtext mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your accounts and transactions"
        actions={
          <button onClick={load} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="card flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">From Date</label>
            <input className="input w-36" type="date" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input className="input w-36" type="date" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} />
          </div>
          <div>
            <label className="label">Account</label>
            <select className="select w-40" value={filter.account} onChange={e => setFilter(f => ({ ...f, account: e.target.value }))}>
              <option value="">All Accounts</option>
              {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          <button onClick={load} className="btn-primary flex items-center gap-1.5 h-9">
            <Filter size={14} /> Filter
          </button>
          <button onClick={() => setFilter({ from: '', to: '', account: '' })} className="btn-secondary h-9">Reset</button>
        </div>

        {loading ? <LoadingPage /> : stats ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Credits"
                value={formatCurrency(stats.totalCR)}
                icon={<TrendingUp size={20} />}
                color="text-success"
                sub="All CR entries"
              />
              <StatCard
                title="Total Debits"
                value={formatCurrency(stats.totalDR)}
                icon={<TrendingDown size={20} />}
                color="text-danger"
                sub="All DR entries"
              />
              <StatCard
                title="Net Balance"
                value={formatCurrency(stats.netBalance)}
                icon={<DollarSign size={20} />}
                color={stats.netBalance >= 0 ? 'text-success' : 'text-danger'}
                sub="CR − DR"
              />
              <StatCard
                title="Bill Outstanding"
                value={formatCurrency(stats.unpaidBillAmount)}
                icon={<FileText size={20} />}
                color="text-accent"
                sub={`${stats.totalBills} bills total`}
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Cash Receipts"
                value={formatCurrency(stats.totalCashReceipts)}
                color="text-info"
                sub="Total received"
              />
              <StatCard
                title="Cash Payments"
                value={formatCurrency(stats.totalCashPayments)}
                color="text-purple"
                sub="Total paid"
              />
              <StatCard
                title="Bills Paid"
                value={formatCurrency(stats.paidBillAmount)}
                color="text-success"
                sub="Amount settled"
              />
              <StatCard
                title="Overdue Bills"
                value={String(stats.overdueBills.length)}
                color={stats.overdueBills.length > 0 ? 'text-danger' : 'text-success'}
                sub="Past due date"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly flow chart */}
              <div className="card lg:col-span-2">
                <h3 className="text-sm font-semibold text-text mb-4">Monthly Cash Flow (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthlyFlow} barCategoryGap="30%">
                    <XAxis dataKey="month" tick={{ fill: '#9099B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9099B0', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9099B0' }} />
                    <Bar dataKey="cr" name="Credits" fill="#2ECC71" radius={[4,4,0,0]} />
                    <Bar dataKey="dr" name="Debits" fill="#E74C3C" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Account balances */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text mb-4">Account Balances</h3>
                <div className="space-y-2">
                  {stats.accountBalances.length === 0 && (
                    <p className="text-subtext text-sm text-center py-4">No accounts yet</p>
                  )}
                  {stats.accountBalances.map(a => (
                    <div key={a.name} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="text-text text-sm truncate">{a.name}</span>
                      <span className={`text-sm font-semibold ${a.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(a.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent ledger */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text mb-4">Recent Ledger Entries</h3>
                <div className="space-y-1">
                  {stats.recentLedger.length === 0 && <p className="text-subtext text-sm text-center py-4">No entries</p>}
                  {stats.recentLedger.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center ${e.type === 'CR' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                          {e.type === 'CR' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-text text-xs font-medium truncate">{e.narration}</p>
                          <p className="text-subtext text-xs">{e.account} · {e.date}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${e.type === 'CR' ? 'text-success' : 'text-danger'}`}>
                        {e.type === 'CR' ? '+' : '-'}{formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overdue bills */}
              <div className="card">
                <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-danger" />
                  Overdue Bills
                </h3>
                <div className="space-y-1">
                  {stats.overdueBills.length === 0 && (
                    <p className="text-success text-sm text-center py-4">✓ No overdue bills</p>
                  )}
                  {stats.overdueBills.map(b => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-text text-xs font-medium">{b.party}</p>
                        <p className="text-subtext text-xs">#{b.bill_no} · Due {b.due_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-danger text-sm font-semibold">{formatCurrency(b.total - b.paid_amount)}</p>
                        <span className={`badge-${b.status.toLowerCase()}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-12 text-danger">Failed to load dashboard</div>
        )}
      </div>
    </AppLayout>
  )
}
