'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTrips } from '@/context/TripContext';
import { User, DollarSign, Moon, Smartphone, Trash2, Sun, Monitor, AlertCircle, Camera, Upload, LogOut, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CurrencyCode, ThemeOption, CURRENCY_SYMBOLS } from '@/types';

export default function Settings() {
  const { userProfile, settings, trips, updateProfile, updateSettings, clearHistory, deleteTrip, logout } = useTrips();
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for profile edits
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempPhone, setTempPhone] = useState(userProfile.phoneNumber || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    setTempName(userProfile.name);
    setTempPhone(userProfile.phoneNumber || '');
  }, [userProfile.name, userProfile.phoneNumber]);

  const endedTrips = trips.filter(t => t.status === 'ended');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatarImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const handleDeleteTripClick = (tripId: string) => {
    setTripToDelete(tripId);
  };

  const confirmDeleteTrip = () => {
    if (tripToDelete) {
      deleteTrip(tripToDelete);
      setTripToDelete(null);
    }
  };

  const handleSaveProfile = () => {
    if (!tempName.trim()) return;
    setIsSavingProfile(true);
    updateProfile({ name: tempName, phoneNumber: tempPhone });
    
    // Simulate some saving feedback
    setTimeout(() => {
      setIsSavingProfile(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 600);
  };

  const isProfileChanged = tempName !== userProfile.name || tempPhone !== (userProfile.phoneNumber || '');

  return (
    <div className="p-6 space-y-8 dark:text-neutral-100 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <button 
          onClick={handleLogoutClick}
          className="p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/10"
          title="Log Out"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* Profile Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Profile</h2>
            {showSavedToast && (
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                    <Check size={10} /> Profile Updated
                </span>
            )}
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
                <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-2 border-neutral-100 dark:border-neutral-800 cursor-pointer"
                    style={{ backgroundColor: userProfile.avatarImage ? 'transparent' : userProfile.avatarColor }}
                    onClick={triggerFileInput}
                >
                    {userProfile.avatarImage ? (
                        <img src={userProfile.avatarImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        (tempName || 'U').charAt(0).toUpperCase()
                    )}
                </div>
                <button 
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 p-1.5 bg-neutral-900 text-white rounded-full border-2 border-white dark:border-neutral-900 shadow-sm"
                >
                    <Camera size={12} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Name</label>
                <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-0 py-1 bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none text-lg font-bold text-neutral-900 dark:text-white focus:border-brand-pink outline-none placeholder:text-neutral-300"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Phone</label>
                <input
                    type="tel"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-0 py-1 bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none text-sm font-medium text-neutral-900 dark:text-white focus:border-brand-pink outline-none placeholder:text-neutral-300"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-neutral-50 dark:border-neutral-800/50">
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {['#ec4899', '#f97316', '#a855f7', '#3b82f6', '#10b981'].map(color => (
                      <button
                          key={color}
                          onClick={() => updateProfile({ avatarColor: color })}
                          className={`w-6 h-6 rounded-full border transition-transform shrink-0 ${userProfile.avatarColor === color ? 'border-neutral-900 dark:border-white scale-125' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                      />
                  ))}
              </div>

              <Button 
                variant="primary" 
                className={`py-1.5 px-4 text-xs ${!isProfileChanged ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                onClick={handleSaveProfile}
                disabled={!isProfileChanged || isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Preferences</h2>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-8">
          
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-4">Currency</label>
            <div className="grid grid-cols-3 gap-3">
                {(Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[]).map((code) => (
                    <button
                        key={code}
                        onClick={() => updateSettings({ currency: code })}
                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all border-2 ${
                            settings.currency === code 
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-md transform scale-[1.02]' 
                            : 'bg-white dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 border-neutral-100 dark:border-neutral-800 hover:border-brand-pink/30 hover:bg-brand-pink/5'
                        }`}
                    >
                        <span className="text-xl font-bold mb-1">{CURRENCY_SYMBOLS[code]}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{code}</span>
                    </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-3">Theme</label>
            <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'system', icon: Monitor, label: 'Auto' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => updateSettings({ theme: option.id as ThemeOption })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                            settings.theme === option.id 
                            ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' 
                            : 'text-neutral-500'
                        }`}
                    >
                        <option.icon size={14} />
                        {option.label}
                    </button>
                ))}
            </div>
          </div>

        </div>
      </section>

      {/* History Management Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Data</h2>
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            {endedTrips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">{trip.name}</span>
                    <button 
                        onClick={() => handleDeleteTripClick(trip.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            {endedTrips.length === 0 && (
                <div className="p-4 text-center text-sm text-neutral-400">No ended events.</div>
            )}
            <button 
                onClick={() => setIsClearHistoryModalOpen(true)}
                className="w-full p-4 text-left text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t border-neutral-100 dark:border-neutral-800"
            >
                Clear History
            </button>
        </div>
      </section>

      <div className="pt-4">
          <Button variant="secondary" fullWidth onClick={handleLogoutClick} className="text-red-500 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
              Log Out
          </Button>
      </div>

      <Modal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        title="Clear History?"
      >
        <div className="flex flex-col items-center text-center mb-6">
            <p className="text-neutral-600 dark:text-neutral-300">
                Permanently delete all ended events?
            </p>
        </div>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsClearHistoryModalOpen(false)}>Cancel</Button>
            <Button 
                variant="danger" 
                fullWidth 
                onClick={() => {
                    clearHistory();
                    setIsClearHistoryModalOpen(false);
                }}
            >
                Clear All
            </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log Out?"
      >
        <div className="flex flex-col items-center text-center mb-6">
            <p className="text-neutral-600 dark:text-neutral-300">
                Are you sure you want to log out?
            </p>
        </div>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
            <Button 
                variant="danger" 
                fullWidth 
                onClick={confirmLogout}
            >
                Log Out
            </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        title="Delete Event?"
      >
        <div className="flex flex-col items-center text-center mb-6">
            <p className="text-neutral-600 dark:text-neutral-300">
                Are you sure you want to permanently delete this event?
            </p>
        </div>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setTripToDelete(null)}>Cancel</Button>
            <Button 
                variant="danger" 
                fullWidth 
                onClick={confirmDeleteTrip}
            >
                Delete
            </Button>
        </div>
      </Modal>

      <div className="text-center text-xs text-neutral-400 mt-8 font-mono">
        v2.1.0
      </div>
    </div>
  );
}