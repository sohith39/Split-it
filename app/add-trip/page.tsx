'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrips } from '@/context/TripContext';
import { Button } from '@/components/ui/Button';
import { Plus, X, User } from 'lucide-react';

export default function AddTrip() {
  const router = useRouter();
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
      router.push('/');
    }
  };

  const isSelfAdded = members.includes(userProfile.name);

  return (
    <div className="p-6 min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">New Event</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-xs font-bold text-neutral-400 uppercase">Event Name</label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Summer Roadtrip 2024"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
            required
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-neutral-400 uppercase">Members</label>
          
          {!isSelfAdded && (
            <button
                type="button"
                onClick={handleAddSelf}
                className="flex items-center gap-3 w-full p-3 rounded-2xl bg-brand-pink/10 border border-brand-pink/20 text-brand-pink hover:bg-brand-pink/20 transition-colors text-left group active:scale-[0.98]"
            >
                <div className="w-10 h-10 rounded-full bg-brand-pink text-white flex items-center justify-center shadow-sm">
                    <User size={20} />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold">Add Me</div>
                    <div className="text-xs opacity-80">Join as {userProfile.name}</div>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-full p-1 text-brand-pink shadow-sm">
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
              className="flex-1 px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
            />
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!currentMember.trim()}
              className="bg-neutral-900 dark:bg-white text-white dark:text-black w-14 rounded-2xl disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
            >
              <Plus size={24} />
            </button>
          </div>
          
          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {members.map(member => (
                <span 
                    key={member} 
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border shadow-sm transition-all ${
                        member === userProfile.name 
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white' 
                        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                    }`}
                >
                  {member}
                  <button type="button" onClick={() => handleRemoveMember(member)} className="hover:opacity-70">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
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
}