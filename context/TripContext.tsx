import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trip, Expense, UserProfile, AppSettings, CURRENCY_SYMBOLS, CurrencyCode, ThemeOption } from '../types';

interface TripContextType {
  trips: Trip[];
  userProfile: UserProfile;
  settings: AppSettings;
  currencySymbol: string;
  addTrip: (name: string, members: string[]) => void;
  addExpense: (tripId: string, expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  updateExpense: (tripId: string, expense: Expense) => void;
  deleteExpense: (tripId: string, expenseId: string) => void;
  endTrip: (tripId: string) => void;
  deleteTrip: (tripId: string) => void;
  clearHistory: () => void;
  getTrip: (id: string) => Trip | undefined;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const STORAGE_KEY = 'trip_splitter_data_v2';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Traveler',
  phoneNumber: '',
  avatarColor: '#3b82f6',
};

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  theme: 'system',
};

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<{
    trips: Trip[];
    profile: UserProfile;
    settings: AppSettings;
  }>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration or fallback for new fields
        return {
          trips: parsed.trips || (Array.isArray(parsed) ? parsed : []), // Handle legacy array format
          profile: { ...DEFAULT_PROFILE, ...parsed.profile },
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        };
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    return { trips: [], profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS };
  });

  // Persist Data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (theme: ThemeOption) => {
      const isDark = 
        theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(data.settings.theme);

    // Listener for system changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (data.settings.theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [data.settings.theme]);

  const addTrip = (name: string, members: string[]) => {
    const newTrip: Trip = {
      id: crypto.randomUUID(),
      name,
      members,
      status: 'ongoing',
      expenses: [],
      createdAt: Date.now(),
    };
    setData(prev => ({ ...prev, trips: [newTrip, ...prev.trips] }));
  };

  const addExpense = (tripId: string, expenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        const newExpense: Expense = {
          ...expenseData,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        return { ...trip, expenses: [newExpense, ...trip.expenses] };
      })
    }));
  };

  const updateExpense = (tripId: string, expense: Expense) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        return {
          ...trip,
          expenses: trip.expenses.map(e => e.id === expense.id ? expense : e)
        };
      })
    }));
  };

  const deleteExpense = (tripId: string, expenseId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        return {
          ...trip,
          expenses: trip.expenses.filter(e => e.id !== expenseId)
        };
      })
    }));
  };

  const endTrip = (tripId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.map(trip => {
        if (trip.id !== tripId) return trip;
        return { ...trip, status: 'ended', endedAt: Date.now() };
      })
    }));
  };

  const deleteTrip = (tripId: string) => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.filter(t => t.id !== tripId)
    }));
  };

  const clearHistory = () => {
    setData(prev => ({
      ...prev,
      trips: prev.trips.filter(t => t.status === 'ongoing')
    }));
  };

  const getTrip = (id: string) => data.trips.find(t => t.id === id);

  const updateProfile = (profileUpdate: Partial<UserProfile>) => {
    setData(prev => ({ ...prev, profile: { ...prev.profile, ...profileUpdate } }));
  };

  const updateSettings = (settingsUpdate: Partial<AppSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...settingsUpdate } }));
  };

  return (
    <TripContext.Provider value={{ 
      trips: data.trips, 
      userProfile: data.profile, 
      settings: data.settings,
      currencySymbol: CURRENCY_SYMBOLS[data.settings.currency],
      addTrip, 
      addExpense,
      updateExpense,
      deleteExpense,
      endTrip, 
      deleteTrip,
      clearHistory,
      getTrip,
      updateProfile,
      updateSettings
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