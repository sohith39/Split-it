'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTrips } from '@/context/TripContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, X, User, UserPlus, Check, Users, Search, Sparkles, RefreshCw } from 'lucide-react';

export default function AddTrip() {
  const router = useRouter();
  const { addTrip, userProfile, friends, inviteFriendToTrip, forceSync } = useTrips();
  
  const [tripName, setTripName] = useState('');
  // 'members' strictly refers to local guest members + current user
  const [members, setMembers] = useState<string[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [currentMember, setCurrentMember] = useState('');
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Auto-add the current user to the trip on mount
  useEffect(() => {
    if (userProfile.name && !members.includes(userProfile.name)) {
      setMembers(prev => Array.from(new Set([userProfile.name, ...prev])));
    }
  }, [userProfile.name]);

  const handleAddGuest = () => {
    const name = currentMember.trim();
    if (name && !members.includes(name) && !invitedFriends.includes(name)) {
      setMembers([...members, name]);
      setCurrentMember('');
    }
  };

  const handleAddSelf = () => {
    if (userProfile.name && !members.includes(userProfile.name)) {
        setMembers([userProfile.name, ...members]);
    }
  };

  const toggleFriend = (friendName: string) => {
    if (invitedFriends.includes(friendName)) {
      setInvitedFriends(invitedFriends.filter(f => f !== friendName));
    } else {
      setInvitedFriends([...invitedFriends, friendName]);
      // Ensure they aren't also in the manual guest list
      setMembers(members.filter(m => m !== friendName));
    }
  };

  const handleRemoveMember = (member: string) => {
    setMembers(members.filter(m => m !== member));
  };

  const handleUninviteFriend = (friendName: string) => {
    setInvitedFriends(invitedFriends.filter(f => f !== friendName));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tripName && members.length > 0 && !isCreating) {
      setIsCreating(true);
      try {
        // 1. Add the trip locally and start immediate sync
        const newTrip = await addTrip(tripName, members);
        
        // 2. Send invitations to actual accounts
        for (const friend of invitedFriends) {
          try {
            await inviteFriendToTrip(friend, newTrip.id, tripName);
          } catch (err) {
            console.error(`Failed to invite ${friend}:`, err);
          }
        }

        // 3. Final verification sync before dashboard redirect
        await forceSync();

        router.push('/');
      } catch (err) {
        console.error("Failed to create event:", err);
        setIsCreating(false);
      }
    }
  };

  const isSelfAdded = members.includes(userProfile.name);
  const filteredFriends = friends.filter(f => 
    f.username.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="p-6 min-h-full bg-white dark:bg-black">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">New Event</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 pb-32">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">Event Title</label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Summer Roadtrip 2024"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full px-4 py-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/10 transition-all outline-none placeholder:text-neutral-400 font-bold text-lg shadow-sm"
            required
            autoFocus
          />
        </div>

        {/* Friend Selection Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">Co-Owners (Cloud)</label>
          <button
            type="button"
            onClick={() => setIsFriendModalOpen(true)}
            className="flex items-center gap-3 w-full p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="p-2.5 bg-brand-pink/10 text-brand-pink rounded-xl shadow-inner">
              <Users size={22} />
            </div>
            <span className="flex-1 font-bold text-sm text-left">Invite Friends</span>
            {invitedFriends.length > 0 && (
              <div className="bg-brand-pink text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-in slide-in-from-right-2">
                {invitedFriends.length} invited
              </div>
            )}
          </button>
          
          {invitedFriends.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {invitedFriends.map(friend => (
                <span key={friend} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
                  {friend}
                  <button type="button" onClick={() => handleUninviteFriend(friend)} className="hover:opacity-70"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-neutral-400 font-medium px-1">Invited friends join the split only after accepting the invitation.</p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest">Guest Members (Immediate)</label>
          
          {!isSelfAdded && (
            <button
                type="button"
                onClick={handleAddSelf}
                className="flex items-center gap-3 w-full p-4 rounded-2xl bg-brand-pink/5 border border-brand-pink/20 text-brand-pink hover:bg-brand-pink/10 transition-colors text-left active:scale-[0.98] animate-in slide-in-from-left-2 shadow-sm"
            >
                <div className="w-10 h-10 rounded-full bg-brand-pink text-white flex items-center justify-center shadow-md">
                    <User size={20} />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold">Include Myself</div>
                    <div className="text-[10px] opacity-70">Add you to the members list immediately</div>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-full p-1 shadow-sm">
                    <Plus size={16} />
                </div>
            </button>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Guest member name..."
              value={currentMember}
              onChange={(e) => setCurrentMember(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGuest())}
              className="flex-1 px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium shadow-sm"
            />
            <button
              type="button"
              onClick={handleAddGuest}
              disabled={!currentMember.trim()}
              className="bg-neutral-900 dark:bg-white text-white dark:text-black w-14 rounded-2xl disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              <Plus size={24} />
            </button>
          </div>
          
          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in">
              {members.map(member => {
                const isSelf = member === userProfile.name;
                return (
                  <span 
                      key={member} 
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border shadow-sm transition-all ${
                          isSelf 
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white' 
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                      }`}
                  >
                    {member}
                    {!isSelf && (
                      <button type="button" onClick={() => handleRemoveMember(member)} className="hover:opacity-70 p-0.5">
                        <X size={14} />
                      </button>
                    )}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="pt-8">
            <Button 
                type="submit" 
                fullWidth 
                disabled={!tripName || members.length === 0 || isCreating}
                className="flex items-center justify-center gap-3 py-5 text-lg shadow-2xl transition-transform hover:scale-[1.02]"
            >
                {isCreating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {isCreating ? 'Creating Event...' : 'Create Event Now'}
            </Button>
        </div>
      </form>

      {/* Friend Selection Modal */}
      <Modal
        isOpen={isFriendModalOpen}
        onClose={() => setIsFriendModalOpen(false)}
        title="Invite Co-Owners"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input 
              type="text"
              placeholder="Search connections..."
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm outline-none focus:border-brand-pink transition-colors shadow-inner"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-none pr-1">
            {friends.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs font-medium italic border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl p-4">
                    Go to Friends to add connections first!
                </div>
            ) : filteredFriends.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs font-medium italic border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl p-4">
                No friends match your search.
              </div>
            ) : (
              filteredFriends.map(friend => {
                const isSelected = invitedFriends.includes(friend.username);
                return (
                  <button
                    key={friend.username}
                    type="button"
                    onClick={() => toggleFriend(friend.username)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${isSelected ? 'bg-brand-pink/10 border-brand-pink shadow-md' : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-brand-pink/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: friend.avatarColor }}
                      >
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-brand-pink' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {friend.username}
                      </span>
                    </div>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-pink text-white scale-110 shadow-sm' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300'}`}>
                      {isSelected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="pt-2">
            <Button variant="primary" fullWidth onClick={() => setIsFriendModalOpen(false)} className="shadow-lg">
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}