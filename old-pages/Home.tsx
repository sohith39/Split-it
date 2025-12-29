/**
 * The Home page is your "Dashboard".
 * It displays your ongoing events and provides quick links to your friends, 
 * notifications, and profile.
 */
import React from 'react';
import Link from 'next/link';
import { useTrips } from '../context/TripContext';
import { ChevronRight, Calendar, Users, Bell, UserPlus } from 'lucide-react';
import { SplitItLogo } from '../components/ui/Logo';

const Home: React.FC = () => {
  // We get the list of trips and user info from the context (the Brain)
  const { trips, currencySymbol, userProfile, notifications } = useTrips();
  const ongoingTrips = trips.filter(t => t.status === 'ongoing');
  const pendingNotifsCount = notifications.length;

  return (
    <div className="p-6 space-y-8">
      <header className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <SplitItLogo size={40} />
            <div className="space-y-0">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white leading-tight">SplitIt</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Welcome, {userProfile.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick link to Friend Management */}
          <Link 
            href="/friends" 
            className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-brand-pink dark:hover:text-white transition-colors relative"
          >
            <UserPlus size={20} />
          </Link>
          {/* Link to view incoming requests */}
          <Link 
            href="/notifications" 
            className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-brand-pink dark:hover:text-white transition-colors relative"
          >
            <Bell size={20} />
            {pendingNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-pink text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-black animate-bounce">
                {pendingNotifsCount}
              </span>
            )}
          </Link>
          {/* User's profile circle - clickable to Settings */}
          <Link href="/settings" className="p-[2px] rounded-full bg-brand-gradient active:scale-95 transition-transform">
              <div 
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-black flex items-center justify-center text-white text-sm font-bold overflow-hidden"
                  style={{ backgroundColor: userProfile.avatarImage ? 'transparent' : userProfile.avatarColor }}
              >
                  {userProfile.avatarImage ? (
                      <img src={userProfile.avatarImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                      userProfile.name.charAt(0).toUpperCase()
                  )}
              </div>
          </Link>
        </div>
      </header>

      {/* Show this if there are no events started yet */}
      {ongoingTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 p-8">
          <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Calendar className="text-brand-pink" size={32} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No events yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Start a new event to track expenses.</p>
          <Link 
            href="/add-trip" 
            className="text-brand-pink font-bold text-sm hover:underline"
          >
            Create your event
          </Link>
        </div>
      ) : (
        /* List all ongoing group events */
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-widest">Ongoing</h2>
          {ongoingTrips.map(trip => (
            <Link 
              key={trip.id} 
              href={`/trip/${trip.id}`}
              className="block bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-lg shadow-neutral-100/50 dark:shadow-none border border-neutral-100 dark:border-neutral-800 active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-brand-gradient p-2.5 rounded-2xl text-white shadow-md shadow-orange-500/20">
                  <Calendar size={20} />
                </div>
                <ChevronRight className="text-neutral-300 dark:text-neutral-600" size={20} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{trip.name}</h3>
              <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                <Users size={14} className="mr-1.5" />
                <span>{trip.members.length} members</span>
                <span className="mx-2 text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-neutral-900 dark:text-white font-bold">
                  {currencySymbol}{trip.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;