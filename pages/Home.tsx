import React from 'react';
import { Link } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { ChevronRight, Plane, Users } from 'lucide-react';

const Home: React.FC = () => {
  const { trips, currencySymbol, userProfile } = useTrips();
  const ongoingTrips = trips.filter(t => t.status === 'ongoing');

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hi, {userProfile.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ready for your next adventure?</p>
        </div>
        <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden"
            style={{ backgroundColor: userProfile.avatarImage ? 'transparent' : userProfile.avatarColor }}
        >
            {userProfile.avatarImage ? (
                <img src={userProfile.avatarImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
                userProfile.name.charAt(0).toUpperCase()
            )}
        </div>
      </header>

      {ongoingTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Plane className="text-blue-500 dark:text-blue-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No events yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Start a new event to track expenses.</p>
          <Link 
            to="/add-trip" 
            className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ongoing Events</h2>
          {ongoingTrips.map(trip => (
            <Link 
              key={trip.id} 
              to={`/trip/${trip.id}`}
              className="block bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-2 rounded-lg">
                  <Plane size={20} />
                </div>
                <ChevronRight className="text-slate-300 dark:text-slate-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{trip.name}</h3>
              <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                <Users size={14} className="mr-1.5" />
                <span>{trip.members.length} members</span>
                <span className="mx-2">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {currencySymbol}{trip.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} spent
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