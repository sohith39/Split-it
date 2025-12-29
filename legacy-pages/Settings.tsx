import React, { useState, useRef, useEffect } from 'react';
import { useTrips } from '../context/TripContext';
import { Camera, DollarSign, Moon, Smartphone, Trash2, Sun, Monitor, LogOut, Save, Check, Cloud, CloudOff, RefreshCw, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CurrencyCode, ThemeOption, CURRENCY_SYMBOLS } from '../types';

const Settings: React.FC = () => {
  const { 
    userProfile, settings, trips, cloudStatus, lastSyncedAt, cloudId,
    updateProfile, updateSettings, logout, forceSync, changePassword
  } = useTrips();
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaveConfirmModalOpen, setIsSaveConfirmModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for profile edits (Draft state)
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempPhone, setTempPhone] = useState(userProfile.phoneNumber || '');
  const [tempAvatarColor, setTempAvatarColor] = useState(userProfile.avatarColor);
  const [tempAvatarImage, setTempAvatarImage] = useState(userProfile.avatarImage);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);

  // Sync local state when global userProfile (from context/cloud) changes
  useEffect(() => {
    setTempName(userProfile.name);
    setTempPhone(userProfile.phoneNumber || '');
    setTempAvatarColor(userProfile.avatarColor);
    setTempAvatarImage(userProfile.avatarImage);
  }, [userProfile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatarImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveClick = () => {
    if (!tempName.trim()) return;
    setIsSaveConfirmModalOpen(true);
  };

  const confirmSaveProfile = async () => {
    setIsSaveConfirmModalOpen(false);
    setIsSavingProfile(true);
    
    try {
        // 1. Commit draft to global state (triggers context logic)
        updateProfile({ 
          name: tempName, 
          phoneNumber: tempPhone,
          avatarColor: tempAvatarColor,
          avatarImage: tempAvatarImage
        });
        
        // 2. Force immediate sync to Turso DB
        await forceSync();
        
        setIsSavingProfile(false);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
    } catch (error) {
        console.error("Failed to save profile:", error);
        setIsSavingProfile(false);
        alert("Connection error. Changes saved locally but couldn't reach the database.");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters.');
        return;
    }
    if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
    }

    setIsChangingPassword(true);
    try {
        await changePassword(currentPassword, newPassword);
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordToast(true);
        setTimeout(() => setShowPasswordToast(false), 3000);
    } catch (err: any) {
        setPasswordError(err.message || 'Failed to update password.');
    } finally {
        setIsChangingPassword(false);
    }
  };

  const isProfileChanged = 
    tempName !== userProfile.name || 
    tempPhone !== (userProfile.phoneNumber || '') ||
    tempAvatarColor !== userProfile.avatarColor ||
    tempAvatarImage !== userProfile.avatarImage;

  const formatLastSynced = () => {
    if (!lastSyncedAt) return 'Never';
    const seconds = Math.floor((Date.now() - lastSyncedAt) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // The 15 supported currency codes
  const currencyOptions: CurrencyCode[] = [
    'USD', 'EUR', 'GBP', 'INR', 'AUD', 
    'CAD', 'AED', 'SAR', 'JPY', 'CNY', 
    'ZAR', 'NGN', 'BRL', 'ARS', 'SGD'
  ];

  return (
    <div className="p-6 space-y-8 dark:text-neutral-100 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          <LogOut size={24} />
        </button>
      </header>

      {/* Cloud Sync Status */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Database Sync</h2>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${cloudStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-brand-pink/10 text-brand-pink'}`}>
                {cloudStatus === 'syncing' ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : cloudStatus === 'error' ? (
                  <CloudOff size={24} />
                ) : (
                  <Cloud size={24} />
                )}
              </div>
              <div>
                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                  {cloudStatus === 'error' ? 'Sync Error' : 'Cloud Connected'}
                  {cloudStatus === 'synced' && <Check size={14} className="text-green-500" />}
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">
                  {cloudStatus === 'syncing' ? 'Syncing changes...' : `Last sync: ${formatLastSynced()}`}
                </div>
              </div>
            </div>
            <button onClick={forceSync} disabled={cloudStatus === 'syncing'} className="p-2 text-neutral-400 hover:text-brand-pink disabled:opacity-30">
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="pt-3 border-t border-neutral-50 dark:border-neutral-800/50 flex justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">System ID</span>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">{cloudId}</span>
          </div>
        </div>
      </section>

      {/* Profile Section with Save Button */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Profile Identity</h2>
            {showSavedToast && (
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                    <Check size={10} /> Saved to Database
                </span>
            )}
        </div>
        
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-2 border-neutral-100 dark:border-neutral-800 shadow-inner cursor-pointer"
                    style={{ backgroundColor: tempAvatarImage ? 'transparent' : tempAvatarColor }}
                    onClick={triggerFileInput}
                >
                    {tempAvatarImage ? (
                        <img src={tempAvatarImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        (tempName || 'U').charAt(0).toUpperCase()
                    )}
                </div>
                <button 
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 p-1.5 bg-neutral-900 text-white rounded-full border-2 border-white dark:border-neutral-900 shadow-sm"
                >
                    <Camera size={14} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Username</label>
                <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-0 py-1 bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none text-base font-bold text-neutral-900 dark:text-white focus:border-brand-pink outline-none"
                    placeholder="Enter username"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Phone Number</label>
                <input
                    type="tel"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    className="w-full px-0 py-1 bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none text-xs font-medium text-neutral-900 dark:text-white focus:border-brand-pink outline-none"
                    placeholder="Enter phone"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-neutral-50 dark:border-neutral-800/50">
              <div className="flex gap-2">
                  {['#ec4899', '#f97316', '#a855f7', '#3b82f6', '#10b981'].map(color => (
                      <button
                          key={color}
                          onClick={() => setTempAvatarColor(color)}
                          className={`w-6 h-6 rounded-full border transition-transform ${tempAvatarColor === color ? 'border-neutral-900 dark:border-white scale-125 shadow-md' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                      />
                  ))}
              </div>

              <Button 
                variant="primary" 
                className={`py-2 px-5 text-xs flex items-center gap-2 shadow-md transition-all ${!isProfileChanged ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                onClick={handleSaveClick}
                disabled={!isProfileChanged || isSavingProfile}
              >
                {isSavingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Security</h2>
            {showPasswordToast && (
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                    <ShieldCheck size={10} /> Password Updated
                </span>
            )}
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500">
                    <Lock size={20} />
                </div>
                <div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">Account Password</div>
                    <div className="text-[10px] text-neutral-500 font-medium">Keep your account secure</div>
                </div>
            </div>
            <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-xs font-bold text-brand-pink hover:underline px-4 py-2 bg-brand-pink/5 rounded-xl transition-colors"
            >
                Change Password
            </button>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Preferences</h2>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-3">Currency</label>
            <div className="grid grid-cols-3 gap-2">
                {currencyOptions.map((code) => (
                    <button
                        key={code}
                        onClick={() => updateSettings({ currency: code })}
                        className={`py-3 px-1 rounded-xl text-[10px] font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                            settings.currency === code 
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white shadow-sm' 
                            : 'bg-white dark:bg-neutral-900 text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:border-brand-pink/20'
                        }`}
                    >
                        <span className="text-sm">{CURRENCY_SYMBOLS[code]}</span>
                        <span>{code}</span>
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
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* Confirmation Modals */}
      <Modal
        isOpen={isSaveConfirmModalOpen}
        onClose={() => setIsSaveConfirmModalOpen(false)}
        title="Save Profile Changes?"
      >
        <div className="text-center mb-6">
            <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                This will update your profile across the cloud. Your friends will see your updated name and avatar.
            </p>
        </div>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsSaveConfirmModalOpen(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={confirmSaveProfile}>Update Cloud</Button>
        </div>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
            setIsPasswordModalOpen(false);
            setPasswordError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }}
        title="Change Password"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Current Password</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:border-brand-pink outline-none mt-1"
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase">New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:border-brand-pink outline-none mt-1"
                />
            </div>
            <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Confirm New Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:border-brand-pink outline-none mt-1"
                />
            </div>

            {passwordError && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 p-2.5 rounded-lg border border-red-100 dark:border-red-900/20">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{passwordError}</span>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button 
                    type="button" 
                    variant="secondary" 
                    fullWidth 
                    onClick={() => setIsPasswordModalOpen(false)}
                    disabled={isChangingPassword}
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    variant="primary" 
                    fullWidth 
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                    {isChangingPassword ? <RefreshCw size={16} className="animate-spin" /> : 'Update'}
                </Button>
            </div>
        </form>
      </Modal>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Sign Out?"
      >
        <p className="text-neutral-600 dark:text-neutral-300 text-sm text-center mb-6">Are you sure you want to end your current session?</p>
        <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={logout}>Sign Out</Button>
        </div>
      </Modal>

      <div className="text-center text-[10px] text-neutral-400 font-mono tracking-widest pt-4">v3.1.0-STABLE</div>
    </div>
  );
};

export default Settings;