import axios from 'axios';
import { getCookie } from 'cookies-next';

// Create an axios instance for authenticated API requests
export const authenticatedApi = axios.create({
  baseURL: '/api',
});

// Add request interceptor to include session token
authenticatedApi.interceptors.request.use(
  (config) => {
    let sessionToken, shopDomain;

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Client-side: Parse cookies from document.cookie
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      sessionToken = cookies['sessionToken'];
      shopDomain = cookies['shopDomain'];
    } else {
      // Server-side: Use cookies-next
      sessionToken = getCookie('sessionToken');
      shopDomain = getCookie('shopDomain');
    }

    if (sessionToken && shopDomain) {
      config.headers['Authorization'] = `Bearer ${sessionToken}`;
      config.headers['X-Shop-Domain'] = shopDomain;
      console.log('Setting headers:', config.headers);
    } else {
      console.warn('Missing session token or shop domain');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors and session expiration
authenticatedApi.interceptors.response.use(
  (response) => {
    // Check for session expiration warning
    if (response.headers['x-session-expires-soon']) {
      // Notify user about impending session expiration
      const remainingTime = 5 * 60; // 5 minutes in seconds
      const warningMessage = `Your session will expire in ${Math.floor(remainingTime / 60)} minutes. Please save your work.`;
      console.warn(warningMessage);
      // You can implement a more sophisticated notification system here
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear cookies and redirect to home page on authentication error
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'shopDomain=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Helper function to verify session token
export async function verifySession(sessionToken: string, shop: string) {
  try {
    const response = await authenticatedApi.post('/auth/verify', {
      sessionToken,
      shop,
    });
    return response.data;
  } catch (error) {
    return null;
  }
}