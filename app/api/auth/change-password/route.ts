import { NextRequest, NextResponse } from 'next/server'
import { savePassword, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json()
    const ok = await verifyPassword(currentPassword)
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    if (!newPassword || newPassword.length < 4)
      return NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 })
    await savePassword(newPassword)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
