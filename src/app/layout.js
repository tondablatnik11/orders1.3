import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';

export const metadata = {
  title: 'Přehled zakázek',
  description: 'Aplikace pro sledování a správu zakázek',
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}