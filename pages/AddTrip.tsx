import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { Button } from '../components/ui/Button';
import { Plus, X, User } from 'lucide-react';

const AddTrip: React.FC = () => {
  const navigate = useNavigate();
  const { addTrip, userProfile } = useTrips();
  
  const [tripName, setTripName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [currentMember, setCurrentMember] = useState('');

  const handleAddMember = () => {
    if (currentMember.trim() && !members.includes(currentMember.trim())) {
      setMembers([...members, currentMember.trim()]);
      setCurrentMember('');
    }
  };

  const handleAddSelf = () => {
    if (userProfile.name && !members.includes(userProfile.name)) {
        setMembers([userProfile.name, ...members]);
    }
  };

  const handleRemoveMember = (member: string) => {
    setMembers(members.filter(m => m !== member));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tripName && members.length > 0) {
      addTrip(tripName, members);
      navigate('/');
    }
  };

  const isSelfAdded = members.includes(userProfile.name);

  return (
    <div className="p-6 min-h-full">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Event</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Create a group to split costs.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Event Name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Summer Roadtrip 2024"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none placeholder:text-slate-400"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Members</label>
          
          {/* Add Me Option */}
          {!isSelfAdded && (
            <button
                type="button"
                onClick={handleAddSelf}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left group active:scale-[0.98]"
            >
                <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-200 shadow-sm">
                    <User size={16} />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold">Add Me</div>
                    <div className="text-xs opacity-80">Join as {userProfile.name}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-full p-1 text-blue-600 dark:text-blue-400 shadow-sm">
                    <Plus size={16} />
                </div>
            </button>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add another member..."
              value={currentMember}
              onChange={(e) => setCurrentMember(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!currentMember.trim()}
              className="bg-slate-900 dark:bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-blue-700 active:scale-95 transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>
          
          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              {members.map(member => (
                <span 
                    key={member} 
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm transition-all ${
                        member === userProfile.name 
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  {member === userProfile.name && <User size={12} className="mr-1" />}
                  {member}
                  <button type="button" onClick={() => handleRemoveMember(member)} className="ml-1 hover:opacity-70 p-0.5">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {members.length === 0 && (
            <p className="text-xs text-slate-400 italic">At least one member is required.</p>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth disabled={!tripName || members.length === 0}>
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTrip;