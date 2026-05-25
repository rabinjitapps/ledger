import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET() {
  try {
    const { data: funds } = await db().from('funds').select('name, account').order('name')
    
    const balances = await Promise.all((funds || []).map(async (f: any) => {
      const { data: cr } = await db()
        .from('ledger')
        .select('amount')
        .eq('fund_name', f.name)
        .eq('type', 'CR')
      const { data: dr } = await db()
        .from('ledger')
        .select('amount')
        .eq('fund_name', f.name)
        .eq('type', 'DR')
      
      const totalCR = (cr || []).reduce((s: number, r: any) => s + r.amount, 0)
      const totalDR = (dr || []).reduce((s: number, r: any) => s + r.amount, 0)
      
      return {
        fund_name: f.name,
        account: f.account,
        totalCR,
        totalDR,
        net: totalCR - totalDR,
      }
    }))

    return NextResponse.json(balances)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
