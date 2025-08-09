
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { cookies } from 'next/headers';

// Correctly initialize the Firebase Admin SDK with service account credentials
// This is a common pattern for Next.js API routes.
if (!getApps().length) {
    try {
        initializeApp({
            credential: cert(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
        });
    } catch (e: any) {
        console.error("Firebase admin initialization error", e.stack);
    }
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
