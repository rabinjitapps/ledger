'use client'
import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import PageHeader from '@/components/PageHeader'
import Spinner from '@/components/Spinner'
import { BarChart3, FileText, BookOpen, Wallet, Building2, FolderOpen, Scale, AlertCircle, Download } from 'lucide-react'
import { formatCurrency, today } from '@/lib/utils'

type ReportType = 'ledger' | 'bills' | 'cashbook' | 'accounts' | 'funds' | 'pending-bills' | null

function ReportCard({ icon, title, description, color, onClick }: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <div className={`card cursor-pointer hover:scale-[1.02] transition-transform border ${color}`} onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-bg3">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold text-text mb-1">{title}</div>
          <div className="text-subtext text-sm">{description}</div>
        </div>
        <div className="text-accent text-sm font-medium">Run →</div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>(null)
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Record<string, any>>({})

  const runReport = async (type: ReportType) => {
    if (!type) return
    setActiveReport(type)
    setLoading(true)
    setData([])
    setSummary({})

    let url = ''
    if (type === 'ledger') url = `/api/ledger?from=${from}&to=${to}`
    else if (type === 'bills') url = `/api/bills?from=${from}&to=${to}`
    else if (type === 'cashbook') url = `/api/cashbook?from=${from}&to=${to}`
    else if (type === 'accounts') url = `/api/accounts`
    else if (type === 'funds') url = `/api/funds`
    else if (type === 'pending-bills') url = `/api/bills?status=UNPAID&status2=PARTIAL`

    const res = await fetch(url)
    let d = await res.json()
    if (!Array.isArray(d)) d = []

    setData(d)

    // Compute summary
    if (type === 'ledger') {
      const cr = d.filter((r: any) => r.type === 'CR').reduce((s: number, r: any) => s + r.amount, 0)
      const dr = d.filter((r: any) => r.type === 'DR').reduce((s: number, r: any) => s + r.amount, 0)
      setSummary({ entries: d.length, totalCR: cr, totalDR: dr })
    } else if (type === 'bills' || type === 'pending-bills') {
      const total = d.reduce((s: number, r: any) => s + r.total, 0)
      const paid = d.reduce((s: number, r: any) => s + r.paid_amount, 0)
      setSummary({ bills: d.length, total, paid, pending: total - paid })
    } else if (type === 'cashbook') {
      const rec = d.filter((r: any) => r.type === 'RECEIPT').reduce((s: number, r: any) => s + r.amount, 0)
      const pay = d.filter((r: any) => r.type === 'PAYMENT').reduce((s: number, r: any) => s + r.amount, 0)
      setSummary({ entries: d.length, receipts: rec, payments: pay, net: rec - pay })
    } else if (type === 'accounts') {
      const cr = d.filter((r: any) => r.balance > 0).reduce((s: number, r: any) => s + r.balance, 0)
      const dr = d.filter((r: any) => r.balance < 0).reduce((s: number, r: any) => s + Math.abs(r.balance), 0)
      setSummary({ accounts: d.length, totalCR: cr, totalDR: dr })
    }

    setLoading(false)
  }

  const exportCSV = () => {
    if (!data.length) return
    const keys = Object.keys(data[0])
    const rows = [keys, ...data.map((r: any) => keys.map(k => r[k] ?? ''))]
    const csv = rows.map(r => r.map((v: any) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${activeReport}-report.csv`; a.click()
  }

  const reports = [
    {
      type: 'ledger' as ReportType, icon: <BookOpen size={20} className="text-accent" />,
      title: 'Date-Range Ledger Report', description: 'Filter and export ledger entries between two dates',
      color: 'border-accent/20 hover:border-accent/50'
    },
    {
      type: 'bills' as ReportType, icon: <FileText size={20} className="text-blue-400" />,
      title: 'Date-Wise Bill Report', description: 'Filter and export bills between two dates',
      color: 'border-blue-400/20 hover:border-blue-400/50'
    },
    {
      type: 'pending-bills' as ReportType, icon: <AlertCircle size={20} className="text-danger" />,
      title: 'Pending Bills Summary', description: 'All unpaid and partial bills with outstanding amounts',
      color: 'border-danger/20 hover:border-danger/50'
    },
    {
      type: 'cashbook' as ReportType, icon: <Wallet size={20} className="text-success" />,
      title: 'Cashbook Report', description: 'Date-wise cash receipts and payments',
      color: 'border-success/20 hover:border-success/50'
    },
    {
      type: 'accounts' as ReportType, icon: <Building2 size={20} className="text-purple-400" />,
      title: 'Accounts Summary Export', description: 'All account balances and positions',
      color: 'border-purple-400/20 hover:border-purple-400/50'
    },
    {
      type: 'funds' as ReportType, icon: <FolderOpen size={20} className="text-yellow-400" />,
      title: 'Fund List Export', description: 'All registered funds and their accounts',
      color: 'border-yellow-400/20 hover:border-yellow-400/50'
    },
  ]

  const needsDateRange = ['ledger', 'bills', 'cashbook']

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="Reports"
          subtitle="Generate and export financial reports"
          icon={<BarChart3 size={22} className="text-accent" />}
        />

        {/* Date range filter (shared) */}
        <div className="card mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="label mb-0 whitespace-nowrap">From Date:</label>
            <input type="date" className="input w-40" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="label mb-0 whitespace-nowrap">To Date:</label>
            <input type="date" className="input w-40" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="text-subtext text-sm">(used for Ledger, Bills & Cashbook reports)</div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {reports.map(r => (
            <ReportCard
              key={r.type}
              icon={r.icon}
              title={r.title}
              description={r.description}
              color={r.color}
              onClick={() => runReport(r.type)}
            />
          ))}
        </div>

        {/* Results */}
        {activeReport && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-accent font-semibold text-lg">
                {reports.find(r => r.type === activeReport)?.title} Results
              </h2>
              {data.length > 0 && (
                <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                  <Download size={15} /> Export CSV
                </button>
              )}
            </div>

            {/* Summary */}
            {Object.keys(summary).length > 0 && (
              <div className="flex flex-wrap gap-4 mb-4">
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k} className="card py-2 px-4 min-w-[120px]">
                    <div className="text-subtext text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-text font-bold mt-0.5">
                      {typeof v === 'number' && k !== 'entries' && k !== 'bills' && k !== 'accounts' && k !== 'funds'
                        ? formatCurrency(v) : v}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : data.length === 0 ? (
              <div className="card text-center text-subtext py-8">No data found for the selected criteria.</div>
            ) : (
              <div className="card overflow-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg3">
                      {Object.keys(data[0]).map(k => (
                        <th key={k} className="text-left px-3 py-2 text-subtext font-medium whitespace-nowrap capitalize">
                          {k.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 200).map((row: any, i: number) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg' : 'bg-bg2/30'} hover:bg-bg3/50`}>
                        {Object.values(row).map((v: any, j: number) => (
                          <td key={j} className="px-3 py-2 text-text whitespace-nowrap">
                            {v === null || v === undefined ? '—' : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 200 && (
                  <div className="px-4 py-2 bg-bg3 text-subtext text-xs border-t border-border">
                    Showing first 200 of {data.length} rows. Export CSV for full data.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
