# Deployment Setup Guide

This guide will help you set up the environment variables required for deploying the Zero Error application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables Setup](#environment-variables-setup)
- [Deployment Platforms](#deployment-platforms)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- Access to the platforms mentioned below
- A domain name (for production deployment)

## Environment Variables Setup

### 1. Next-Auth Configuration

**AUTH_SECRET**
- **Purpose**: Secret key for encrypting NextAuth.js sessions and tokens
- **How to generate**:
  ```bash
  openssl rand -base64 32
  ```
- **Example**: `Yf+vXVT/Bonowi09dMQAvc40An2a2+abxFyH+QAiCsg=`

**NEXTAUTH_URL** and **AUTH_URL**
- **Purpose**: The canonical URL of your application
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Note**: Both variables should have the same value

### 2. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select an existing one
3. Navigate to **OAuth2** section
4. Copy the **Client ID** and **Client Secret**
5. Add redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/discord`
   - Production: `https://yourdomain.com/api/auth/callback/discord`

**Variables needed**:
```env
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

**Variables needed**:
```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 4. MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster or use an existing one
3. Create a database user:
   - Go to **Database Access**
   - Click **Add New Database User**
   - Set username and password
   - Grant **Read and write to any database** permission
4. Whitelist IP addresses:
   - Go to **Network Access**
   - Click **Add IP Address**
   - For development: Add your current IP
   - For production: Add `0.0.0.0/0` (all IPs) or your server's IP
5. Get connection string:
   - Go to **Database** → **Connect**
   - Choose **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database>` with your database name (e.g., `zero-error-db`)

**Variable needed**:
```env
MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/zero-error-db?retryWrites=true&w=majority"
```

### 5. UploadThing Setup

1. Go to [UploadThing Dashboard](https://uploadthing.com/dashboard)
2. Sign in with GitHub
3. Create a new app or select an existing one
4. Go to **API Keys**
5. Copy the token

**Variable needed**:
```env
UPLOADTHING_TOKEN="your-uploadthing-token"
```

### 6. Email Configuration (Gmail)

For sending emails through the application:

1. Enable 2-Factor Authentication on your Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select **Mail** and **Other (Custom name)**
4. Generate the app password
5. Copy the 16-character password (remove spaces)

**Variables needed**:
```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
```

**Note**: Never use your actual Gmail password. Always use App Passwords.

## Deployment Platforms

### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Add environment variables:
   - Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to **Settings** → **Environment Variables**
   - Add all variables from `.env.example`
   - Set appropriate values for **Production**, **Preview**, and **Development** environments

4. Deploy:
   ```bash
   vercel --prod
   ```

**Important Vercel Settings**:
- Framework Preset: `Next.js`
- Build Command: `pnpm build` (or `npm run build`)
- Output Directory: `.next`
- Install Command: `pnpm install` (or `npm install`)
- Node Version: `18.x` or higher

### Netlify Deployment

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize site:
   ```bash
   netlify init
   ```

4. Add environment variables:
   - Go to **Site settings** → **Build & deploy** → **Environment**
   - Add all variables from `.env.example`

5. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Railway Deployment

1. Go to [Railway](https://railway.app/)
2. Create a new project
3. Connect your GitHub repository
4. Add environment variables in the **Variables** tab
5. Railway will automatically deploy

### Docker Deployment

1. Create a `Dockerfile` in your project root:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN npm install -g pnpm && pnpm install --frozen-lockfile

   # Build the application
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm install -g pnpm && pnpm build

   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. Create `.dockerignore`:
   ```
   node_modules
   .next
   .git
   .env.local
   ```

3. Build and run:
   ```bash
   docker build -t zero-error .
   docker run -p 3000:3000 --env-file .env.local zero-error
   ```

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - It's already in `.gitignore`
   - Always use `.env.example` for sharing structure

2. **Rotate secrets regularly**
   - Change `AUTH_SECRET` periodically
   - Regenerate OAuth credentials if compromised

3. **Use different credentials for each environment**
   - Development should use separate OAuth apps
   - Production should have its own database

4. **Restrict MongoDB access**
   - Use specific IP addresses instead of `0.0.0.0/0` when possible
   - Create database users with minimal required permissions

5. **Enable CORS properly**
   - Configure OAuth redirect URIs for your specific domains only

6. **Monitor your deployments**
   - Set up error tracking (Sentry, LogRocket)
   - Enable deployment notifications

## Environment-Specific Configuration

### Development
```env
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
```

### Staging
```env
NEXTAUTH_URL="https://staging.yourdomain.com"
AUTH_URL="https://staging.yourdomain.com"
```

### Production
```env
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
```

## Troubleshooting

### OAuth Not Working
- Verify redirect URIs match exactly (including trailing slashes)
- Check that OAuth apps are configured for the correct environment
- Ensure cookies are enabled in your browser

### MongoDB Connection Issues
- Verify IP whitelist includes your deployment server
- Check username and password are correctly URL-encoded
- Ensure database name exists in your cluster

### Email Not Sending
- Confirm 2FA is enabled on Google Account
- Use App Password, not regular password
- Check for typos in email address

### NextAuth Session Issues
- Regenerate `AUTH_SECRET`
- Clear browser cookies
- Verify `NEXTAUTH_URL` matches your actual domain

### Build Failures
- Check all required environment variables are set
- Verify Node.js version is 18 or higher
- Clear `.next` folder and rebuild

## Testing Your Setup

Before deploying to production, test your configuration:

1. **Local testing**:
   ```bash
   pnpm dev
   ```

2. **Production build test**:
   ```bash
   pnpm build
   pnpm start
   ```

3. **Test OAuth flows**:
   - Try signing in with Discord
   - Try signing in with Google
   - Verify user data is saved to MongoDB

4. **Test file uploads**:
   - Upload an image through the application
   - Verify it's stored in UploadThing

5. **Test email functionality**:
   - Send a test email through the contact form
   - Verify it's received

## Support

For additional help:
- Check the [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- Review [NextAuth.js Documentation](https://next-auth.js.org/deployment)
- Consult platform-specific guides (Vercel, Netlify, etc.)

## Checklist

Before going live, ensure:
- [ ] All environment variables are set
- [ ] OAuth redirect URIs are configured for production domain
- [ ] MongoDB is accessible from production server
- [ ] Email credentials are working
- [ ] `AUTH_SECRET` is securely generated
- [ ] Production URLs are set correctly
- [ ] All services (Discord, Google, MongoDB, UploadThing) are on paid/production plans if needed
- [ ] Error monitoring is set up
- [ ] Backups are configured for MongoDB
- [ ] Domain DNS is properly configured
- [ ] SSL/HTTPS is enabled

---

**Last Updated**: January 2026
