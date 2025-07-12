// src/next.config.mjs - Návrat k předchozímu stavu
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          // Zde byly odstraněny agresivní cache-control hlavičky pro vývoj/ladění,
          // protože se zdá, že způsobovaly problémy nebo nebyly potřeba.
        ],
      },
    ];
  },
};

export default nextConfig;