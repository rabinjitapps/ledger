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

  // Interconnected effect: update account balances based on cashbook entry
  // RECEIPT: money comes IN → credit the receiver account (payee)
  // PAYMENT: money goes OUT → debit the payer account
  if (type === 'RECEIPT' && payee) {
    const { data: acct } = await db().from('accounts').select('balance').eq('name', payee).single()
    if (acct) {
      await db().from('accounts').update({ balance: Math.round((acct.balance + amount) * 100) / 100 }).eq('name', payee)
    }
  } else if (type === 'PAYMENT' && payer) {
    const { data: acct } = await db().from('accounts').select('balance').eq('name', payer).single()
    if (acct) {
      await db().from('accounts').update({ balance: Math.round((acct.balance - amount) * 100) / 100 }).eq('name', payer)
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  // Fetch entry before deleting to reverse account balance
  const { data: entry } = await db().from('cashbook').select('*').eq('id', id).single()

  const { error } = await db().from('cashbook').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reverse the account balance effect on delete
  if (entry) {
    if (entry.type === 'RECEIPT' && entry.payee) {
      const { data: acct } = await db().from('accounts').select('balance').eq('name', entry.payee).single()
      if (acct) {
        await db().from('accounts').update({ balance: Math.round((acct.balance - entry.amount) * 100) / 100 }).eq('name', entry.payee)
      }
    } else if (entry.type === 'PAYMENT' && entry.payer) {
      const { data: acct } = await db().from('accounts').select('balance').eq('name', entry.payer).single()
      if (acct) {
        await db().from('accounts').update({ balance: Math.round((acct.balance + entry.amount) * 100) / 100 }).eq('name', entry.payer)
      }
    }
  }

  return NextResponse.json({ success: true })
}
