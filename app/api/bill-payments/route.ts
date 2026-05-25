import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bill_id, date, amount, notes, from_account, is_adjusted } = body
  
  if (!bill_id || !date || !amount)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  
  const { data: bill } = await db().from('bills').select('*').eq('id', bill_id).single()
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
  if (bill.status === 'PAID') return NextResponse.json({ error: 'Bill already paid' }, { status: 400 })
  
  const newPaid = is_adjusted ? bill.total : Math.round((bill.paid_amount + amount) * 100) / 100
  const newStatus = newPaid >= bill.total - 0.01 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID'
  
  // Update bill
  await db().from('bills').update({ paid_amount: newPaid, status: newStatus }).eq('id', bill_id)
  
  // Record payment
  await db().from('bill_payments').insert({
    bill_id, date, amount, notes, created_at: new Date().toISOString()
  })
  
  // Auto cashbook entry
  await db().from('cashbook').insert({
    date,
    type: 'PAYMENT',
    amount,
    payer: from_account || bill.account,
    payee: bill.party,
    description: notes || `Bill #${bill.bill_no} payment — ${bill.party}`,
    ref: bill.bill_no,
    fund_name: bill.fund_name,
    created_at: new Date().toISOString()
  })
  
  return NextResponse.json({ success: true, new_status: newStatus, new_paid: newPaid })
}
