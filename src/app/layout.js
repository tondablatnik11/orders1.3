// src/app/layout.js
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google'; // <-- NOVÝ IMPORT

const inter = Inter({ subsets: ['latin'] }); // <-- INICIALIZACE FONTU

export const metadata = {
  title: 'Přehled zakázek',
  description: 'Aplikace pro sledování a správu zakázek',
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      {/* APLIKACE FONTU NA CELOU STRÁNKU */}
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