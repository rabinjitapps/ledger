import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth'
import { verifyUserPassword } from '@/lib/users'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, mode, username } = body

    let sessionData: string

    if (mode === 'user' && username) {
      // User login
      const user = await verifyUserPassword(username, password)
      if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      // Encode user id + permissions in session
      sessionData = JSON.stringify({
        type: 'user',
        id: user.id,
        username: user.username,
        permissions: user.permissions,
      })
    } else {
      // Admin login
      const ok = await verifyPassword(password)
      if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      sessionData = JSON.stringify({ type: 'admin' })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set('ledger_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
