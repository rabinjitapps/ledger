import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  // Delete the cookie properly with matching attributes
  response.cookies.set('ledger_session', '', {
    expires: new Date(0),
    maxAge: 0,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
  return response
}
