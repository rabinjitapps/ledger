import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('ledger_session')?.value

  if (!session) {
    return NextResponse.json({ type: null })
  }

  // Legacy plain string (old sessions)
  if (session === 'authenticated') {
    return NextResponse.json({ type: 'admin' })
  }

  try {
    const parsed = JSON.parse(session)
    if (parsed?.type === 'admin') {
      return NextResponse.json({ type: 'admin' })
    }
    if (parsed?.type === 'user') {
      return NextResponse.json({
        type: 'user',
        id: parsed.id,
        username: parsed.username,
        permissions: parsed.permissions ?? [],
      })
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ type: null })
}
