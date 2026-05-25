'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import PageHeader from '@/components/PageHeader'
import Spinner from '@/components/Spinner'
import { Scale, CheckCircle, XCircle, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { TrialBalanceRow } from '@/lib/types'

export default function TrialBalancePage() {
  const [rows, setRows] = useState<TrialBalanceRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/trial-balance')
    const data = await res.json()
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalDR = rows.reduce((s, r) => s + (r.netBalance < 0 ? Math.abs(r.netBalance) : 0), 0)
  const totalCR = rows.reduce((s, r) => s + (r.netBalance > 0 ? r.netBalance : 0), 0)
  const balanced = Math.abs(totalDR - totalCR) < 0.01

  const exportCSV = () => {
    const data = [['Account', 'Debit (Rs.)', 'Credit (Rs.)']]
    rows.forEach(r => {
      const dr = r.netBalance < 0 ? Math.abs(r.netBalance).toFixed(2) : ''
      const cr = r.netBalance > 0 ? r.netBalance.toFixed(2) : ''
      data.push([r.account, dr, cr])
    })
    data.push(['', '', ''])
    data.push(['TOTAL', totalDR.toFixed(2), totalCR.toFixed(2)])
    const csv = data.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'trial-balance.csv'; a.click()
  }

  return (
    <AppLayout>
      <div className="p-6">
        <PageHeader
          title="Trial Balance"
          subtitle="Double-entry verification across all accounts"
          icon={<Scale size={22} className="text-accent" />}
          actions={
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
              <Download size={15} /> Export CSV
            </button>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {/* Balance Status */}
            <div className={`card mb-6 flex items-center gap-4 border ${balanced ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
              {balanced ? (
                <CheckCircle size={28} className="text-success shrink-0" />
              ) : (
                <XCircle size={28} className="text-danger shrink-0" />
              )}
              <div>
                <div className={`font-bold text-lg ${balanced ? 'text-success' : 'text-danger'}`}>
                  {balanced ? '✓ Trial Balance is BALANCED' : '✗ Trial Balance is UNBALANCED'}
                </div>
                <div className="text-subtext text-sm mt-0.5">
                  Total Debit: {formatCurrency(totalDR)} | Total Credit: {formatCurrency(totalCR)}
                  {!balanced && ` | Difference: ${formatCurrency(Math.abs(totalDR - totalCR))}`}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card text-center">
                <div className="text-subtext text-sm">Total Debit</div>
                <div className="text-2xl font-bold text-danger mt-1">{formatCurrency(totalDR)}</div>
              </div>
              <div className="card text-center">
                <div className="text-subtext text-sm">Total Credit</div>
                <div className="text-2xl font-bold text-success mt-1">{formatCurrency(totalCR)}</div>
              </div>
              <div className="card text-center">
                <div className="text-subtext text-sm">Difference</div>
                <div className={`text-2xl font-bold mt-1 ${balanced ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(Math.abs(totalDR - totalCR))}
                </div>
              </div>
            </div>

            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg3">
                    <th className="text-left px-4 py-3 text-subtext font-medium">Account</th>
                    <th className="text-right px-4 py-3 text-subtext font-medium">Debit (Rs.)</th>
                    <th className="text-right px-4 py-3 text-subtext font-medium">Credit (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const dr = r.netBalance < 0 ? Math.abs(r.netBalance) : 0
                    const cr = r.netBalance > 0 ? r.netBalance : 0
                    return (
                      <tr key={r.account} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg' : 'bg-bg2/30'} hover:bg-bg3/50`}>
                        <td className="px-4 py-3 font-medium text-text">{r.account}</td>
                        <td className={`px-4 py-3 text-right font-mono ${dr > 0 ? 'text-danger' : 'text-subtext'}`}>
                          {dr > 0 ? formatCurrency(dr) : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${cr > 0 ? 'text-success' : 'text-subtext'}`}>
                          {cr > 0 ? formatCurrency(cr) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-bg3 border-t-2 border-border font-bold">
                    <td className="px-4 py-3 text-accent">TOTAL</td>
                    <td className="px-4 py-3 text-right font-mono text-danger">{formatCurrency(totalDR)}</td>
                    <td className="px-4 py-3 text-right font-mono text-success">{formatCurrency(totalCR)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
