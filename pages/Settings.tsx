import React, { useState, useRef } from 'react';
import { useTrips } from '../context/TripContext';
import { User, DollarSign, Moon, Smartphone, Trash2, Sun, Monitor, AlertCircle, Camera, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CurrencyCode, ThemeOption, CURRENCY_SYMBOLS } from '../types';

const Settings: React.FC = () => {
  const { userProfile, settings, trips, updateProfile, updateSettings, clearHistory, deleteTrip } = useTrips();
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="p-6 space-y-8 dark:text-slate-100">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Customize your experience</p>
      </header>

      {/* Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
          <User size={20} className="text-blue-500" />
          <h2>Profile</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
                <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-2 border-slate-100 dark:border-slate-800 cursor-pointer"
                    style={{ backgroundColor: userProfile.avatarImage ? 'transparent' : userProfile.avatarColor }}
                    onClick={triggerFileInput}
                >
                    {userProfile.avatarImage ? (
                        <img src={userProfile.avatarImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        userProfile.name.charAt(0).toUpperCase()
                    )}
                </div>
                <button 
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full border-2 border-white dark:border-slate-900 shadow-sm hover:bg-blue-600 transition-colors"
                >
                    <Camera size={14} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Your Name"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg border-none text-sm focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                type="tel"
                value={userProfile.phoneNumber}
                onChange={(e) => updateProfile({ phoneNumber: e.target.value })}
                placeholder="Phone Number"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-lg border-none text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {!userProfile.avatarImage && (
            <div className="flex gap-2 justify-end pt-2">
                <span className="text-xs text-slate-400 self-center mr-2">Default Color:</span>
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                        key={color}
                        onClick={() => updateProfile({ avatarColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${userProfile.avatarColor === color ? 'border-slate-400 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
          )}
          {userProfile.avatarImage && (
              <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => updateProfile({ avatarImage: undefined })}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                      Remove Picture
                  </button>
              </div>
          )}
        </div>
      </section>

      {/* Currency Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
          <DollarSign size={20} className="text-emerald-500" />
          <h2>Currency</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-3">Select Default Currency</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {(Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[]).map((code) => (
                <button
                    key={code}
                    onClick={() => updateSettings({ currency: code })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                        settings.currency === code 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                    <span className="text-xl font-bold mb-1">{CURRENCY_SYMBOLS[code]}</span>
                    <span className="text-xs font-semibold">{code}</span>
                </button>
            ))}
          </div>
        </div>
      </section>

      {/* Theme Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
          <Moon size={20} className="text-indigo-500" />
          <h2>Theme</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex">
            {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'Default' },
            ].map((option) => (
                <button
                    key={option.id}
                    onClick={() => updateSettings({ theme: option.id as ThemeOption })}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                        settings.theme === option.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <option.icon size={20} />
                    {option.label}
                </button>
            ))}
        </div>
      </section>

      {/* History Management Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
          <Trash2 size={20} className="text-red-500" />
          <h2>Manage History</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            {endedTrips.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-2">No history to manage.</div>
            ) : (
                <div className="space-y-2">
                    {endedTrips.map(trip => (
                        <div key={trip.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{trip.name}</span>
                            <button 
                                onClick={() => deleteTrip(trip.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                         <Button 
                            variant="danger" 
                            fullWidth 
                            onClick={() => setIsClearHistoryModalOpen(true)}
                         >
                            Clear All History
                         </Button>
                    </div>
                </div>
            )}
        </div>
      </section>

      <Modal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        title="Clear History?"
      >
        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={24} />
            </div>
            <p className="text-slate-600 dark:text-slate-300">
                This will permanently delete all ended events from your history. This action cannot be undone.
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

      <div className="text-center text-xs text-slate-400 mt-8">
        EventSplitter v1.2.0
      </div>
    </div>
  );
};

export default Settings;