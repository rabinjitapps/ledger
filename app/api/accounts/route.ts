import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET() {
  const { data, error } = await db().from('accounts').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, balance = 0 } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  
  const { data, error } = await db()
    .from('accounts')
    .upsert({ name, balance, created_at: new Date().toISOString() }, { onConflict: 'name' })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { name } = await req.json()
  const { error } = await db().from('accounts').delete().eq('name', name)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
