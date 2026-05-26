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

  const paymentAmount = is_adjusted ? bill.total - bill.paid_amount : Math.round(amount * 100) / 100
  const newPaid = is_adjusted ? bill.total : Math.round((bill.paid_amount + paymentAmount) * 100) / 100
  const newStatus = newPaid >= bill.total - 0.01 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID'

  // 1. Update bill paid amount + status
  await db().from('bills').update({ paid_amount: newPaid, status: newStatus }).eq('id', bill_id)

  // 2. Record payment in bill_payments
  await db().from('bill_payments').insert({
    bill_id, date, amount: paymentAmount, notes, created_at: new Date().toISOString()
  })

  // 3. Auto cashbook PAYMENT entry (so cashbook reflects the outflow)
  const accountUsed = from_account || bill.account
  await db().from('cashbook').insert({
    date,
    type: 'PAYMENT',
    amount: paymentAmount,
    payer: accountUsed,
    payee: bill.party,
    description: notes || `Bill #${bill.bill_no} payment — ${bill.party}`,
    ref: bill.bill_no,
    fund_name: bill.fund_name,
    created_at: new Date().toISOString()
  })

  // 4. Write CR ledger entry for the payment
  //    Bill paid = Credit (CR) — cash/bank goes out to settle the liability
  const ledgerAccount = accountUsed || bill.account || bill.party
  await db().from('ledger').insert({
    date,
    account: ledgerAccount,
    type: 'CR',
    amount: paymentAmount,
    signed: Math.abs(paymentAmount),
    narration: notes || `Bill #${bill.bill_no} payment — ${bill.party}`,
    ref: bill.bill_no,
    fund_name: bill.fund_name || null,
    created_at: new Date().toISOString(),
  })

  // 5. Deduct from account balance (bill payment → account balance goes down)
  if (accountUsed) {
    const { data: acct } = await db().from('accounts').select('balance').eq('name', accountUsed).single()
    if (acct) {
      const newBalance = Math.round((acct.balance - paymentAmount) * 100) / 100
      await db().from('accounts').update({ balance: newBalance }).eq('name', accountUsed)
    }
  }

  // 6. If bill has a fund, reflect payment in funds balance via ledger (already handled above via fund_name on ledger entry)
  //    Also adjust fund account balance if different from paying account
  if (bill.fund_name) {
    const { data: fund } = await db().from('funds').select('*').eq('name', bill.fund_name).single()
    if (fund && fund.account && fund.account !== accountUsed) {
      const { data: fundAcct } = await db().from('accounts').select('balance').eq('name', fund.account).single()
      if (fundAcct) {
        const newBalance = Math.round((fundAcct.balance - paymentAmount) * 100) / 100
        await db().from('accounts').update({ balance: newBalance }).eq('name', fund.account)
      }
    }
  }

  return NextResponse.json({ success: true, new_status: newStatus, new_paid: newPaid })
}
