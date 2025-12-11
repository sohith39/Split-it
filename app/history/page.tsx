'use client';

import React from 'react';
import Link from 'next/link';
import { useTrips } from '@/context/TripContext';
import { CheckCircle, Calendar } from 'lucide-react';

export default function History() {
  const { trips, currencySymbol } = useTrips();
  const endedTrips = trips.filter(t => t.status === 'ended');

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">History</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Past events and expenses</p>
      </header>

      {endedTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400 dark:text-neutral-600">
          <p className="font-medium">No ended events yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {endedTrips.map(trip => (
            <Link 
              key={trip.id} 
              href={`/trip/${trip.id}`}
              className="block bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">{trip.name}</h3>
                <CheckCircle size={18} className="text-brand-pink" />
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(trip.endedAt || trip.createdAt).toLocaleDateString()}
                </span>
                <span>Total: {currencySymbol}{trip.expenses.reduce((a, b) => a + b.amount, 0).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}