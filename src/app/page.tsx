"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAuthAndRedirect = async () => {
      if (!isMounted) return;

      // Check for session token in cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const sessionToken = cookies['sessionToken'];
      const shopDomain = cookies['shopDomain'];

      if (sessionToken && shopDomain) {
        // If we have valid session cookies, redirect to dashboard
        window.location.href = `/dashboard/${shopDomain}`;
        return;
      }

      // If no valid session, check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      const session = urlParams.get('session');

      if (shop && session) {
        try {
          // Verify and store the session
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session, shop }),
          });

          if (response.ok) {
            window.location.href = `/dashboard/${shop}`;
            return;
          }
        } catch (error) {
          console.error('Auth check error:', error);
        }
      }

      // If we get here, no valid session or access token was found
      setIsLoading(false);
    };

    checkAuthAndRedirect();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInstall = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const hmac = urlParams.get('hmac');
    const host = urlParams.get('host');
    const timestamp = urlParams.get('timestamp');

    const params = new URLSearchParams();
    if (shop) params.append('shop', shop);
    if (hmac) params.append('hmac', hmac);
    if (host) params.append('host', host);
    if (timestamp) params.append('timestamp', timestamp);

    const authUrl = `/api/auth${params.toString() ? `?${params.toString()}` : ''}`;
    window.location.href = authUrl;
  }

  if (isLoading) {
    return (
      <main className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[80vh]">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Dropship</h1>
          <p className="text-muted-foreground text-lg">
            Import curated products and collections to your Shopify store
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Install our app to start importing products to your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={handleInstall}>
              Install App
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}