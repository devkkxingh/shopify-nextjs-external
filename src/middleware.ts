import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';  // Using jose instead of jsonwebtoken

// Convert your secret to Uint8Array for jose
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET 
);

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;
    const shopDomain = request.cookies.get('shopDomain')?.value;

    if (!sessionToken || !shopDomain) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('sessionToken');
      response.cookies.delete('shopDomain');
      return response;
    }

    try {
      // Verify JWT using jose
      const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
      const decoded = payload as { shop: string; exp: number };
      
      // Check if token is expired
      if (Date.now() >= (decoded.exp || 0) * 1000) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('sessionToken');
        response.cookies.delete('shopDomain');
        return response;
      }
      
      if (decoded.shop !== shopDomain) {
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('sessionToken');
        response.cookies.delete('shopDomain');
        return response;
      }

      const fiveMinutes = 5 * 60 * 1000;
      if ((decoded.exp || 0) * 1000 - Date.now() < fiveMinutes) {
        const response = NextResponse.next();
        response.headers.set('X-Session-Expires-Soon', 'true');
        return response;
      }

      return NextResponse.next();
    } catch (error) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('sessionToken');
      response.cookies.delete('shopDomain');
      return response;
    }
  } catch (error) {
    console.error('Middleware error:', error);
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('sessionToken');
    response.cookies.delete('shopDomain');
    return response;
  }
}

// Config remains the same
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
