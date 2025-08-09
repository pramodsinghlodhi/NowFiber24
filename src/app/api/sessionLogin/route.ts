
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { cookies } from 'next/headers';
import 'dotenv/config';


// Correctly initialize the Firebase Admin SDK.
// This is the recommended pattern for Next.js API routes, allowing it to
// work in managed environments where credentials are automatically discovered.
if (!getApps().length) {
    initializeApp();
}

const auth = getAuth();

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
        return NextResponse.json({ success: false, message: 'ID token is required.' }, { status: 400 });
    }

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const options = {
        name: 'session',
        value: sessionCookie,
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        path: '/',
    };

    // Set cookie on the response.
    cookies().set(options.name, options.value, options);

    return NextResponse.json({ success: true, message: "Session cookie created successfully." });

  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ success: false, message: 'Failed to create session.', error: error.message }, { status: 500 });
  }
}
