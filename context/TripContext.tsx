
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Trip, Expense, UserProfile, AppSettings, CURRENCY_SYMBOLS, AppData, CloudSyncStatus, Friend, Notification } from '../types.ts';
import { cloudService } from '../services/CloudService.ts';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  phoneNumber: '',
  avatarColor: '#3b82f6',
};

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  theme: 'system',
};

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>({ 
    isAuthenticated: false, 
    trips: [], 
    profile: DEFAULT_PROFILE, 
    settings: DEFAULT_SETTINGS,
    friends: [],
    notifications: [],
    sentNotifications: [],
    cloudId: '',
    lastSyncedAt: undefined
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('idle');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData({
          isAuthenticated: parsed.isAuthenticated || false,
          trips: parsed.trips || [],
          profile: { ...DEFAULT_PROFILE, ...parsed.profile },
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          friends: parsed.friends || [],
          notifications: parsed.notifications || [],
          sentNotifications: parsed.sentNotifications || [],
          cloudId: parsed.cloudId || `user_${generateId()}`,
          lastSyncedAt: parsed.lastSyncedAt
        });
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoading]);

  const refreshFriendsAndNotifications = useCallback(async () => {
    if (!data.isAuthenticated || !data.profile.name) return;
    try {
      const cloudData = await cloudService.fetchUserData(data.profile.name);
      if (cloudData) {
        setData(prev => ({
          ...prev,
          friends: cloudData.friends,
          notifications: cloudData.notifications,
          sentNotifications: cloudData.sentNotifications,
          trips: cloudData.trips,
          profile: cloudData.profile,
          settings: cloudData.settings
        }));
      }
    } catch (e) {}
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
      setTimeout(() => setCloudStatus('idle'), 3000);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [data.trips, data.profile, data.settings, isLoading, data.isAuthenticated]);

  const forceSync = useCallback(async () => {
    if (!data.isAuthenticated) return;
    setCloudStatus('syncing');
    const success = await cloudService.syncToCloud(data);
    if (success) {
      setCloudStatus('synced');
      setData(prev => ({ ...prev, lastSyncedAt: Date.now() }));
      await refreshFriendsAndNotifications();
    } else {
      setCloudStatus('error');
    }
    setTimeout(() => setCloudStatus('idle'), 3000);
  }, [data, refreshFriendsAndNotifications]);

  useEffect(() => {
    if (isLoading) return;
    const root = window.document.documentElement;
    const isDark = data.settings.theme === 'dark' || 
      (data.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [data.settings.theme, isLoading]);

  const login = async (username: string, password?: string, isSignUp?: boolean, phoneNumber?: string) => {
    setIsLoading(true);
    try {
        const passwordHash = password ? btoa(password) : 'none';
        await cloudService.auth(username, passwordHash, !!isSignUp, { phoneNumber });
        const cloudData = await cloudService.fetchUserData(username);
        
        if (cloudData) {
            setData(cloudData);
        } else {
            setData(prev => ({
                ...prev,
                isAuthenticated: true,
                profile: { 
                    ...prev.profile, 
                    name: username,
                    phoneNumber: phoneNumber || prev.profile.phoneNumber
                }
            }));
        }
    } catch (e: any) {
        setIsLoading(false);
        throw e;
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setData({
        isAuthenticated: false,
        trips: [],
        friends: [],
        notifications: [],
        sentNotifications: [],
        profile: DEFAULT_PROFILE,
        settings: DEFAULT_SETTINGS,
        lastSyncedAt: undefined
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!data.profile.name || !data.isAuthenticated) return;
    const currentHash = btoa(currentPassword);
    const newHash = btoa(newPassword);
    await cloudService.changePassword(data.profile.name, currentHash, newHash);
  };

  const addTrip = async (name: string, members: string[]) => {
    const newTrip: Trip = {
      id: generateId(),
      name,
      members,
      participants: [data.profile.name],
      status: 'ongoing',
      expenses: [],
      createdAt: Date.now(),
    };
    
    const updatedData = { ...data, trips: [newTrip, ...data.trips] };
    setData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

    if (data.isAuthenticated) {
        setCloudStatus('syncing');
        await cloudService.syncToCloud(updatedData);
        setCloudStatus('synced');
    }

    return newTrip;
  };

  const addMemberToTrip = (tripId: string, member: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        if (trip.members.includes(member)) return trip;
        return { ...trip, members: [...trip.members, member] };
      })
    }));
  };

  const removeMemberFromTrip = async (tripId: string, member: string) => {
    const trip = data.trips.find(t => t.id === tripId);
    if (!trip) return;
    const isOwner = trip.participants.includes(member);
    if (data.isAuthenticated && isOwner) {
        await cloudService.removeParticipant(tripId, member);
    }
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(t => {
          if (t.id !== tripId) return t;
          return {
              ...t,
              members: t.members.filter(m => m !== member),
              participants: t.participants.filter(p => p !== member)
          };
      })
    }));
    if (member === data.profile.name) {
        setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== tripId) }));
    }
  };

  const addExpense = (tripId: string, expenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        return { ...trip, expenses: [{ ...expenseData, id: generateId(), timestamp: Date.now() }, ...trip.expenses] };
      })
    }));
  };

  const updateExpense = (tripId: string, expense: Expense) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => (trip.id === tripId ? { ...trip, expenses: trip.expenses.map(e => e.id === expense.id ? expense : e) } : trip))
    }));
  };

  const deleteExpense = (tripId: string, expenseId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => (trip.id === tripId ? { ...trip, expenses: trip.expenses.filter(e => e.id !== expenseId) } : trip))
    }));
  };

  const endTrip = (tripId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => (trip.id === tripId ? { ...trip, status: 'ended', endedAt: Date.now() } : trip))
    }));
  };

  const deleteTrip = async (tripId: string) => {
    await cloudService.deleteTrip(tripId);
    setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== tripId) }));
  };

  const clearHistory = async () => {
    if (!data.profile.name) return;
    await cloudService.clearHistory(data.profile.name);
    setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.status === 'ongoing') }));
  };

  const getTrip = (id: string) => data.trips.find(t => t.id === id);

  const updateProfile = (profileUpdate: Partial<UserProfile>) => {
    setData(prev => {
      const oldName = prev.profile.name;
      const newName = profileUpdate.name;
      let updatedTrips = prev.trips;
      if (newName && oldName && newName !== oldName) {
        updatedTrips = prev.trips.map(trip => ({
          ...trip,
          members: trip.members.map(m => m === oldName ? newName : m),
          participants: trip.participants.map(p => p === oldName ? newName : p),
          expenses: trip.expenses.map(exp => ({
            ...exp,
            paidBy: exp.paidBy === oldName ? newName : exp.paidBy,
            splitAmong: exp.splitAmong.map(m => m === oldName ? newName : m)
          }))
        }));
      }
      return { ...prev, profile: { ...prev.profile, ...profileUpdate }, trips: updatedTrips };
    });
  };

  const updateSettings = (settingsUpdate: Partial<AppSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...settingsUpdate } }));
  };

  const searchUsers = async (query: string) => {
    if (!data.profile.name) return [];
    return await cloudService.searchUsers(query, data.profile.name);
  };

  const sendFriendRequest = async (username: string) => {
    if (!data.profile.name) return;
    await cloudService.sendFriendRequest(data.profile.name, username);
  };

  const inviteFriendToTrip = async (friendUsername: string, tripId: string, tripName: string) => {
    if (!data.profile.name) return;
    await cloudService.sendTripInvitation(data.profile.name, friendUsername, tripId, tripName);
    await refreshFriendsAndNotifications();
  };

  const respondToNotification = async (notificationId: string, status: 'ACCEPTED' | 'DECLINED') => {
    await cloudService.respondToNotification(notificationId, status);
    await refreshFriendsAndNotifications();
  };

  const removeFriend = async (username: string) => {
    if (!data.profile.name) return;
    await cloudService.removeFriend(data.profile.name, username);
    await refreshFriendsAndNotifications();
  };

  return (
    <TripContext.Provider value={{ 
      trips: data.trips, 
      friends: data.friends,
      notifications: data.notifications,
      sentNotifications: data.sentNotifications,
      userProfile: data.profile, 
      settings: data.settings,
      currencySymbol: CURRENCY_SYMBOLS[data.settings.currency],
      isAuthenticated: data.isAuthenticated,
      isLoading,
      cloudStatus,
      lastSyncedAt: data.lastSyncedAt,
      cloudId: data.cloudId,
      login, logout, changePassword, addTrip, addMemberToTrip, removeMemberFromTrip, addExpense, updateExpense, deleteExpense, endTrip, deleteTrip, clearHistory, getTrip, updateProfile, updateSettings, forceSync, searchUsers,
      sendFriendRequest, inviteFriendToTrip, respondToNotification, removeFriend, refreshFriendsAndNotifications
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
