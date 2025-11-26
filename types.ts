
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum LicenseTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes: string; // Preferences, style notes
  lastVisit?: string;
  totalVisits: number;
  avatarUrl?: string;
  loyaltyPoints: number; // 0 to 5
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  service: string;
  stylePreference?: string; // New field for specific cut requests
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  price: number;
  status: AppointmentStatus;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface TimeRange {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface DaySchedule {
  isOpen: boolean;
  ranges: TimeRange[];
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  [key: string]: DaySchedule; // Index signature for access
}

export interface ShopSettings {
  shopName: string;
  schedule: WeeklySchedule;
  licenseTier: LicenseTier;
}

// AI Parsing Result
export interface ParsedBookingRequest {
  thought_process?: string; // Reasoning trace
  clientName?: string;
  date?: string;
  time?: string;
  service?: string;
  stylePreference?: string; // Extracted style description
  suggestedReply: string;
  isComplete?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  bookingData?: ParsedBookingRequest;
}

export interface VisagismoResult {
  faceShape: string;
  recommendations: {
    name: string;
    description: string;
  }[];
}
