import React from 'react';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TripProvider } from "@/context/TripContext";
import { ClientLayout } from "@/components/ClientLayout";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SplitIt",
  description: "A mobile-first expense tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-black text-neutral-900 dark:text-white h-screen overflow-hidden flex flex-col transition-colors duration-200 font-sans`}>
        <div className="flex-1 flex flex-col h-full w-full max-w-md mx-auto bg-white dark:bg-black shadow-2xl overflow-hidden relative transition-colors duration-200 border-x border-neutral-100 dark:border-neutral-900">
          <TripProvider>
            <AuthGuard>
              <ClientLayout>
                {children}
              </ClientLayout>
            </AuthGuard>
          </TripProvider>
        </div>
      </body>
    </html>
  );
}