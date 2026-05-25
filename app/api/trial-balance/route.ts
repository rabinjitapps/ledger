import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET() {
  try {
    const { data: accounts } = await db().from('accounts').select('name, balance').order('name')
    
    const rows = (accounts || []).map((a: any) => ({
      account: a.name,
      totalCR: a.balance > 0 ? a.balance : 0,
      totalDR: a.balance < 0 ? Math.abs(a.balance) : 0,
      netBalance: a.balance,
    }))

    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
