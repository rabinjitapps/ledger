import { NextRequest, NextResponse } from 'next/server'
import { getUsers, createUser } from '@/lib/users'
import type { Permission } from '@/lib/users'

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('ledger_session')?.value
  if (!cookie) return false
  if (cookie === 'authenticated') return true
  try {
    const s = JSON.parse(cookie)
    return s.type === 'admin'
  } catch { return false }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const users = await getUsers()
  // Don't expose password hashes
  const safe = users.map(({ passwordHash, passwordSalt, ...u }) => u)
  return NextResponse.json(safe)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { username, password, permissions } = await req.json()
  if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  if (!password || password.length < 4) return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
  if (!permissions?.length) return NextResponse.json({ error: 'At least one permission is required' }, { status: 400 })
  const result = await createUser(username, password, permissions as Permission[])
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
