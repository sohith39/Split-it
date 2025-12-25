/**
 * This file acts as the "Dictionary" or "Blueprint" for the app.
 * It defines what an "Expense", a "Trip", or a "User" looks like so the computer knows what data to expect.
 */

export type Member = string;

// Categories used to label expenses (like Food or Travel)
export enum ExpenseCategory {
  FOOD = 'Food',
  TRAVEL = 'Travel',
  TICKETS = 'Tickets',
  ACCOMMODATION = 'Accommodation',
  OTHER = 'Other',
}

// What information we store for every single receipt/cost added
export interface Expense {
  id: string;
  amount: number;
  description?: string;
  category: ExpenseCategory;
  paidBy: Member;
  splitAmong: Member[];
  timestamp: number;
}

export type TripStatus = 'ongoing' | 'ended';

// The main object representing a group event (a Trip)
export interface Trip {
  id: string;
  name: string;
  members: Member[]; // Everyone involved in the split (Owners + Guest Members)
  participants: string[]; // Specifically co-owners with cloud access (actual accounts)
  status: TripStatus;
  expenses: Expense[];
  createdAt: number;
  endedAt?: number;
}

// Supported currency types
export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' 
  | 'CAD' | 'AED' | 'SAR' | 'JPY' | 'CNY' 
  | 'ZAR' | 'NGN' | 'BRL' | 'ARS' | 'SGD';

export type ThemeOption = 'light' | 'dark' | 'system';

// Personal details for the user
export interface UserProfile {
  name: string;
  phoneNumber: string;
  avatarColor: string; 
  avatarImage?: string;
}

export interface AppSettings {
  currency: CurrencyCode;
  theme: ThemeOption;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// A friend's public info
export interface Friend {
  username: string;
  avatarColor: string;
  avatarImage?: string;
}

// Notifications for friend requests or trip invites
export interface Notification {
  id: string;
  fromUsername: string;
  toUsername: string;
  type: 'FRIEND_REQUEST' | 'TRIP_INVITATION';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  timestamp: number;
  tripId?: string;
  tripName?: string;
}

// The master container for all data used while the app is running
export interface AppData {
  isAuthenticated: boolean;
  trips: Trip[];
  profile: UserProfile;
  settings: AppSettings;
  friends: Friend[];
  notifications: Notification[];
  sentNotifications: Notification[];
  cloudId?: string;
  lastSyncedAt?: number;
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  AED: 'د.إ',
  SAR: '﷼',
  JPY: '¥',
  CNY: '¥',
  ZAR: 'R',
  NGN: '₦',
  BRL: 'R$',
  ARS: '$',
  SGD: 'S$',
};