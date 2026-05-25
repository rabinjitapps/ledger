import { NextRequest, NextResponse } from 'next/server'

// Map each route prefix to the permission key required
const PERMISSION_ROUTES: Record<string, string> = {
  '/ledger':        'ledger',
  '/bills':         'bills',
  '/cashbook':      'cashbook',
  '/vendors':       'vendors',
  '/accounts':      'accounts',
  '/funds':         'funds',
  '/trial-balance': 'trial-balance',
  '/reports':       'reports',
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware entirely for these paths
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  const session = req.cookies.get('ledger_session')?.value

  if (!session || session.trim() === '') {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  try {
    // Legacy plain string
    if (session === 'authenticated') return NextResponse.next()

    const parsed = JSON.parse(session)

    // Admin can access everything
    if (parsed?.type === 'admin') return NextResponse.next()

    if (parsed?.type === 'user') {
      const permissions: string[] = parsed.permissions ?? []

      // Block /users page for non-admins
      if (pathname.startsWith('/users')) {
        const url = req.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // Check permission-gated routes
      for (const [route, perm] of Object.entries(PERMISSION_ROUTES)) {
        if (pathname === route || pathname.startsWith(route + '/')) {
          if (!permissions.includes(perm)) {
            const url = req.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
          }
          break
        }
      }

      return NextResponse.next()
    }
  } catch {
    // fall through
  }

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  // Only run on page routes, not static files or api
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
