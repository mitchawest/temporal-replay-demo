import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Temporal Replay Demo",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{
        display: 'flex',
        flexDirection: 'column',
        color: 'black',
        background: 'linear-gradient(15deg, rgba(219,218,218,1) 0%, rgba(231,231,231,1) 53%, rgba(255,255,255,1) 100%)',
        width: '100%',
        height: '100%',
        fontFamily: 'Jockey One, sans-serif'
      }}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
