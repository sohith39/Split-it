'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

export const ClientLayout = ({ children }: { children?: React.ReactNode }) => {
  const pathname = usePathname();
  
  // Hide bottom nav on specific pages
  const hideNav = pathname === '/login' || pathname === '/onboarding' || pathname?.startsWith('/trip/');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-200">
      <main className={`flex-1 overflow-y-auto overflow-x-hidden ${hideNav ? '' : 'pb-24'}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};