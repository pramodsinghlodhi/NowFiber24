
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Force the middleware to run on the Node.js runtime
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // If no session cookie, redirect to login page for protected routes
  if (!session) {
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated (has a session cookie) and tries to access the landing or login page, 
  // redirect them to the dashboard.
   if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
