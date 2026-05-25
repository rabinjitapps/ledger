import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'ledger'
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  try {
    if (type === 'ledger') {
      let q = db().from('ledger').select('*').order('date', { ascending: false })
      if (from) q = q.gte('date', from)
      if (to) q = q.lte('date', to)
      const { data } = await q
      return NextResponse.json(data || [])
    }

    if (type === 'bills') {
      let q = db().from('bills').select('*').order('date', { ascending: false })
      if (from) q = q.gte('date', from)
      if (to) q = q.lte('date', to)
      const { data } = await q
      return NextResponse.json(data || [])
    }

    if (type === 'cashbook') {
      let q = db().from('cashbook').select('*').order('date', { ascending: false })
      if (from) q = q.gte('date', from)
      if (to) q = q.lte('date', to)
      const { data } = await q
      return NextResponse.json(data || [])
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
