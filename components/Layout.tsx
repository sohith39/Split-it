import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusCircle, History, Settings } from 'lucide-react';

const Layout: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
      isActive 
        ? 'text-blue-600 dark:text-blue-400' 
        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
    }`;

  // Common container for icons to ensure perfect alignment
  const IconContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="h-[38px] flex items-center justify-center relative">
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-200">
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
                  <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                    <PlusCircle size={26} strokeWidth={2.5} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
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