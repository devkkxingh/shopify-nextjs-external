// app/api/auth/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { storeAccessToken } from '@/lib/shopify';
import jwt from 'jsonwebtoken';
import { setCookie } from 'cookies-next';

const JWT_SECRET = process.env.JWT_SECRET || ""

// Use your app credentials for OAuth verification
const SHOPIFY_APP_API_KEY = process.env.SHOPIFY_APP_API_KEY || '';
const SHOPIFY_APP_SECRET = process.env.SHOPIFY_APP_SECRET || '';

// The scopes for the OAuth access (adjust as needed)
const SCOPES = process.env.SCOPES || 'read_products,write_products';
const REDIRECT_URI = process.env.REDIRECT_URI || '';

if (!SHOPIFY_APP_API_KEY || !SHOPIFY_APP_SECRET || !REDIRECT_URI) {
  console.error('Missing required environment variables');
  throw new Error('Missing required environment variables');
}

// Cookie configuration
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 // 24 hours
};

function verifyHmac(queryObj: Record<string, string>, hmac: string): boolean {
  const message = Object.keys(queryObj)
    .filter((key) => key !== 'hmac' && key !== 'signature')
    .sort()
    .map((key) => `${key}=${queryObj[key]}`)
    .join('&');

  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_APP_SECRET)
    .update(message)
    .digest('hex');

  return generatedHmac === hmac;
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const hmac = searchParams.get('hmac');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  if (!code) {
    const queryObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    if (!hmac || !verifyHmac(queryObj, hmac)) {
      return NextResponse.json(
        { error: 'HMAC validation failed' },
        { status: 400 }
      );
    }

    const nonce = crypto.randomBytes(32).toString('hex');
    const response = NextResponse.redirect(`https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_APP_API_KEY}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${nonce}&grant_options[]=per-user`);
    
    // Store nonce in cookie for CSRF protection
    response.cookies.set('nonce', nonce, COOKIE_CONFIG);
    return response;
  }

  // Verify the state parameter matches stored nonce
  const storedNonce = request.cookies.get('nonce')?.value;
  if (!storedNonce || storedNonce !== state) {
    return NextResponse.json(
      { error: 'Invalid state parameter' },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_APP_API_KEY,
        client_secret: SHOPIFY_APP_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      // Encrypt the access token before storing
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(JWT_SECRET, 'salt', 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encryptedToken = iv.toString('hex');
      encryptedToken += cipher.update(tokenData.access_token, 'utf8', 'hex');
      encryptedToken += cipher.final('hex');
      
      // Store the encrypted access token in Supabase
      await storeAccessToken(shop, encryptedToken);

      // Create a JWT session token
      const sessionToken = jwt.sign(
        { 
          shop,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiration
        },
        JWT_SECRET
      );

      // Create the response with redirect
      const response = NextResponse.redirect(new URL(`/dashboard/${shop}`, request.url));

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
      response.cookies.delete('nonce'); // Clean up the nonce
       setCookie('sessionToken', sessionToken)
       setCookie('shopDomain', shop)

      return response;
    } else {
      return NextResponse.json(
        {
          error: 'Failed to retrieve access token',
          details: tokenData,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error fetching access token', details: error.toString() },
      { status: 500 }
    );
  }
}
