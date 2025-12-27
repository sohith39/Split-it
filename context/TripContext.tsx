
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Trip, Expense, UserProfile, AppSettings, CURRENCY_SYMBOLS, AppData, CloudSyncStatus, Friend, Notification } from '../types';
import { cloudService } from '../services/CloudService';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

interface TripContextType {
  trips: Trip[];
  friends: Friend[];
  notifications: Notification[];
  sentNotifications: Notification[];
  userProfile: UserProfile;
  settings: AppSettings;
  currencySymbol: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  cloudStatus: CloudSyncStatus;
  lastSyncedAt?: number;
  cloudId?: string;
  login: (username: string, password?: string, isSignUp?: boolean, phoneNumber?: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  addTrip: (name: string, members: string[]) => Promise<Trip>;
  addMemberToTrip: (tripId: string, member: string) => void;
  removeMemberFromTrip: (tripId: string, member: string) => Promise<void>;
  addExpense: (tripId: string, expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  updateExpense: (tripId: string, expense: Expense) => void;
  deleteExpense: (tripId: string, expenseId: string) => void;
  endTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  getTrip: (id: string) => Trip | undefined;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  forceSync: () => Promise<void>;
  searchUsers: (query: string) => Promise<string[]>;
  sendFriendRequest: (username: string) => Promise<void>;
  inviteFriendToTrip: (friendUsername: string, tripId: string, tripName: string) => Promise<void>;
  respondToNotification: (notificationId: string, status: 'ACCEPTED' | 'DECLINED') => Promise<void>;
  removeFriend: (username: string) => Promise<void>;
  refreshFriendsAndNotifications: () => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);
const STORAGE_KEY = 'trip_splitter_data_v3';

const DEFAULT_PROFILE: UserProfile = { name: '', phoneNumber: '', avatarColor: '#3b82f6' };
const DEFAULT_SETTINGS: AppSettings = { currency: 'INR', theme: 'system' };

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>({ 
    isAuthenticated: false, trips: [], profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS,
    friends: [], notifications: [], sentNotifications: [], cloudId: '', lastSyncedAt: undefined
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('idle');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData({
          ...parsed,
          isAuthenticated: parsed.isAuthenticated || false,
          profile: { ...DEFAULT_PROFILE, ...parsed.profile },
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        });
      }
    } catch (e) {
      console.error("Failed to load local storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, isLoading]);

  const refreshFriendsAndNotifications = useCallback(async () => {
    if (!data.isAuthenticated || !data.profile.name) return;
    const cloudData = await cloudService.fetchUserData(data.profile.name);
    if (cloudData) setData(cloudData);
  }, [data.isAuthenticated, data.profile.name]);

  useEffect(() => {
    if (isLoading || !data.isAuthenticated) return;
    const timeoutId = setTimeout(async () => {
      setCloudStatus('syncing');
      const success = await cloudService.syncToCloud(data);
      if (success) {
        setCloudStatus('synced');
        setData(prev => ({ ...prev, lastSyncedAt: Date.now() }));
      } else {
        setCloudStatus('error');
      }
      setTimeout(() => setCloudStatus('idle'), 2000);
    }, 5000);
    return () => clearTimeout(timeoutId);
  }, [data.trips, data.profile, data.settings, isLoading, data.isAuthenticated]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = data.settings.theme === 'dark' || (data.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [data.settings.theme]);

  const login = async (username: string, password?: string, isSignUp?: boolean, phoneNumber?: string) => {
    setIsLoading(true);
    try {
      const passwordHash = password ? btoa(password) : 'none';
      await cloudService.auth(username, passwordHash, !!isSignUp, { phoneNumber });
      const cloudData = await cloudService.fetchUserData(username);
      if (cloudData) setData(cloudData);
      else setData(prev => ({ ...prev, isAuthenticated: true, profile: { ...prev.profile, name: username, phoneNumber: phoneNumber || '' }}));
    } catch (e) { throw e; } finally { setIsLoading(false); }
  };

  const logout = () => {
    setData({ isAuthenticated: false, trips: [], friends: [], notifications: [], sentNotifications: [], profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS });
    localStorage.removeItem(STORAGE_KEY);
  };

  const addTrip = async (name: string, members: string[]) => {
    const newTrip: Trip = { id: generateId(), name, members, participants: [data.profile.name], status: 'ongoing', expenses: [], createdAt: Date.now() };
    const updated = { ...data, trips: [newTrip, ...data.trips] };
    setData(updated);
    if (data.isAuthenticated) await cloudService.syncToCloud(updated);
    return newTrip;
  };

  const addMemberToTrip = (tripId: string, member: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => (trip.id === tripId && !trip.members.includes(member)) ? { ...trip, members: [...trip.members, member] } : trip)
    }));
  };

  const addExpense = (tripId: string, expenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, expenses: [{ ...expenseData, id: generateId(), timestamp: Date.now() }, ...trip.expenses] } : trip)
    }));
  };

  const updateExpense = (tripId: string, expense: Expense) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, expenses: trip.expenses.map(e => e.id === expense.id ? expense : e) } : trip)
    }));
  };

  const deleteExpense = (tripId: string, expenseId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, expenses: trip.expenses.filter(e => e.id !== expenseId) } : trip)
    }));
  };

  const endTrip = (tripId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => trip.id === tripId ? { ...trip, status: 'ended', endedAt: Date.now() } : trip)
    }));
  };

  const deleteTrip = async (tripId: string) => {
    await cloudService.deleteTrip(tripId);
    setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== tripId) }));
  };

  const forceSync = async () => {
    setCloudStatus('syncing');
    const success = await cloudService.syncToCloud(data);
    if (success) setCloudStatus('synced');
    else setCloudStatus('error');
    setTimeout(() => setCloudStatus('idle'), 2000);
  };

  return (
    <TripContext.Provider value={{ 
      ...data, userProfile: data.profile, currencySymbol: CURRENCY_SYMBOLS[data.settings.currency],
      isLoading, cloudStatus, login, logout, addTrip, addMemberToTrip, addExpense, updateExpense, deleteExpense, endTrip, deleteTrip, forceSync,
      searchUsers: (q) => cloudService.searchUsers(q, data.profile.name),
      sendFriendRequest: (u) => cloudService.sendFriendRequest(data.profile.name, u),
      inviteFriendToTrip: (f, t, n) => cloudService.sendTripInvitation(data.profile.name, f, t, n),
      respondToNotification: (i, s) => cloudService.respondToNotification(i, s).then(() => refreshFriendsAndNotifications()),
      removeFriend: (u) => cloudService.removeFriend(data.profile.name, u).then(() => refreshFriendsAndNotifications()),
      refreshFriendsAndNotifications,
      getTrip: (id) => data.trips.find(t => t.id === id),
      updateProfile: (p) => setData(prev => ({ ...prev, profile: { ...prev.profile, ...p } })),
      updateSettings: (s) => setData(prev => ({ ...prev, settings: { ...prev.settings, ...s } })),
      // Wrap the promise to match the required return type Promise<void>
      changePassword: async (c, n) => { await cloudService.changePassword(data.profile.name, btoa(c), btoa(n)); },
      removeMemberFromTrip: async (tid, m) => {
        if (data.isAuthenticated && data.trips.find(t => t.id === tid)?.participants.includes(m)) await cloudService.removeParticipant(tid, m);
        setData(prev => ({
          ...prev,
          trips: prev.trips.map(t => t.id === tid ? { ...t, members: t.members.filter(mem => mem !== m), participants: t.participants.filter(p => p !== m) } : t)
        }));
      },
      clearHistory: async () => {
        await cloudService.clearHistory(data.profile.name);
        setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.status === 'ongoing') }));
      }
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrips must be used within a TripProvider");
  return context;
};
