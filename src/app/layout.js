// src/app/layout.js
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Přehled zakázek',
  description: 'Aplikace pro sledování a správu zakázek',
};

// Vytvoříme samostatnou komponentu pro styly, aby byla kompatibilní s Next.js
const GlobalStyles = () => (
  <style jsx global>{`
    body {
      background-color: #0d1117 !important;
      background-image: 
        radial-gradient(at 20% 20%, hsla(210, 80%, 40%, 0.2) 0px, transparent 50%),
        radial-gradient(at 80% 20%, hsla(180, 70%, 50%, 0.15) 0px, transparent 50%),
        radial-gradient(at 50% 80%, hsla(240, 60%, 40%, 0.2) 0px, transparent 50%),
        radial-gradient(at 90% 90%, hsla(340, 70%, 50%, 0.1) 0px, transparent 50%) !important;
      background-attachment: fixed !important;
    }

    .glass-card {
      background-color: rgba(22, 34, 51, 0.25) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important; /* Pro Safari */
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
  `}</style>
);

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <head>
        <GlobalStyles />
      </head>
      <body>
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