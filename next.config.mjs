/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// CSP rollout checklist:
// 1) Keep CSP_ENFORCE unset/false to emit Report-Only.
// 2) Monitor CSP violations in browser reports + edge logs after deploy.
// 3) Move any required nonce/hash tokens into CSP_*_SRC_EXTRA, then set CSP_ENFORCE=true.
const isCspEnforced = process.env.CSP_ENFORCE === 'true'

function parseCspExtras(rawValue) {
  if (!rawValue) {
    return []
  }

  return rawValue
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildCspValue() {
  const scriptExtras = parseCspExtras(process.env.CSP_SCRIPT_SRC_EXTRA)
  const styleExtras = parseCspExtras(process.env.CSP_STYLE_SRC_EXTRA)

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    ["style-src", "'self'", "'unsafe-inline'", ...styleExtras].join(' '),
    ["script-src", "'self'", "'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'", ...scriptExtras].join(
      ' '
    ),
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ]

  return directives.join('; ')
}

const nextConfig = {
  serverExternalPackages: ['pino', 'thread-stream', 'sonic-boom'],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.zeroerroresports.com' }],
        destination: 'https://zeroerroresports.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'zeroerrosports.com' }],
        destination: 'https://zeroerroresports.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.zeroerrosports.com' }],
        destination: 'https://zeroerroresports.com/:path*',
        permanent: true,
      },
      {
        source: '/%24',
        destination: '/',
        permanent: true,
      },
    ]
  },
  async headers() {
    // Switch path: Report-Only -> enforce is controlled only by CSP_ENFORCE.
    const cspKey = isCspEnforced ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'
    const cspValue = buildCspValue()

    return [
      {
        // API responses receive the same security headers in proxy.ts.
        // Limiting this rule avoids duplicate/conflicting header emission.
        source: '/((?!api/).*)',
        headers: [
          {
            key: cspKey,
            value: cspValue,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), fullscreen=(self)',
          },
        ],
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Prefer AVIF then WebP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Common device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Image sizes for responsive images
    minimumCacheTTL: 60, // Cache images for 60 seconds
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    localPatterns: [
      {
        pathname: '/images/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
