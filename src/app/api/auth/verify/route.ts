import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { setCookie } from 'cookies-next';

const JWT_SECRET = process.env.JWT_SECRET || ""

const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 // 24 hours
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { session, shop } = await request.json();

    if (!session || !shop) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a JWT session token
    const sessionToken = jwt.sign(
      { 
        shop,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
      },
      JWT_SECRET
    );

    // Create the response
    const response = NextResponse.json({ success: true });

    // Set secure cookies using Next.js cookies API
    response.cookies.set({
      name: 'sessionToken',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    response.cookies.set({
      name: 'shopDomain',
      value: shop,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    setCookie('sessionToken', sessionToken)
    setCookie('shopDomain', shop)

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}