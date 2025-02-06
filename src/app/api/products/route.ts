import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getAccessToken } from '@/lib/shopify';
import crypto from 'crypto';
import { getCookie } from 'cookies-next';

const JWT_SECRET = process.env.JWT_SECRET || ""

// Helper function to decrypt access token
function decryptAccessToken(encryptedToken: string): string {
  // Extract IV from the first 32 characters (16 bytes in hex)
  const iv = Buffer.from(encryptedToken.slice(0, 32), 'hex');
  const encryptedData = encryptedToken.slice(32);
  
  // Create key buffer using the same key derivation as encryption
  const key = crypto.scryptSync(JWT_SECRET, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decryptedToken = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedToken += decipher.final('utf8');
  return decryptedToken;
}

// Helper function to verify session token
async function verifySessionToken(request: NextRequest) {
  // Try to get from headers first
  let sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  let shopDomain = request.headers.get('X-Shop-Domain');

  // If not in headers, try to get from cookies
  if (!sessionToken || !shopDomain) {
    sessionToken = await getCookie('sessionToken', { req: request }) || "";
    shopDomain = await getCookie('shopDomain', { req: request }) || "";
  }

  if (!sessionToken || !shopDomain) {
    throw new Error('Missing authentication credentials');
  }

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET) as { shop: string };
    if (decoded.shop !== shopDomain) {
      throw new Error('Shop mismatch');
    }

    const encryptedToken = await getAccessToken(shopDomain);
    if (!encryptedToken) {
      throw new Error('Access token not found');
    }

    return decryptAccessToken(encryptedToken);
  } catch (error) {
    throw new Error('Invalid session token');
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accessToken = await verifySessionToken(request);
    
    // Use the access token to fetch products from Shopify
    let shopDomain = request.headers.get('X-Shop-Domain');
    if ( !shopDomain) {
    shopDomain = await getCookie('shopDomain', { req: request }) || "";
  }
    const response = await fetch(`https://${shopDomain}/admin/api/2023-07/products.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const accessToken = await verifySessionToken(request);
    const body = await request.json();

    // Use the access token to create a product in Shopify
    const response = await fetch(`https://${request.headers.get('X-Shop-Domain')}/admin/api/2023-07/products.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}