import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { Button } from '../components/ui/Button';
import { Camera } from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useTrips();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(userProfile.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');

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

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      updateProfile({ name, phoneNumber });
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-white dark:bg-black transition-colors">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Setup Profile</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Let others recognize you</p>
        </div>

        <form onSubmit={handleComplete} className="space-y-8">
          
          {/* Avatar Selection */}
          <div className="flex flex-col items-center gap-4">
             <div className="relative group">
                <div 
                    className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-4 border-neutral-50 dark:border-neutral-900 shadow-xl cursor-pointer"
                    style={{ backgroundColor: userProfile.avatarImage ? 'transparent' : userProfile.avatarColor }}
                    onClick={triggerFileInput}
                >
                    {userProfile.avatarImage ? (
                        <img src={userProfile.avatarImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        (name || 'U').charAt(0).toUpperCase()
                    )}
                </div>
                <button 
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute bottom-1 right-1 p-2.5 bg-neutral-900 text-white rounded-full border-4 border-white dark:border-black shadow-sm"
                >
                    <Camera size={16} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            
            <div className="flex gap-2 justify-center">
              {['#ec4899', '#f97316', '#a855f7', '#3b82f6', '#10b981'].map(color => (
                  <button
                      type="button"
                      key={color}
                      onClick={() => updateProfile({ avatarColor: color })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform shrink-0 ${userProfile.avatarColor === color ? 'border-neutral-900 dark:border-white scale-125' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                  />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Username</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+1 234 567 890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 transition-all outline-none placeholder:text-neutral-400 font-medium text-lg"
              />
            </div>
          </div>

          <Button type="submit" fullWidth>
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;