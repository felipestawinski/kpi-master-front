import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter, Roboto, Poppins } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })
// or
const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '700']
})
// or
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KPI App",
  description: "KPI Application",
  icons: [
    {
      url: '/favicon.ico',
    },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        {children}
      </body>
    </html>
  );
}
