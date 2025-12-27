
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, PlusCircle, History, Settings } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/trip/') || location.pathname === '/onboarding';

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${
      isActive 
        ? 'text-brand-pink dark:text-white scale-110' 
        : 'text-neutral-400 dark:text-neutral-600'
    }`;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black transition-colors duration-200">
      <main className={`flex-1 overflow-y-auto overflow-x-hidden ${hideNav ? '' : 'pb-24'}`}>
        <Outlet />
      </main>
      
      {!hideNav && (
        <nav className="fixed bottom-0 w-full max-w-md bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-neutral-100 dark:border-neutral-900 z-50 transition-colors duration-200">
          <div className="grid grid-cols-4 w-full h-[80px] pb-2">
            <NavLink to="/" className={navLinkClass}>
               <Home size={24} strokeWidth={2.5} />
               <span className="text-[10px] font-bold">Home</span>
            </NavLink>

            <NavLink to="/add-trip" className={navLinkClass}>
               <PlusCircle size={26} strokeWidth={2.5} />
               <span className="text-[10px] font-bold">New</span>
            </NavLink>

            <NavLink to="/history" className={navLinkClass}>
              <History size={24} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">History</span>
            </NavLink>

            <NavLink to="/settings" className={navLinkClass}>
              <Settings size={24} strokeWidth={2.5} />
              <span className="text-[10px] font-bold">Settings</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
