export type UserRole = 'admin' | 'manager' | 'sales' | 'front_desk';

export type AppTab = 'overview' | 'bookings' | 'availability' | 'rooms' | 'sync' | 'settings';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  role_id?: string;
  position?: string; // Job title / position (e.g. 'General Manager', 'Head of Reservations')
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  department?: string;
  customPermissions?: string[]; // Granular permissions granted by Admin
  bio?: string;
  createdAt: string;
  lastActive?: string;
}

export type SupportedCurrency = 'USD' | 'TZS' | 'EUR' | 'GBP';

export type AppTheme = 'light' | 'dark' | 'system';

export interface ExchangeRates {
  USD: number; // TZS per 1 USD (e.g. 2650)
  EUR: number; // TZS per 1 EUR (e.g. 2850)
  GBP: number; // TZS per 1 GBP (e.g. 3450)
  TZS: number; // 1
  [key: string]: number;
}

export type PaymentMethod = 'front_desk' | 'mpesa' | 'mobile_money' | 'card';

export type BookingStatus = 'Confirmed' | 'Checked-in' | 'Checked-out' | 'Tentative' | 'Cancelled' | 'No-show' | 'Refunded';

export interface Room {
  id: string;
  name: string;
  roomCode: string;
  type: 'dorm' | 'family' | 'triple' | 'private';
  totalBeds: number;
  singleBeds?: number; // Single beds
  bunkBeds?: number;   // Bunker / Bunk beds (each provides 2 beds)
  bookedBeds: number;
  freeBeds: number;
  holdBeds: number;
  clashes: number;
  pricePerNightTZS: number;
  pricePerNightUSD: number;
  priceUnit: string;
  tagline: string;
  description: string;
  maxGuests: number;
  amenities: string[];
  bedConfiguration: string;
  bathroom: string;
  features: string[];
  isCustom?: boolean;
}

export interface Booking {
  id: string;
  guestName: string;
  guestId: string;
  email: string;
  phone: string;
  roomId: string;
  roomName: string;
  roomCode?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guestsCount: number;
  status: BookingStatus;
  platform: string;
  stayTotalTZS: number;
  stayTotalUSD: number;
  depositPaidTZS: number;
  balanceDueTZS: number;
  // Multi-currency recording fields
  recordedCurrency?: SupportedCurrency;
  recordedTotalAmount?: number;
  recordedDepositAmount?: number;
  discountPercent: number;
  loyaltyStatus: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid in Full' | 'Deposit Paid' | 'Pay at Check-in';
  specialRequests?: string;
  refundAmountTZS?: number;
  isNoShow?: boolean;
  createdAt: string;
  syncedToGoogleCalendar?: boolean;
  googleCalendarEventId?: string;
}

export interface AvailabilityStatus {
  room: Room;
  isAvailable: boolean;
  freeBedsOnDates: number;
  bookedBedsOnDates: number;
  clashingBookings: Booking[];
  statusLabel: 'Available' | 'Limited Availability' | 'Sold Out';
}

export interface OperatingStats {
  operatingDate: string;
  revenueMonth: string;
  totalRooms: number;
  totalBeds: number;
  bookedBeds: number;
  freeBeds: number;
  holdBeds: number;
  arrivalsToday: number;
  departuresToday: number;
  grossBookingValueTZS: number;
  grossBookingValueUSD: number;
  depositsReceivedTZS: number;
  netReceivedTZS: number;
  outstandingBalanceTZS: number;
  confirmedCount: number;
  checkedInCount: number;
  tentativeCount: number;
  checkedOutCount: number;
  cancelledCount: number;
  bookingIssues: number;
  assignmentIssues: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  location?: string;
}
