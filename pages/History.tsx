import React from 'react';
import { Link } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { CheckCircle, Calendar } from 'lucide-react';

const History: React.FC = () => {
  const { trips, currencySymbol } = useTrips();
  const endedTrips = trips.filter(t => t.status === 'ended');

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event History</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Past events and expenses</p>
      </header>

      {endedTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
          <HistoryIcon className="mb-4 opacity-50" size={48} />
          <p>No ended events yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {endedTrips.map(trip => (
            <Link 
              key={trip.id} 
              to={`/trip/${trip.id}`}
              className="block bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-80"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{trip.name}</h3>
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
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
};

const HistoryIcon = ({ className, size }: { className?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/></svg>
)

export default History;