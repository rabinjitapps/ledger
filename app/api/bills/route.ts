import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

// Helper: insert a ledger entry for a bill
async function insertBillLedgerEntry(bill: any) {
  // Bill raised = Debit (DR) — money owed/expense incurred
  const account = bill.account || bill.party
  await db().from('ledger').insert({
    date: bill.date,
    account,
    type: 'DR',
    amount: bill.total,
    signed: -Math.abs(bill.total),
    narration: `Bill #${bill.bill_no} — ${bill.party}`,
    ref: bill.bill_no,
    fund_name: bill.fund_name || null,
    created_at: new Date().toISOString(),
    bill_id: bill.id,
  })
}

// Helper: update account balance for bill creation (DR = reduces balance / liability)
async function deductAccountBalance(accountName: string, amount: number) {
  const { data: acct } = await db().from('accounts').select('balance').eq('name', accountName).single()
  if (acct) {
    const newBalance = Math.round((acct.balance - amount) * 100) / 100
    await db().from('accounts').update({ balance: newBalance }).eq('name', accountName)
  }
}

// Helper: restore account balance when bill is deleted
async function restoreAccountBalance(accountName: string, amount: number) {
  const { data: acct } = await db().from('accounts').select('balance').eq('name', accountName).single()
  if (acct) {
    const newBalance = Math.round((acct.balance + amount) * 100) / 100
    await db().from('accounts').update({ balance: newBalance }).eq('name', accountName)
  }
}

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
  const { date, bill_no, party, items, deductions = [], due_date, notes, account, fund_name, invoice_no, invoice_date, invoice_value, vendor_pan } = body

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
    .insert({ date, bill_no, party, total, paid_amount: 0, due_date: due_date || null, status: 'UNPAID', notes, account, fund_name: fund_name || null, invoice_no: invoice_no || null, invoice_date: invoice_date || null, invoice_value: invoice_value || null, vendor_pan: vendor_pan || null, created_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items.length) {
    await db().from('bill_items').insert(items.map((i: any) => ({ ...i, bill_id: bill.id })))
  }
  if (deductions.length) {
    await db().from('bill_deductions').insert(deductions.map((d: any) => ({ ...d, bill_id: bill.id })))
  }

  // ── INTERCONNECTED EFFECTS ────────────────────────────────────
  // 1. Write DR ledger entry (bill raised = liability/expense incurred)
  try {
    await insertBillLedgerEntry(bill)
  } catch (_) {
    // ledger table may not have bill_id column yet — try without it
    const accountCol = bill.account || bill.party
    await db().from('ledger').insert({
      date: bill.date,
      account: accountCol,
      type: 'DR',
      amount: bill.total,
      signed: -Math.abs(bill.total),
      narration: `Bill #${bill.bill_no} — ${bill.party}`,
      ref: bill.bill_no,
      fund_name: bill.fund_name || null,
      created_at: new Date().toISOString(),
    })
  }

  // 2. Reduce account balance (bill committed against account)
  const accountForBalance = account || null
  if (accountForBalance) {
    await deductAccountBalance(accountForBalance, total)
  }

  return NextResponse.json(bill)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, items, deductions = [], ...fields } = body

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

  // Fetch bill before deletion to reverse effects
  const { data: bill } = await db().from('bills').select('*').eq('id', id).single()

  const { error } = await db().from('bills').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (bill) {
    // 1. Remove ledger DR entries created for this bill (match by ref = bill_no + type DR)
    await db().from('ledger')
      .delete()
      .eq('ref', bill.bill_no)
      .eq('type', 'DR')
      .eq('account', bill.account || bill.party)

    // 2. Restore account balance (reverse the DR we applied on creation)
    const accountForBalance = bill.account || null
    if (accountForBalance) {
      // Only restore the portion not yet paid (paid portion was already reversed via bill-payments)
      const unpaidAmount = Math.round((bill.total - bill.paid_amount) * 100) / 100
      await restoreAccountBalance(accountForBalance, unpaidAmount)
    }
  }

  return NextResponse.json({ success: true })
}
