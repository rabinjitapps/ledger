import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET() {
  try {
    // Compute trial balance by aggregating actual ledger entries per account
    // This includes manual entries AND bill-generated DR/CR entries
    const { data: entries, error } = await db()
      .from('ledger')
      .select('account, type, amount')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Aggregate CR and DR per account
    const accountMap: Record<string, { totalCR: number; totalDR: number }> = {}

    for (const entry of (entries || [])) {
      if (!accountMap[entry.account]) {
        accountMap[entry.account] = { totalCR: 0, totalDR: 0 }
      }
      if (entry.type === 'CR') {
        accountMap[entry.account].totalCR += entry.amount
      } else if (entry.type === 'DR') {
        accountMap[entry.account].totalDR += entry.amount
      }
    }

    // Also include accounts with zero ledger entries (from accounts table)
    const { data: accounts } = await db().from('accounts').select('name').order('name')
    for (const a of (accounts || [])) {
      if (!accountMap[a.name]) {
        accountMap[a.name] = { totalCR: 0, totalDR: 0 }
      }
    }

    const rows = Object.entries(accountMap)
      .map(([account, { totalCR, totalDR }]) => ({
        account,
        totalCR: Math.round(totalCR * 100) / 100,
        totalDR: Math.round(totalDR * 100) / 100,
        netBalance: Math.round((totalCR - totalDR) * 100) / 100,
      }))
      .sort((a, b) => a.account.localeCompare(b.account))

    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
