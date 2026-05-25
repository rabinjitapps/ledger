import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const db = () => createServiceClient()

export async function GET() {
  const { data, error } = await db().from('vendors').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, contact, address, gst, email, pan } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  
  const { data, error } = await db()
    .from('vendors')
    .upsert({ name, contact, address, gst, email, pan, created_at: new Date().toISOString() }, { onConflict: 'name' })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...fields } = body
  const { data, error } = await db().from('vendors').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await db().from('vendors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
