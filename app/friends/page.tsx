'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTrips } from '@/context/TripContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Search, UserPlus, UserMinus, User, Check, RefreshCw, X, Info } from 'lucide-react';

export default function Friends() {
  const router = useRouter();
  const { friends, searchUsers, sendFriendRequest, removeFriend, refreshFriendsAndNotifications } = useTrips();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [friendToRequest, setFriendToRequest] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions - Now includes everyone except current user
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSuggestions(results);
        setIsSearching(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchUsers]);

  // Handle clicks outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = searchQuery.trim();
    if (!targetName) return;
    setFriendToRequest(targetName);
    setShowSuggestions(false);
  };

  const confirmSendRequest = async () => {
    if (!friendToRequest) return;
    setIsPending(true);
    setError('');
    setSuccess('');
    
    try {
      await sendFriendRequest(friendToRequest);
      setSuccess(`Friend request sent to ${friendToRequest}`);
      setSearchQuery('');
      setFriendToRequest(null);
    } catch (err: any) {
      setError(err.message || "Could not find user.");
      setFriendToRequest(null);
    } finally {
      setIsPending(false);
    }
  };

  const selectSuggestion = (name: string) => {
    setSearchQuery(name);
    setShowSuggestions(false);
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    try {
      await removeFriend(friendToRemove);
      setFriendToRemove(null);
    } catch (err) {
      console.error("Failed to remove friend", err);
    }
  };

  const isAlreadyFriend = (name: string) => friends.some(f => f.username === name);

  return (
    <div className="p-6 space-y-8 bg-white dark:bg-black min-h-screen">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Friends</h1>
        <button onClick={refreshFriendsAndNotifications} className="ml-auto p-2 text-neutral-400 hover:text-brand-pink transition-colors">
          <RefreshCw size={18} />
        </button>
      </header>

      {/* Add Friend Search */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Add Friend</h2>
        <div className="relative" ref={dropdownRef}>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search username or phone..."
                value={searchQuery}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isPending || !searchQuery.trim()}
              title="Add Friend"
              className="px-6 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center min-w-[64px] shadow-sm"
            >
              {isPending ? <RefreshCw className="animate-spin" size={20} /> : <UserPlus size={20} />}
            </button>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-16 mt-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center gap-2 text-neutral-400 text-sm">
                  <RefreshCw size={14} className="animate-spin" />
                  Looking for users...
                </div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto">
                  {suggestions.map((name, i) => {
                    const exists = isAlreadyFriend(name);
                    return (
                      <button
                        key={name}
                        onClick={() => selectSuggestion(name)}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b last:border-0 border-neutral-50 dark:border-neutral-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${exists ? 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800' : 'bg-brand-pink/10 text-brand-pink'}`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-bold ${exists ? 'text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                            {name}
                          </span>
                        </div>
                        {exists && (
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight bg-neutral-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-100 dark:border-neutral-700">Friend</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div className="text-xs text-red-500 font-bold px-1 flex items-center gap-2 animate-in slide-in-from-left-2">
            <Info size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="text-xs text-green-500 font-bold px-1 flex items-center gap-2 animate-in slide-in-from-left-2">
            <Check size={14} /> {success}
          </div>
        )}
      </section>

      {/* Friends List */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Your Friends ({friends.length})</h2>
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
              <User size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Connect with others to split expenses.</p>
            </div>
          ) : (
            friends.map(friend => (
              <div key={friend.username} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-transform active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-neutral-50 dark:border-neutral-800 shadow-inner"
                    style={{ backgroundColor: friend.avatarImage ? 'transparent' : friend.avatarColor }}
                  >
                    {friend.avatarImage ? (
                      <img src={friend.avatarImage} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      friend.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">{friend.username}</h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Mutual Connection</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFriendToRemove(friend.username)}
                  className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!friendToRemove}
        onClose={() => setFriendToRemove(null)}
        title="Remove Friend?"
      >
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full">
            <UserMinus size={32} />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Removing <strong>{friendToRemove}</strong> will disconnect your accounts. You'll need to send a new request to reconnect.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setFriendToRemove(null)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleRemoveFriend}>Remove Friend</Button>
        </div>
      </Modal>

      {/* Send Request Confirmation Modal */}
      <Modal
        isOpen={!!friendToRequest}
        onClose={() => setFriendToRequest(null)}
        title="Send Request?"
      >
        <div className="flex flex-col items-center gap-4 text-center mb-6">
          <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-full">
            <UserPlus size={32} />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Send request to <strong>{friendToRequest}</strong>?
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setFriendToRequest(null)}>No</Button>
          <Button variant="primary" fullWidth onClick={confirmSendRequest}>Yes</Button>
        </div>
      </Modal>
    </div>
  );
}
