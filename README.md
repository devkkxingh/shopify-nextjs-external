# Shopify Next.js External App

A secure and modern Next.js application for integrating with Shopify stores using OAuth authentication. This app provides a robust foundation for building Shopify applications with features like secure session management, access token handling, and protected routes.

## Features

- **Secure OAuth Authentication**: Implements Shopify's OAuth flow with HMAC validation and CSRF protection
- **Session Management**: JWT-based session handling with automatic expiration
- **Secure Token Storage**: Encrypted access token storage using Supabase
- **Middleware Protection**: Route protection with automatic session validation
- **Modern Tech Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js (Latest LTS version recommended)
- A Shopify Partner account
- A Supabase account and project

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SHOPIFY_APP_API_KEY=your_shopify_api_key
SHOPIFY_APP_SECRET=your_shopify_app_secret
SCOPES=read_products,write_products
REDIRECT_URI=your_app_redirect_uri
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Set up your Supabase project:
   - Create a new table named 'stores' with columns:
     - shop_domain (text, primary key)
     - access_token (text)
     - installed_at (timestamp)

4. Configure your Shopify app:
   - Go to your Shopify Partner dashboard
   - Create a new app
   - Set the App URL and Allowed redirection URL(s)
   - Copy the API key and secret to your environment variables

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Authentication Flow

1. Store owner visits your app's URL
2. App validates the request using HMAC
3. Redirects to Shopify OAuth consent screen
4. After approval, Shopify redirects back with an authorization code
5. App exchanges code for access token
6. Access token is encrypted and stored in Supabase
7. Session token (JWT) is created and stored in cookies
8. User is redirected to the dashboard

## Security Features

- HMAC validation for all Shopify requests
- CSRF protection using nonce
- Encrypted access token storage
- HTTP-only cookies for session management
- Automatic session expiration
- Protected routes using middleware

## Development

The app uses Next.js with TypeScript and includes:

- ESLint for code linting
- Tailwind CSS for styling
- Shadcn UI components
- Jose for JWT handling

## Deployment

The app is optimized for deployment on Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add your environment variables in Vercel
4. Deploy

## Best Practices

- Always use HTTPS in production
- Regularly rotate JWT secrets
- Monitor session expiration
- Implement rate limiting for API routes
- Keep dependencies updated

## Troubleshooting

- If authentication fails, check your API key and secret
- Verify your redirect URI matches exactly
- Ensure all required scopes are configured
- Check Supabase connection and table structure

## License

MIT
