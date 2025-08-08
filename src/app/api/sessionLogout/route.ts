
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const options = {
      name: 'session',
      value: '',
      maxAge: -1, // Expire the cookie immediately
    };

    cookies().set(options.name, options.value, options);

    return NextResponse.json({ success: true, message: 'Session cookie cleared.' });
  } catch (error: any) {
    console.error('Error clearing session cookie:', error);
    return NextResponse.json({ success: false, message: 'Failed to clear session.' }, { status: 500 });
  }
}
