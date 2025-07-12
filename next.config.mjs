/** @type {import('next').NextConfig} */
const nextConfig = {
  // Zakázat minifikaci (pro ladění)
  // Toto je velmi agresivní krok, který zvětší velikost JS souborů.
  // Pouze pro diagnostiku.
  minify: false, 

  // Zakázat SWC minifikátor (pro ladění)
  swcMinify: false, 

  // Explicitně zakázat Image Optimization během buildu (pokud by způsobovala problémy)
  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          // Přidat agresivní cache-control pro vývoj/ladění, aby se vždy načítala nejnovější verze
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;