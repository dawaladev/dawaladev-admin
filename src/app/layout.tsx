import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dawala - Admin",
  description: "Gastronomi Management System Desa Wisata Alamendah",
  icons: {
    icon: "/Dawala.png", // Hapus "public" dari path karena Next.js secara otomatis mencari di folder public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthErrorBoundary>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
