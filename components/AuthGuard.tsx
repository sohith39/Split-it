'use client';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTrips } from '../context/TripContext';

export default function AuthGuard({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useTrips();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.replace('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
              <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // Prevent flash of content
  if (!isAuthenticated && pathname !== '/login') return null;
  if (isAuthenticated && pathname === '/login') return null;

  return <>{children}</>;
}