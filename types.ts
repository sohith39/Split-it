export type Member = string;

export enum ExpenseCategory {
  FOOD = 'Food',
  TRAVEL = 'Travel',
  TICKETS = 'Tickets',
  ACCOMMODATION = 'Accommodation',
  OTHER = 'Other',
}

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

export interface Trip {
  id: string;
  name: string;
  members: Member[];
  status: TripStatus;
  expenses: Expense[];
  createdAt: number;
  endedAt?: number;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD';
export type ThemeOption = 'light' | 'dark' | 'system';

export interface UserProfile {
  name: string;
  phoneNumber: string;
  avatarColor: string; // Storing a color hex instead of image for simplicity/performance
  avatarImage?: string; // Base64 string for custom profile picture
}

export interface AppSettings {
  currency: CurrencyCode;
  theme: ThemeOption;
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};