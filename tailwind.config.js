/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    transparent: 'transparent',
    current: 'currentColor',
    extend: {
      colors: {
        // ... (barevné palety)
      },
      boxShadow: {
        // ... (stíny)
      },
      borderRadius: {
        // ... (zaoblení)
      },
      fontSize: {
        // ... (velikosti písma)
      },
      // Zde je nová sekce pro animace
      animation: {
        'fade-in-up': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: 0, transform: 'translateY(10px)' },
          'to': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  safelist: [
    // ... (safelist)
  ],
  plugins: [require('@headlessui/tailwindcss'), require('@tailwindcss/forms')],
}