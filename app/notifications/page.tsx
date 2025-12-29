'use client';

/**
 * The Notifications page shows you when someone else 
 * sends you a friend request or invites you to join an event.
 */
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTrips } from '@/context/TripContext';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Bell, Check, X, UserPlus, Clock, Calendar, RefreshCw } from 'lucide-react';

export default function Notifications() {
  const router = useRouter();
  // Get notifications and response functions from Brain (Context)
  const { notifications, respondToNotification } = useTrips();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Sorting logic: [PULL/SORT] Newest items from Turso show up at the top
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications]);

  /**
   * [PUSH POINT - TURSO CLOUD]
   * When you click Accept/Decline, we send that decision back to the Turso database.
   */
  const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setProcessingId(id);
    try {
      await respondToNotification(id, status);
    } catch (err) {
      console.error("Failed to respond to request", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-white dark:bg-black min-h-screen">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
      </header>

      <section className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-neutral-400">
            <Bell size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">New requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map(notif => {
              const isProcessing = processingId === notif.id;
              return (
                <div key={notif.id} className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === 'FRIEND_REQUEST' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-brand-orange/10 text-brand-orange'}`}>
                      {notif.type === 'FRIEND_REQUEST' ? <UserPlus size={24} /> : <Calendar size={24} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                        {notif.type === 'FRIEND_REQUEST' ? 'Friend Request' : 'Trip Invitation'}
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {notif.type === 'FRIEND_REQUEST' ? (
                          <>
                            <span className="font-bold text-neutral-900 dark:text-white">{notif.fromUsername}</span> wants to be friends.
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-neutral-900 dark:text-white">{notif.fromUsername}</span> invited you to <span className="italic font-bold">"{notif.tripName}"</span>.
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">
                        <Clock size={10} />
                        {new Date(notif.timestamp).toLocaleDateString()} at {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleRespond(notif.id, 'ACCEPTED')}
                      className="flex-1 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} 
                      {isProcessing ? 'Processing...' : (notif.type === 'TRIP_INVITATION' ? 'Join' : 'Confirm')}
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleRespond(notif.id, 'DECLINED')}
                      className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-2xl font-bold text-sm flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
