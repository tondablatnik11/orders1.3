import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders"; // Importuj novou komponentu

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Přehled zakázek",
  description: "Dashboard pro přehled zakázek",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}