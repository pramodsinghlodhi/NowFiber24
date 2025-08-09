
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApps, initializeApp } from 'firebase-admin/app';
import 'dotenv/config';

if (!getApps().length) {
    initializeApp();
}

export async function POST(request: NextRequest) {
  try {
    const options = {
      name: 'session',
      value: '',
      maxAge: -1, // Expire the cookie immediately
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    cookies().set(options.name, options.value, options);

    return NextResponse.json({ success: true, message: 'Session cookie cleared.' });
  } catch (error: any) {
    console.error('Error clearing session cookie:', error);
    return NextResponse.json({ success: false, message: 'Failed to clear session.' }, { status: 500 });
  }
}
