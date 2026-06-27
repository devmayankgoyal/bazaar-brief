/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply to every route on the site.
        source: "/(.*)",
        headers: [
          // Prevents the site from being embedded in an iframe elsewhere
          // (protects against clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from guessing content types in a way that
          // can be exploited.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limits how much referrer info leaks to other sites when
          // someone clicks "Read original".
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disables powerful browser features this site never needs.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
