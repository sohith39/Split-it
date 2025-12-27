/**
 * This file acts as the "Frame" for the app.
 * It puts the navigation bar at the bottom and leaves a space in the middle 
 * for the different pages (Home, History, etc.) to show up.
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusCircle, History, Settings } from 'lucide-react';

const IconContainer = ({ children }: { children?: React.ReactNode }) => (
  <div className="h-[38px] flex items-center justify-center relative">
    {children}
  </div>
);

const Layout: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
      isActive 
        ? 'text-brand-pink dark:text-white' 
        : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300'
    }`;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-200">
      {/* This is the area where the current page is displayed */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
        <Outlet />
      </main>
      
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-900 z-50 transition-colors duration-200">
        <div className="grid grid-cols-4 w-full h-[80px] pb-2">
          <NavLink to="/" className={navLinkClass}>
             <IconContainer>
               <Home size={24} strokeWidth={2.5} />
             </IconContainer>
             <span className="text-[10px] font-bold tracking-wide">Home</span>
          </NavLink>

          <NavLink to="/add-trip" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <IconContainer>
                  <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-neutral-100 dark:bg-neutral-900' : ''}`}>
                    <PlusCircle size={26} strokeWidth={2.5} className={isActive ? 'text-brand-pink dark:text-white' : 'text-neutral-400 dark:text-neutral-600'} />
                  </div>
                </IconContainer>
                <span className="text-[10px] font-bold tracking-wide">New Event</span>
              </>
            )}
          </NavLink>

          <NavLink to="/history" className={navLinkClass}>
            <IconContainer>
              <History size={24} strokeWidth={2.5} />
            </IconContainer>
            <span className="text-[10px] font-bold tracking-wide">History</span>
          </NavLink>

          <NavLink to="/settings" className={navLinkClass}>
            <IconContainer>
              <Settings size={24} strokeWidth={2.5} />
            </IconContainer>
            <span className="text-[10px] font-bold tracking-wide">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;