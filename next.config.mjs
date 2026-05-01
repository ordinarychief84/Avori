/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  async headers() {
    // Hardening rules. The order matters only for matching — every matching
    // rule contributes its headers, so we keep route-specific overrides
    // (CORS for /widget.js, /api/public/*, /uploads/*) and add a global
    // baseline for the rest of the app.
    const securityBaseline = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Allow camera on same-origin so the try-on widget works on demo.html;
      // disable everything else by default.
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
      },
    ];

    return [
      {
        source: '/widget.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/api/public/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" },
        ],
      },
      // Global hardening for everything else (dashboard, admin, marketing,
      // private API). The route-specific rules above add CORS/cache/CSP on
      // top; this rule supplies the baseline that should apply everywhere.
      {
        source: '/:path*',
        headers: securityBaseline,
      },
    ];
  },
};

export default nextConfig;
