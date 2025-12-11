'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, History, Settings } from 'lucide-react';

const IconContainer = ({ children }: { children?: React.ReactNode }) => (
  <div className="h-[38px] flex items-center justify-center relative">
    {children}
  </div>
);

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
      isActive 
        ? 'text-brand-pink dark:text-white' 
        : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300'
    }`;
  };

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-900 z-50 transition-colors duration-200">
      <div className="grid grid-cols-4 w-full h-[80px] pb-2">
        <Link href="/" className={getLinkClass('/')}>
           <IconContainer>
             <Home size={24} strokeWidth={2.5} />
           </IconContainer>
           <span className="text-[10px] font-bold tracking-wide">Home</span>
        </Link>

        <Link href="/add-trip" className={getLinkClass('/add-trip')}>
          {(() => {
            const isActive = pathname === '/add-trip';
            return (
              <>
                <IconContainer>
                  <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-neutral-100 dark:bg-neutral-900' : ''}`}>
                    <PlusCircle size={26} strokeWidth={2.5} className={isActive ? 'text-brand-pink dark:text-white' : 'text-neutral-400 dark:text-neutral-600'} />
                  </div>
                </IconContainer>
                <span className="text-[10px] font-bold tracking-wide">New Event</span>
              </>
            );
          })()}
        </Link>

        <Link href="/history" className={getLinkClass('/history')}>
          <IconContainer>
            <History size={24} strokeWidth={2.5} />
          </IconContainer>
          <span className="text-[10px] font-bold tracking-wide">History</span>
        </Link>

        <Link href="/settings" className={getLinkClass('/settings')}>
          <IconContainer>
            <Settings size={24} strokeWidth={2.5} />
          </IconContainer>
          <span className="text-[10px] font-bold tracking-wide">Settings</span>
        </Link>
      </div>
    </nav>
  );
};