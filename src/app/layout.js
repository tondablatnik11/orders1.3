import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import { Toaster } from 'react-hot-toast'; // <-- PŘIDÁN IMPORT

export const metadata = {
  title: 'Přehled zakázek',
  description: 'Aplikace pro sledování a správu zakázek',
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>
        <AppProviders>
          {/* Poskytovatel pro notifikace */}
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
      </body>
    </html>
  );
}