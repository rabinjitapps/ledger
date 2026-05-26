import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET() {
  try {
    const { data: funds } = await db().from('funds').select('name, account').order('name')

    const balances = await Promise.all((funds || []).map(async (f: any) => {
      // Sum all ledger CR entries tagged to this fund
      const { data: cr } = await db()
        .from('ledger')
        .select('amount')
        .eq('fund_name', f.name)
        .eq('type', 'CR')

      // Sum all ledger DR entries tagged to this fund (includes bill DR entries now)
      const { data: dr } = await db()
        .from('ledger')
        .select('amount')
        .eq('fund_name', f.name)
        .eq('type', 'DR')

      const totalCR = (cr || []).reduce((s: number, r: any) => s + r.amount, 0)
      const totalDR = (dr || []).reduce((s: number, r: any) => s + r.amount, 0)

      // Also count unpaid/partial bill totals tagged to this fund
      // (bills that haven't yet generated a payment CR in ledger)
      const { data: unpaidBills } = await db()
        .from('bills')
        .select('total, paid_amount')
        .eq('fund_name', f.name)
        .neq('status', 'PAID')

      const outstandingBillAmount = (unpaidBills || []).reduce(
        (s: number, b: any) => s + (b.total - b.paid_amount),
        0
      )

      return {
        fund_name: f.name,
        account: f.account,
        totalCR: Math.round(totalCR * 100) / 100,
        totalDR: Math.round(totalDR * 100) / 100,
        net: Math.round((totalCR - totalDR) * 100) / 100,
        outstanding_bills: Math.round(outstandingBillAmount * 100) / 100,
      }
    }))

    return NextResponse.json(balances)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
