import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const id = url.searchParams.get('id')
  
  if (id) {
    const { data: bill } = await db().from('bills').select('*').eq('id', id).single()
    const { data: items } = await db().from('bill_items').select('*').eq('bill_id', id)
    const { data: deductions } = await db().from('bill_deductions').select('*').eq('bill_id', id)
    const { data: payments } = await db().from('bill_payments').select('*').eq('bill_id', id).order('date')
    return NextResponse.json({ ...bill, items, deductions, payments })
  }
  
  let q = db().from('bills').select('*').order('date', { ascending: false })
  if (status && status !== 'All') q = q.eq('status', status)
  
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, bill_no, party, items, deductions = [], due_date, notes, account, fund_name } = body
  
  if (!date || !bill_no || !party || !items?.length)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  
  const subtotal = items.reduce((s: number, i: any) => s + i.amount, 0)
  const totalDed = deductions.reduce((s: number, d: any) => s + d.ded_amount, 0)
  const total = Math.round((subtotal - totalDed) * 100) / 100
  
  // Auto-create vendor/account if not exists
  await db().from('vendors').upsert({ name: party, created_at: new Date().toISOString() }, { onConflict: 'name', ignoreDuplicates: true })
  if (account) await db().from('accounts').upsert({ name: account, balance: 0, created_at: new Date().toISOString() }, { onConflict: 'name', ignoreDuplicates: true })
  
  const { data: bill, error } = await db()
    .from('bills')
    .insert({ date, bill_no, party, total, paid_amount: 0, due_date: due_date || null, status: 'UNPAID', notes, account, fund_name: fund_name || null, created_at: new Date().toISOString() })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  if (items.length) {
    await db().from('bill_items').insert(items.map((i: any) => ({ ...i, bill_id: bill.id })))
  }
  if (deductions.length) {
    await db().from('bill_deductions').insert(deductions.map((d: any) => ({ ...d, bill_id: bill.id })))
  }
  
  return NextResponse.json(bill)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, items, deductions = [], ...fields } = body
  
  // Recalculate total
  if (items) {
    const subtotal = items.reduce((s: number, i: any) => s + i.amount, 0)
    const totalDed = deductions.reduce((s: number, d: any) => s + d.ded_amount, 0)
    fields.total = Math.round((subtotal - totalDed) * 100) / 100
    
    await db().from('bill_items').delete().eq('bill_id', id)
    await db().from('bill_items').insert(items.map((i: any) => ({ ...i, bill_id: id })))
    await db().from('bill_deductions').delete().eq('bill_id', id)
    if (deductions.length)
      await db().from('bill_deductions').insert(deductions.map((d: any) => ({ ...d, bill_id: id })))
  }
  
  const { data, error } = await db().from('bills').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await db().from('bills').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
