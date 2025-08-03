// src/app/layout.js
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Přehled zakázek',
  description: 'Aplikace pro sledování a správu zakázek',
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <head>
        {/* ZMĚNA: Přidán blok se styly pro Glassmorphism a pozadí */}
        <style jsx global>{`
          body {
            background-color: hsl(222 47% 11%);
            background-image: 
              radial-gradient(at 20% 20%, hsla(210, 80%, 40%, 0.2) 0px, transparent 50%),
              radial-gradient(at 80% 20%, hsla(180, 70%, 50%, 0.15) 0px, transparent 50%),
              radial-gradient(at 50% 80%, hsla(240, 60%, 40%, 0.2) 0px, transparent 50%),
              radial-gradient(at 90% 90%, hsla(340, 70%, 50%, 0.1) 0px, transparent 50%);
            background-attachment: fixed;
          }

          .glass {
            background-color: rgba(22, 34, 51, 0.2); /* tmavě modrá s průhledností */
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px); /* Pro Safari */
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <AppProviders>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: '',
              style: {
                border: '1px solid #4B5563',
                padding: '16px',
                color: '#E5E7EB',
                backgroundColor: '#1F2937',
              },
            }}
          />
          {children}
        </AppProviders>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}