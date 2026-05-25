import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const account = url.searchParams.get('account')
  
  try {
    // Ledger stats
    let lq = db().from('ledger').select('type, amount, signed, account, date, narration, fund_name, ref, id, created_at')
    if (from) lq = lq.gte('date', from)
    if (to) lq = lq.lte('date', to)
    if (account) lq = lq.eq('account', account)
    const { data: ledger } = await lq.order('date', { ascending: false })
    
    const totalCR = (ledger || []).filter((r: any) => r.type === 'CR').reduce((s: number, r: any) => s + r.amount, 0)
    const totalDR = (ledger || []).filter((r: any) => r.type === 'DR').reduce((s: number, r: any) => s + r.amount, 0)
    const netBalance = totalCR - totalDR
    
    // Bills stats
    const { data: bills } = await db().from('bills').select('total, paid_amount, status, due_date, id, bill_no, party, date')
    const totalBillAmount = (bills || []).reduce((s: number, b: any) => s + b.total, 0)
    const paidBillAmount = (bills || []).reduce((s: number, b: any) => s + b.paid_amount, 0)
    const today = new Date().toISOString().split('T')[0]
    const overdueBills = (bills || []).filter((b: any) => b.status !== 'PAID' && b.due_date && b.due_date < today)
    
    // Cashbook stats
    let cq = db().from('cashbook').select('type, amount, date')
    if (from) cq = cq.gte('date', from)
    if (to) cq = cq.lte('date', to)
    const { data: cashbook } = await cq
    const totalCashReceipts = (cashbook || []).filter((r: any) => r.type === 'RECEIPT').reduce((s: number, r: any) => s + r.amount, 0)
    const totalCashPayments = (cashbook || []).filter((r: any) => r.type === 'PAYMENT').reduce((s: number, r: any) => s + r.amount, 0)
    
    // Account balances
    const { data: accounts } = await db().from('accounts').select('name, balance').order('name')
    
    // Monthly flow (last 6 months)
    const monthlyFlow: Record<string, { cr: number; dr: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      monthlyFlow[key] = { cr: 0, dr: 0 }
    }
    ;(ledger || []).forEach((r: any) => {
      const d = new Date(r.date)
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      if (monthlyFlow[key]) {
        if (r.type === 'CR') monthlyFlow[key].cr += r.amount
        else monthlyFlow[key].dr += r.amount
      }
    })
    
    return NextResponse.json({
      totalCR, totalDR, netBalance,
      totalBills: (bills || []).length,
      totalBillAmount,
      paidBillAmount,
      unpaidBillAmount: totalBillAmount - paidBillAmount,
      totalCashReceipts,
      totalCashPayments,
      accountBalances: accounts || [],
      recentLedger: (ledger || []).slice(0, 10),
      overdueBills: overdueBills.slice(0, 5),
      monthlyFlow: Object.entries(monthlyFlow).map(([month, v]) => ({ month, ...v })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
