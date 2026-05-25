import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const fund = url.searchParams.get('fund')
  
  let q = db().from('cashbook').select('*').order('date', { ascending: false }).order('id', { ascending: false })
  if (type && type !== 'All') q = q.eq('type', type)
  if (from) q = q.gte('date', from)
  if (to) q = q.lte('date', to)
  if (fund) q = q.eq('fund_name', fund)
  
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, type, amount, payer, payee, description, ref, fund_name } = body
  
  if (!date || !type || !amount)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  
  const { data, error } = await db()
    .from('cashbook')
    .insert({ date, type, amount, payer, payee, description, ref, fund_name, created_at: new Date().toISOString() })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await db().from('cashbook').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
