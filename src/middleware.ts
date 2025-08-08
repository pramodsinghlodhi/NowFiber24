
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
    initializeApp();
}
const auth = getAuth();

// Force the middleware to run on the Node.js runtime
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // If no session cookie, redirect to login page
  if (!session) {
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the session cookie. In case the cookie is invalid, redirect to login page.
  try {
    await auth.verifySessionCookie(session, true);
  } catch (error) {
     if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and tries to access the login page, redirect to the dashboard.
   if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
