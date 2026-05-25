import { NextRequest, NextResponse } from 'next/server'
import { updateUser, deleteUser } from '@/lib/users'
import type { Permission } from '@/lib/users'

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('ledger_session')?.value
  if (!cookie) return false
  if (cookie === 'authenticated') return true
  try { return JSON.parse(cookie).type === 'admin' } catch { return false }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await req.json()
  const updates: any = {}
  if (body.permissions) updates.permissions = body.permissions as Permission[]
  if (body.active !== undefined) updates.active = body.active
  if (body.password) updates.password = body.password
  if (body.username) updates.username = body.username
  const result = await updateUser(params.id, updates)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const result = await deleteUser(params.id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
