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
  notes: string;
  lastVisit?: string;
  totalVisits: number;
  avatarUrl?: string;
  loyaltyPoints: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  stylePreference?: string;
  date: string;
  time: string;
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
  start: string;
  end: string;
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
  [key: string]: DaySchedule;
}

export interface ShopSettings {
  shopName: string;
  contactPhone?: string; // NUEVO: Teléfono del negocio
  schedule: WeeklySchedule;
  licenseTier: LicenseTier;
}

export interface ParsedBookingRequest {
  thought_process?: string;
  clientName?: string;
  date?: string;
  time?: string;
  service?: string;
  stylePreference?: string;
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
