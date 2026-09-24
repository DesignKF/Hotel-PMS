import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  UserRole, 
  AppUser,
  AppTab,
  SupportedCurrency, 
  ExchangeRates, 
  Room, 
  Booking, 
  BookingStatus, 
  PaymentMethod, 
  AvailabilityStatus, 
  OperatingStats, 
  CalendarEvent 
} from '../types';
import { HOSTEL_CONFIG, INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_USERS } from '../data/initialData';
import { 
  signInWithGoogleForCalendar, 
  signOutGoogle, 
  fetchCalendarEvents, 
  syncBookingToGoogleCalendar, 
  deleteCalendarEvent, 
  onGoogleAuthStateChanged 
} from '../services/googleCalendar';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { AuthSession, User as AuthUser, Role as AuthRole } from '../types/auth';
import { authApi } from '../services/authApi';
import { 
  saveBookingToFirestore, 
  deleteBookingFromFirestore, 
  subscribeToBookings, 
  saveRoomToFirestore, 
  subscribeToRooms, 
  saveSettingsToFirestore,
  syncAllBookingsToFirestore,
  syncAllRoomsToFirestore,
  fetchAllBookingsFromFirestore
} from '../services/firestoreDb';

interface CalendarConfirmModalState {
  isOpen: boolean;
  booking: Booking;
  actionType: 'create' | 'update' | 'delete';
  eventId?: string;
}

interface BookingContextType {
  // Live Cloud Database Synchronization
  syncStatus: 'synced' | 'syncing' | 'unsynced' | 'error';
  lastSyncedAt: Date | null;
  syncError: string | null;
  isSyncingDatabase: boolean;
  syncDatabase: () => Promise<void>;

  isAuthenticated: boolean;
  authSession: AuthSession | null;
  currentUserPermissions: string[];
  hasPermission: (permissionKey: string) => boolean;
  handleLoginSuccess: (session: AuthSession) => void;
  isAssignRoleOpen: boolean;
  assignRoleTargetUser: any;
  openAssignRoleModal: (user: any) => void;
  closeAssignRoleModal: () => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  users: AppUser[];
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  switchUser: (userId: string) => void;
  createUser: (newUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUserManagementOpen: boolean;
  setIsUserManagementOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profileUserToEdit: AppUser | null;
  setProfileUserToEdit: React.Dispatch<React.SetStateAction<AppUser | null>>;
  openProfileModal: (user?: AppUser) => void;
  closeProfileModal: () => void;
  canManageUsers: boolean;
  canManageRoles: boolean;
  isAdmin: boolean;
  rooms: Room[];
  bookings: Booking[];
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  exchangeRates: ExchangeRates;
  updateExchangeRate: (currency: SupportedCurrency, rateToTZS: number) => void;
  convertAmount: (amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency) => number;
  formatPrice: (amountTZS: number, targetCurr?: SupportedCurrency) => string;
  formatPriceDual: (amountTZS: number) => { primary: string; secondary: string };
  formatInCurrency: (amount: number, curr: SupportedCurrency) => string;
  formatUSDOnly: (usd: number) => string;
  formatTZSOnly: (tzs: number) => string;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  checkInDate: string;
  setCheckInDate: (date: string) => void;
  checkOutDate: string;
  setCheckOutDate: (date: string) => void;
  nightsCount: number;
  guestsCount: number;
  setGuestsCount: (count: number) => void;
  getAvailabilityForDates: (checkIn: string, checkOut: string) => AvailabilityStatus[];
  checkDateOverlap: (start1: string, end1: string, start2: string, end2: string) => boolean;
  selectedRoomForBooking: Room | null;
  openBookingModal: (room: Room) => void;
  closeBookingModal: () => void;
  completedBooking: Booking | null;
  setCompletedBooking: (b: Booking | null) => void;
  submitNewBooking: (params: {
    roomId: string;
    guestName: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    paymentMethod: PaymentMethod;
    status?: BookingStatus;
    specialRequests?: string;
    isDepositOnly?: boolean;
    syncToGoogleCal?: boolean;
    recordedCurrency?: SupportedCurrency;
    recordedTotalAmount?: number;
    recordedDepositAmount?: number;
  }) => Promise<Booking>;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string) => void;
  deleteBooking: (id: string) => void;
  googleUser: User | null;
  googleToken: string | null;
  isConnectingCalendar: boolean;
  calendarEvents: CalendarEvent[];
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  syncBookingEvent: (booking: Booking, actionType?: 'create' | 'update' | 'delete') => Promise<void>;
  isSyncingBooking: boolean;
  calendarConfirmModal: CalendarConfirmModalState | null;
  setCalendarConfirmModal: (modal: CalendarConfirmModalState | null) => void;
  executeCalendarAction: () => Promise<void>;
  stats: OperatingStats;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  // Theme & Appearance (Light, Dark, System)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  // Room & Bed Management
  basePricePerNightTZS: number;
  updateOverallBasePrice: (newPriceTZS: number, applyToAllRooms: boolean) => void;
  addRoom: (newRoom: {
    name: string;
    roomCode: string;
    type: 'dorm' | 'family' | 'triple' | 'private';
    singleBeds: number;
    bunkBeds: number;
    pricePerNightTZS: number;
    bathroom: string;
    description: string;
    amenities: string[];
    tagline?: string;
  }) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  // Automated Exchange Rate Sync & Manual Override
  autoSyncExchangeRates: boolean;
  setAutoSyncExchangeRates: (auto: boolean) => void;
  lastRateSyncTime: string | null;
  isSyncingRates: boolean;
  syncGlobalExchangeRates: () => Promise<void>;
  // Silent background refresh timestamp
  lastBackgroundRefresh: string;
  // Offline & Caching Strategy
  isOnline: boolean;
  // Global search & filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Dev flag for profile switcher
  showDevProfileSwitcher: boolean;
  setShowDevProfileSwitcher: (show: boolean) => void;
  // Unified New Booking Drawer
  isNewBookingOpen: boolean;
  setIsNewBookingOpen: (open: boolean) => void;
  openNewBookingDrawer: (initialData?: { roomId?: string; checkIn?: string; checkOut?: string }) => void;
  // Quick Task-First Actions
  quickCheckIn: (bookingId: string) => void;
  quickCheckOut: (bookingId: string) => void;
  quickCollectPayment: (bookingId: string, amountTZS?: number) => void;
  signOut: () => void;
  // Reusable Single Source of Truth Selectors
  arrivingTodayList: Booking[];
  departuresTodayList: Booking[];
  checkedInList: Booking[];
  bookedTonightBeds: number;
  freeTonightBeds: number;
  outstandingPaymentsList: Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth Session State
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('moshi_access_token_v3'));
  });

  // Staff Users State with persistence
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('moshi_hostel_users_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USERS;
  });

  useEffect(() => {
    localStorage.setItem('moshi_hostel_users_v2', JSON.stringify(users));
  }, [users]);

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('moshi_hostel_active_user_v2') || INITIAL_USERS[0].id;
  });

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('moshi_access_token_v3');
      if (!token) {
        setIsAuthenticated(false);
        setAuthSession(null);
        return;
      }
      try {
        const me = await authApi.getMe();
        if (me) {
          setIsAuthenticated(true);
          const matching = users.find(u => u.email.toLowerCase() === me.user.email.toLowerCase());
          if (matching) {
            setCurrentUserId(matching.id);
          }
        } else {
          setIsAuthenticated(false);
          setAuthSession(null);
        }
      } catch {
        setIsAuthenticated(false);
        setAuthSession(null);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setIsAuthenticated(true);
    const matching = users.find(u => u.email.toLowerCase() === session.user.email.toLowerCase());
    if (matching) {
      setCurrentUserId(matching.id);
    } else {
      const newUser: AppUser = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        role: (session.role.name.toLowerCase().includes('admin') ? 'admin' : session.role.name.toLowerCase().includes('manager') ? 'manager' : session.role.name.toLowerCase().includes('front') ? 'front_desk' : 'sales') as UserRole,
        position: session.user.position || `${session.role.name} Staff`,
        department: session.user.department || 'Operations',
        status: session.user.status === 'suspended' ? 'inactive' : 'active',
        avatar: session.user.avatar,
        createdAt: session.user.created_at ? session.user.created_at.split('T')[0] : '2025-01-01'
      };
      setUsers(prev => [newUser, ...prev]);
      setCurrentUserId(newUser.id);
    }
    showToast(`Welcome back, ${session.user.name}!`);
  };

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  const userRole = currentUser.role;
  const isAdmin = currentUser.role === 'admin' || authSession?.role.is_system_role === true;

  // Permission checks
  const currentUserPermissions = useMemo(() => {
    if (authSession?.permissions) return authSession.permissions;
    if (currentUser.role === 'admin') {
      return ['manage_roles', 'view_roles', 'manage_users', 'view_users', 'view_audit_log', 'view_bookings', 'create_bookings', 'manage_bookings', 'manage_rates', 'view_reports', 'manage_system'];
    }
    if (currentUser.role === 'manager') {
      return ['manage_roles', 'view_roles', 'manage_users', 'view_users', 'view_audit_log', 'view_bookings', 'create_bookings', 'manage_bookings', 'manage_rates', 'view_reports'];
    }
    if (currentUser.role === 'front_desk') {
      return ['view_users', 'view_bookings', 'create_bookings', 'manage_bookings'];
    }
    return ['view_users', 'view_bookings', 'create_bookings'];
  }, [authSession, currentUser]);

  const hasPermission = (permissionKey: string): boolean => {
    return currentUserPermissions.includes(permissionKey);
  };

  const canManageRoles = hasPermission('manage_roles') || isAdmin;
  const canManageUsers = hasPermission('manage_users') || canManageRoles;

  // Assign Role Modal State
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [assignRoleTargetUser, setAssignRoleTargetUser] = useState<any>(null);

  const openAssignRoleModal = (user: any) => {
    setAssignRoleTargetUser(user);
    setIsAssignRoleOpen(true);
  };

  const closeAssignRoleModal = () => {
    setAssignRoleTargetUser(null);
    setIsAssignRoleOpen(false);
  };

  const setUserRole = (role: UserRole) => {
    if (!isAdmin) {
      showToast('Access restricted: Only an Administrator can reassign staff roles.');
      return;
    }
    updateUser(currentUser.id, { role });
  };

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      localStorage.setItem('moshi_hostel_active_user_v2', target.id);
      showToast(`Switched active profile to ${target.name} (${target.role.toUpperCase()})`);
    }
  };

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileUserToEdit, setProfileUserToEdit] = useState<AppUser | null>(null);

  const openProfileModal = (user?: AppUser) => {
    setProfileUserToEdit(user || currentUser);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileUserToEdit(null);
  };

  const createUser = (newUser: Omit<AppUser, 'id' | 'createdAt'>) => {
    if (!canManageUsers) {
      showToast('Access restricted: Only Managers and Admins can create staff accounts.');
      return;
    }
    const id = `u-${Date.now().toString().slice(-6)}`;
    const created: AppUser = {
      ...newUser,
      id,
      createdAt: HOSTEL_CONFIG.operatingDate,
      lastActive: 'Just created'
    };
    setUsers(prev => [created, ...prev]);
    showToast(`Staff member ${created.name} (${created.role}) created successfully!`);
  };

  const updateUser = (id: string, updates: Partial<AppUser>) => {
    const isTargetingSelf = currentUser.id === id;

    // If not admin, user can only edit their own profile
    if (!isAdmin && !isTargetingSelf) {
      showToast('Access restricted: You can only edit your own user profile.');
      return;
    }

    // If not admin, strip role, status, and customPermissions from the updates
    let finalUpdates = { ...updates };
    if (!isAdmin) {
      delete finalUpdates.role;
      delete finalUpdates.status;
      delete finalUpdates.customPermissions;
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...finalUpdates } : u));
    showToast(`Profile updated successfully`);
  };

  const deleteUser = (id: string) => {
    if (!canManageUsers) {
      showToast('Access restricted: Only Managers and Admins can remove staff accounts.');
      return;
    }
    if (users.length <= 1) {
      showToast('Cannot delete the last remaining user account.');
      return;
    }
    const target = users.find(u => u.id === id);
    if (target?.role === 'admin' && currentUser.role !== 'admin') {
      showToast('Access restricted: Only an Administrator can remove an Admin profile.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUserId === id) {
      const fallback = users.find(u => u.id !== id) || INITIAL_USERS[0];
      setCurrentUserId(fallback.id);
    }
    showToast('Staff account removed.');
  };

  // Sidebar Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);

  // Offline awareness
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored. Working online.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline mode active. All data loaded from local cache.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dev flag for profile switcher
  const [showDevProfileSwitcher, setShowDevProfileSwitcher] = useState<boolean>(() => {
    return localStorage.getItem('moshi_dev_profile_switcher') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('moshi_dev_profile_switcher', showDevProfileSwitcher ? 'true' : 'false');
  }, [showDevProfileSwitcher]);

  // Theme & Appearance (Light, Dark, System)
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('moshi_app_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('moshi_app_theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // system
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Overall Base Cost per night in TZS (default 53,000 TZS)
  const [basePricePerNightTZS, setBasePricePerNightTZS] = useState<number>(() => {
    const saved = localStorage.getItem('moshi_base_price_tzs');
    return saved ? Number(saved) : 53000;
  });

  // Rooms & Beds Inventory (Single / Bunker Beds)
  // R1 Mawenzi: 1 Single + 1 Bunk = 3 Beds
  // R2 Njoro: 0 Single + 3 Bunk = 6 Beds
  // R3 Bondeni: 0 Single + 2 Bunk = 4 Beds
  // R4 Soweto: 1 Single + 1 Bunk = 3 Beds
  // Total: 16 beds across 4 rooms
  const DEFAULT_ENRICHED_ROOMS: Room[] = INITIAL_ROOMS.map(r => ({
    ...r,
    singleBeds: (r.id === 'R1' || r.id === 'R4') ? 1 : 0,
    bunkBeds: (r.id === 'R1' || r.id === 'R4') ? 1 : (r.id === 'R2' ? 3 : 2),
    isCustom: false
  }));

  const [customRooms, setCustomRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('moshi_hostel_rooms_v5');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ENRICHED_ROOMS;
  });

  useEffect(() => {
    localStorage.setItem('moshi_hostel_rooms_v5', JSON.stringify(customRooms));
  }, [customRooms]);

  const addRoom = (newRoom: {
    name: string;
    roomCode: string;
    type: 'dorm' | 'family' | 'triple' | 'private';
    singleBeds: number;
    bunkBeds: number;
    pricePerNightTZS: number;
    bathroom: string;
    description: string;
    amenities: string[];
    tagline?: string;
  }) => {
    const single = Math.max(0, Number(newRoom.singleBeds || 0));
    const bunk = Math.max(0, Number(newRoom.bunkBeds || 0));
    const totalBeds = single + bunk * 2;
    const id = `R${Date.now().toString().slice(-4)}`;

    const bedParts: string[] = [];
    if (single > 0) bedParts.push(`${single} Single Bed${single > 1 ? 's' : ''}`);
    if (bunk > 0) bedParts.push(`${bunk} Bunk Bed${bunk > 1 ? 's' : ''}`);
    const bedConfig = bedParts.join(' & ') || `${totalBeds} Beds`;

    const price = Number(newRoom.pricePerNightTZS) || basePricePerNightTZS;

    const created: Room = {
      id,
      name: newRoom.name,
      roomCode: newRoom.roomCode || `Room ${customRooms.length + 1}`,
      type: newRoom.type,
      totalBeds: Math.max(1, totalBeds),
      singleBeds: single,
      bunkBeds: bunk,
      bookedBeds: 0,
      freeBeds: Math.max(1, totalBeds),
      holdBeds: 0,
      clashes: 0,
      pricePerNightTZS: price,
      pricePerNightUSD: Math.round(price / 2650),
      priceUnit: newRoom.type === 'dorm' ? 'per bed / night' : 'per room / night',
      tagline: newRoom.tagline || bedConfig,
      description: newRoom.description || `Spacious ${newRoom.type} accommodation at Moshi Urban Hostel configured with ${bedConfig}.`,
      maxGuests: Math.max(1, totalBeds),
      amenities: newRoom.amenities.length > 0 ? newRoom.amenities : ['High-Speed Wi-Fi', 'Solar Hot Water 24/7', 'Daily Housekeeping'],
      bedConfiguration: bedConfig,
      bathroom: newRoom.bathroom || 'Shared Hot Water Shower',
      features: [`${totalBeds} Beds Total`, `${single} Single`, `${bunk} Bunker`],
      isCustom: true
    };

    setCustomRooms(prev => [...prev, created]);
    saveRoomToFirestore(created).catch(err => {
      console.warn('Firestore room save fallback:', err);
    });
    showToast(`Room "${created.name}" created with ${totalBeds} beds.`);
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    let updatedRoom: Room | undefined;
    setCustomRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const single = updates.singleBeds !== undefined ? Math.max(0, Number(updates.singleBeds)) : (r.singleBeds || 0);
      const bunk = updates.bunkBeds !== undefined ? Math.max(0, Number(updates.bunkBeds)) : (r.bunkBeds || 0);
      const totalBeds = (updates.singleBeds !== undefined || updates.bunkBeds !== undefined)
        ? Math.max(1, single + bunk * 2)
        : Math.max(1, updates.totalBeds || r.totalBeds);

      const bedParts: string[] = [];
      if (single > 0) bedParts.push(`${single} Single Bed${single > 1 ? 's' : ''}`);
      if (bunk > 0) bedParts.push(`${bunk} Bunk Bed${bunk > 1 ? 's' : ''}`);
      const bedConfig = updates.bedConfiguration || (bedParts.join(' & ') || `${totalBeds} Beds`);

      const tzsPrice = updates.pricePerNightTZS !== undefined ? Number(updates.pricePerNightTZS) : r.pricePerNightTZS;

      updatedRoom = {
        ...r,
        ...updates,
        singleBeds: single,
        bunkBeds: bunk,
        totalBeds,
        freeBeds: Math.max(0, totalBeds - (r.bookedBeds || 0)),
        maxGuests: updates.maxGuests || totalBeds,
        bedConfiguration: bedConfig,
        pricePerNightTZS: tzsPrice,
        pricePerNightUSD: Math.round(tzsPrice / 2650),
        features: updates.features || [`${totalBeds} Beds Total`, `${single} Single`, `${bunk} Bunker`]
      };
      return updatedRoom;
    }));

    if (updatedRoom) {
      saveRoomToFirestore(updatedRoom).catch(err => {
        console.warn('Firestore room update fallback:', err);
      });
    }

    if (updates.name || updates.roomCode) {
      setBookings(prev => prev.map(b => {
        if (b.roomId === roomId) {
          return {
            ...b,
            roomName: updates.name || b.roomName,
            roomCode: updates.roomCode || b.roomCode
          };
        }
        return b;
      }));
    }

    showToast('Room configuration updated.');
  };

  const deleteRoom = (roomId: string) => {
    if (customRooms.length <= 1) {
      showToast('Cannot delete the only remaining room.');
      return;
    }
    const target = customRooms.find(r => r.id === roomId);
    setCustomRooms(prev => prev.filter(r => r.id !== roomId));
    showToast(`Room "${target?.name || roomId}" removed.`);
  };

  const updateOverallBasePrice = (newPriceTZS: number, applyToAllRooms: boolean) => {
    setBasePricePerNightTZS(newPriceTZS);
    localStorage.setItem('moshi_base_price_tzs', String(newPriceTZS));
    if (applyToAllRooms) {
      setCustomRooms(prev => prev.map(r => ({
        ...r,
        pricePerNightTZS: newPriceTZS,
        pricePerNightUSD: Math.round(newPriceTZS / 2650)
      })));
      showToast(`Base rate set to ${newPriceTZS.toLocaleString()} TZS and applied to all rooms.`);
    } else {
      showToast(`Base rate set to ${newPriceTZS.toLocaleString()} TZS.`);
    }
  };

  // Unified New Booking Drawer
  const [isNewBookingOpen, setIsNewBookingOpen] = useState<boolean>(false);

  // Currency & Global Automated Exchange Rates
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    return (localStorage.getItem('moshi_hostel_currency_v5') as SupportedCurrency) || 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => {
    try {
      const saved = localStorage.getItem('moshi_hostel_rates_v5');
      if (saved) return JSON.parse(saved);
    } catch {}
    return HOSTEL_CONFIG.exchangeRates;
  });

  const [autoSyncExchangeRates, setAutoSyncExchangeRatesState] = useState<boolean>(() => {
    return localStorage.getItem('moshi_auto_sync_rates') !== 'false';
  });

  const [lastRateSyncTime, setLastRateSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('moshi_last_rate_sync') || 'Today (Live auto-sync)';
  });

  const [isSyncingRates, setIsSyncingRates] = useState<boolean>(false);

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    localStorage.setItem('moshi_hostel_currency_v5', c);
  };

  const updateExchangeRate = (curr: SupportedCurrency, rateToTZS: number) => {
    setExchangeRates(prev => {
      const updated = { ...prev, [curr]: rateToTZS };
      localStorage.setItem('moshi_hostel_rates_v5', JSON.stringify(updated));
      return updated;
    });
  };

  const syncGlobalExchangeRates = async () => {
    setIsSyncingRates(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && data.rates.TZS) {
          const tzsPerUsd = Math.round(data.rates.TZS);
          const tzsPerEur = Math.round(data.rates.TZS / (data.rates.EUR || 0.92));
          const tzsPerGbp = Math.round(data.rates.TZS / (data.rates.GBP || 0.78));

          setExchangeRates(prev => {
            const updated: ExchangeRates = {
              ...prev,
              USD: tzsPerUsd,
              EUR: tzsPerEur,
              GBP: tzsPerGbp,
              TZS: 1
            };
            localStorage.setItem('moshi_hostel_rates_v5', JSON.stringify(updated));
            return updated;
          });

          const now = new Date();
          const stamp = `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
          setLastRateSyncTime(stamp);
          localStorage.setItem('moshi_last_rate_sync', stamp);
        }
      }
    } catch (err) {
      console.warn('Silent currency sync attempt:', err);
    } finally {
      setIsSyncingRates(false);
    }
  };

  const setAutoSyncExchangeRates = (enabled: boolean) => {
    setAutoSyncExchangeRatesState(enabled);
    localStorage.setItem('moshi_auto_sync_rates', enabled ? 'true' : 'false');
    if (enabled) {
      syncGlobalExchangeRates();
      showToast('Automatic global currency exchange sync enabled.');
    } else {
      showToast('Manual exchange rate override enabled.');
    }
  };

  // Google Calendar Integration State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState<boolean>(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isSyncingBooking, setIsSyncingBooking] = useState<boolean>(false);

  // Background Auto-Refresh (Silent, every 60s without disturbing UI or user actions)
  const [lastBackgroundRefresh, setLastBackgroundRefresh] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    if (autoSyncExchangeRates) {
      syncGlobalExchangeRates();
    }

    const intervalId = setInterval(() => {
      setLastBackgroundRefresh(new Date().toISOString());
      
      // Silent calendar update if connected
      if (googleToken) {
        fetchCalendarEvents(googleToken)
          .then(evts => setCalendarEvents(evts))
          .catch(() => {});
      }

      // Silent currency rates update if auto-sync enabled
      if (autoSyncExchangeRates) {
        syncGlobalExchangeRates();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [googleToken, autoSyncExchangeRates]);

  const convertAmount = (amount: number, from: SupportedCurrency, to: SupportedCurrency): number => {
    if (from === to) return amount;
    const amountInTZS = amount * (exchangeRates[from] || 1);
    const converted = amountInTZS / (exchangeRates[to] || 1);
    return Number(converted.toFixed(2));
  };

  const [activeTab, setActiveTab] = useState<AppTab>('overview');

  const [checkInDate, setCheckInDate] = useState<string>('2026-09-23');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-09-25');
  const [guestsCount, setGuestsCount] = useState<number>(1);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const savedV7 = localStorage.getItem('moshi_hostel_bookings_v7');
      if (savedV7) return JSON.parse(savedV7);
      
      const savedV5 = localStorage.getItem('moshi_hostel_bookings_v5');
      if (savedV5) {
        const parsed: Booking[] = JSON.parse(savedV5);
        // If parsed only has old few items, merge with initial bookings
        const existingIds = new Set(parsed.map(b => b.id));
        const merged = [...parsed, ...INITIAL_BOOKINGS.filter(b => !existingIds.has(b.id))];
        return merged;
      }
    } catch {}
    return INITIAL_BOOKINGS;
  });

  useEffect(() => {
    localStorage.setItem('moshi_hostel_bookings_v7', JSON.stringify(bookings));
  }, [bookings]);

  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const [calendarConfirmModal, setCalendarConfirmModal] = useState<CalendarConfirmModalState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Cloud Database Sync States
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'unsynced' | 'error'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncingDatabase, setIsSyncingDatabase] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    const unsub = onGoogleAuthStateChanged(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        if (token) {
          fetchCalendarEvents(token)
            .then(evts => setCalendarEvents(evts))
            .catch(err => console.warn('Could not auto-fetch calendar events:', err));
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setCalendarEvents([]);
      }
    );
    return () => unsub();
  }, []);

  // Real-time Firestore sync for room inventory
  useEffect(() => {
    const unsub = subscribeToRooms(
      (firestoreRooms) => {
        if (firestoreRooms && firestoreRooms.length > 0) {
          setCustomRooms(firestoreRooms);
        }
      },
      (err) => {
        console.warn('Rooms Firestore subscription notice:', err);
      }
    );
    return () => unsub();
  }, []);

  // Real-time Firestore sync for guest reservations across all devices
  useEffect(() => {
    const unsub = subscribeToBookings(
      (firestoreBookings) => {
        if (firestoreBookings && firestoreBookings.length > 0) {
          setBookings(firestoreBookings);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          setSyncError(null);
        } else if (firestoreBookings && firestoreBookings.length === 0) {
          // If Firestore is empty on initial setup, seed it with the current bookings & rooms
          syncAllBookingsToFirestore(bookings)
            .then(() => {
              syncAllRoomsToFirestore(customRooms);
              setSyncStatus('synced');
              setLastSyncedAt(new Date());
              setSyncError(null);
            })
            .catch(err => {
              console.warn('Initial seeding notice:', err);
              setSyncStatus('synced');
            });
        }
      },
      (err: any) => {
        console.warn('Bookings Firestore subscription notice:', err);
        setSyncStatus('unsynced');
        setSyncError(err?.message || 'Database connection error');
      }
    );
    return () => unsub();
  }, []);

  // Manual Database Synchronization Trigger
  const syncDatabase = async () => {
    setIsSyncingDatabase(true);
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      // 1. Push all current local bookings to cloud Firestore
      await syncAllBookingsToFirestore(bookings);
      // 2. Push all rooms to cloud Firestore
      await syncAllRoomsToFirestore(customRooms);
      // 3. Re-fetch latest from Firestore to confirm consistency
      const remoteBookings = await fetchAllBookingsFromFirestore();
      if (remoteBookings && remoteBookings.length > 0) {
        setBookings(remoteBookings);
      }
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      showToast('Database synchronization complete! All changes are live on the cloud.');
    } catch (err: any) {
      console.error('Manual sync error:', err);
      setSyncStatus('unsynced');
      setSyncError(err?.message || 'Database sync failed');
      showToast('Sync issue: please check internet connection.');
    } finally {
      setIsSyncingDatabase(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      setIsConnectingCalendar(true);
      const res = await signInWithGoogleForCalendar();
      setGoogleUser(res.user);
      setGoogleToken(res.accessToken);
      showToast(`Connected to Google Calendar as ${res.user.email}`);
      const evts = await fetchCalendarEvents(res.accessToken);
      setCalendarEvents(evts);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to connect Google Calendar');
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await signOutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      setCalendarEvents([]);
      showToast('Google Calendar disconnected');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to disconnect');
    }
  };

  const nightsCount = useMemo(() => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff));
  }, [checkInDate, checkOutDate]);

  const checkDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    if (start2 === end2) {
      return start1 <= start2 && start2 < end1;
    }
    if (start1 === end1) {
      return start2 <= start1 && start1 < end2;
    }
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 < e2 && s2 < e1;
  };

  // Dynamically compute real-time room occupancies for the current operating date
  const rooms: Room[] = useMemo(() => {
    const today = HOSTEL_CONFIG.operatingDate;

    return customRooms.map(baseRoom => {
      // Find active bookings on today for this room (occupying a bed tonight)
      const activeBookings = bookings.filter(b => {
        if (b.roomId !== baseRoom.id) return false;
        if (b.status === 'Cancelled' || b.status === 'Checked-out') return false;
        return b.checkIn <= today && today < b.checkOut;
      });

      let bookedBeds = 0;
      if (baseRoom.type === 'dorm') {
        bookedBeds = activeBookings.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
      } else {
        bookedBeds = activeBookings.length > 0 ? baseRoom.totalBeds : 0;
      }
      bookedBeds = Math.min(baseRoom.totalBeds, bookedBeds);
      const freeBeds = Math.max(0, baseRoom.totalBeds - bookedBeds);

      return {
        ...baseRoom,
        bookedBeds,
        freeBeds
      };
    });
  }, [customRooms, bookings]);

  // Compute availability for specific requested check-in / check-out dates
  const getAvailabilityForDates = useMemo(() => {
    return (inDate: string, outDate: string): AvailabilityStatus[] => {
      return rooms.map(room => {
        const clashingBookings = bookings.filter(b => {
          if (b.roomId !== room.id) return false;
          if (b.status === 'Cancelled' || b.status === 'Checked-out') return false;
          return checkDateOverlap(b.checkIn, b.checkOut, inDate, outDate);
        });

        let bookedBedsOnDates = 0;
        if (room.type === 'dorm') {
          bookedBedsOnDates = clashingBookings.reduce((acc, b) => acc + (b.guestsCount || 1), 0);
        } else {
          bookedBedsOnDates = clashingBookings.length > 0 ? room.totalBeds : 0;
        }

        const freeBedsOnDates = Math.max(0, room.totalBeds - bookedBedsOnDates);
        const isAvailable = freeBedsOnDates > 0;

        let statusLabel: 'Available' | 'Limited Availability' | 'Sold Out' = 'Available';
        if (freeBedsOnDates === 0) {
          statusLabel = 'Sold Out';
        } else if (freeBedsOnDates <= 2) {
          statusLabel = 'Limited Availability';
        }

        return {
          room,
          isAvailable,
          freeBedsOnDates,
          bookedBedsOnDates,
          clashingBookings,
          statusLabel
        };
      });
    };
  }, [rooms, bookings]);

  // Format currency helpers
  const formatPrice = (amountTZS: number, targetCurr?: SupportedCurrency) => {
    const c = targetCurr || currency;
    const rate = exchangeRates[c] || 1;
    const converted = amountTZS / rate;
    
    if (c === 'USD') {
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (c === 'EUR') {
      return `€${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (c === 'GBP') {
      return `£${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `TZS ${Math.round(amountTZS).toLocaleString('en-US')}`;
  };

  const formatPriceDual = (amountTZS: number): { primary: string; secondary: string } => {
    const primary = formatPrice(amountTZS, currency);
    let secondary = '';
    if (currency === 'TZS') {
      const usdVal = Math.round(amountTZS / (exchangeRates.USD || 2650));
      secondary = `≈ $${usdVal.toLocaleString('en-US')}`;
    } else {
      secondary = `≈ TZS ${Math.round(amountTZS).toLocaleString('en-US')}`;
    }
    return { primary, secondary };
  };

  const openNewBookingDrawer = (initialData?: { roomId?: string; checkIn?: string; checkOut?: string }) => {
    if (initialData?.roomId) {
      const found = rooms.find(r => r.id === initialData.roomId);
      if (found) setSelectedRoomForBooking(found);
    } else if (rooms.length > 0) {
      setSelectedRoomForBooking(rooms[0]);
    }
    if (initialData?.checkIn) setCheckInDate(initialData.checkIn);
    if (initialData?.checkOut) setCheckOutDate(initialData.checkOut);
    setIsNewBookingOpen(true);
  };

  const quickCheckIn = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Checked-in' as const } : b))
    );
    showToast(`Guest checked in successfully.`);
  };

  const quickCheckOut = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Checked-out' as const } : b))
    );
    showToast(`Guest checked out.`);
  };

  const quickCollectPayment = (bookingId: string, amountTZS?: number) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id !== bookingId) return b;
        const payAmount = amountTZS !== undefined ? amountTZS : b.balanceDueTZS;
        const newPaid = b.depositPaidTZS + payAmount;
        const newBalance = Math.max(0, b.stayTotalTZS - newPaid);
        return {
          ...b,
          depositPaidTZS: newPaid,
          balanceDueTZS: newBalance
        };
      })
    );
    showToast('Payment recorded and balance updated.');
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch {}
    setIsAuthenticated(false);
    setAuthSession(null);
    showToast(`Signed out of session for ${currentUser.name}.`);
  };

  const formatInCurrency = (amount: number, curr: SupportedCurrency) => {
    if (curr === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (curr === 'EUR') {
      return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (curr === 'GBP') {
      return `£${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `TZS ${Math.round(amount).toLocaleString('en-US')}`;
  };

  const formatTZSOnly = (amountTZS: number) => {
    return `TZS ${Math.round(amountTZS).toLocaleString('en-US')}`;
  };

  const formatUSDOnly = (amountUSD: number) => {
    return `$${amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const openBookingModal = (room: Room) => {
    setSelectedRoomForBooking(room);
  };

  const closeBookingModal = () => {
    setSelectedRoomForBooking(null);
  };

  // Calendar sync modal triggers
  const syncBookingEvent = async (booking: Booking, actionType: 'create' | 'update' | 'delete' = 'create') => {
    if (!googleToken) {
      showToast('Please connect Google Calendar in the header first.');
      return;
    }
    setCalendarConfirmModal({
      isOpen: true,
      booking,
      actionType,
      eventId: booking.googleCalendarEventId
    });
  };

  const executeCalendarAction = async () => {
    if (!calendarConfirmModal || !googleToken) return;
    try {
      setIsSyncingBooking(true);
      const b = calendarConfirmModal.booking;
      if (calendarConfirmModal.actionType === 'create' || calendarConfirmModal.actionType === 'update') {
        const calEvent = await syncBookingToGoogleCalendar(googleToken, b);
        setBookings(prev =>
          prev.map(item =>
            item.id === b.id
              ? { ...item, syncedToGoogleCalendar: true, googleCalendarEventId: calEvent.id }
              : item
          )
        );
        showToast(`Synced reservation ${b.id} to Google Calendar!`);
        const updated = await fetchCalendarEvents(googleToken);
        setCalendarEvents(updated);
      } else if (calendarConfirmModal.actionType === 'delete' && calendarConfirmModal.eventId) {
        await deleteCalendarEvent(googleToken, calendarConfirmModal.eventId);
        setBookings(prev =>
          prev.map(item =>
            item.id === b.id
              ? { ...item, syncedToGoogleCalendar: false, googleCalendarEventId: undefined }
              : item
          )
        );
        showToast('Event removed from Google Calendar');
        const updated = await fetchCalendarEvents(googleToken);
        setCalendarEvents(updated);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Google Calendar action failed');
    } finally {
      setIsSyncingBooking(false);
      setCalendarConfirmModal(null);
    }
  };

  // Create a new direct booking
  const submitNewBooking = async ({
    roomId,
    guestName,
    email,
    phone,
    checkIn,
    checkOut,
    guestsCount: gCount,
    paymentMethod,
    status = 'Confirmed',
    specialRequests,
    isDepositOnly,
    syncToGoogleCal,
    recordedCurrency,
    recordedTotalAmount,
    recordedDepositAmount
  }: {
    roomId: string;
    guestName: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    paymentMethod: PaymentMethod;
    status?: BookingStatus;
    specialRequests?: string;
    isDepositOnly?: boolean;
    syncToGoogleCal?: boolean;
    recordedCurrency?: SupportedCurrency;
    recordedTotalAmount?: number;
    recordedDepositAmount?: number;
  }): Promise<Booking> => {
    const targetRoom = rooms.find(r => r.id === roomId) || rooms[0];

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const n = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const payCurr: SupportedCurrency = recordedCurrency || currency || 'USD';
    const rateToTZS = exchangeRates[payCurr] || 1;

    let totalTZS = 0;
    let totalInPayCurr = 0;

    if (recordedTotalAmount !== undefined && recordedTotalAmount > 0) {
      totalInPayCurr = recordedTotalAmount;
      totalTZS = Math.round(totalInPayCurr * rateToTZS);
    } else {
      if (targetRoom.type === 'dorm') {
        totalTZS = targetRoom.pricePerNightTZS * n * Math.max(1, gCount);
      } else {
        totalTZS = targetRoom.pricePerNightTZS * n;
      }
      totalInPayCurr = payCurr === 'TZS' ? totalTZS : Number((totalTZS / rateToTZS).toFixed(2));
    }

    const totalUSD = Number((totalTZS / (exchangeRates.USD || 2650)).toFixed(2));
    
    let depositTZS = 0;
    let depositInPayCurr = 0;
    let paymentStatus: 'Paid in Full' | 'Deposit Paid' | 'Pay at Check-in' = 'Pay at Check-in';

    if (paymentMethod === 'front_desk') {
      depositTZS = 0;
      depositInPayCurr = 0;
      paymentStatus = 'Pay at Check-in';
    } else if (recordedDepositAmount !== undefined) {
      depositInPayCurr = recordedDepositAmount;
      depositTZS = Math.round(depositInPayCurr * rateToTZS);
      paymentStatus = depositTZS >= totalTZS ? 'Paid in Full' : (depositTZS > 0 ? 'Deposit Paid' : 'Pay at Check-in');
    } else if (isDepositOnly) {
      depositTZS = Math.round(totalTZS * 0.4);
      depositInPayCurr = payCurr === 'TZS' ? depositTZS : Number((depositTZS / rateToTZS).toFixed(2));
      paymentStatus = 'Deposit Paid';
    } else {
      depositTZS = totalTZS;
      depositInPayCurr = totalInPayCurr;
      paymentStatus = 'Paid in Full';
    }

    const balanceTZS = Math.max(0, totalTZS - depositTZS);

    const existingNums = bookings
      .map(b => parseInt(b.id.replace('MU-', ''), 10))
      .filter(num => !isNaN(num));
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    const bookingId = `MU-${nextNum}`;

    const randomGuestNum = Math.floor(100000 + Math.random() * 900000);
    const guestId = `G-${randomGuestNum}`;

    const newBooking: Booking = {
      id: bookingId,
      guestName: guestName.trim(),
      guestId,
      email: email.trim(),
      phone: phone.trim(),
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      checkIn,
      checkOut,
      nights: n,
      guestsCount: gCount,
      status: status || 'Confirmed',
      platform: 'Direct Booking',
      stayTotalTZS: totalTZS,
      stayTotalUSD: totalUSD,
      depositPaidTZS: depositTZS,
      balanceDueTZS: balanceTZS,
      recordedCurrency: payCurr,
      recordedTotalAmount: totalInPayCurr,
      recordedDepositAmount: depositInPayCurr,
      discountPercent: 0,
      loyaltyStatus: 'Direct Booking',
      paymentMethod,
      paymentStatus,
      specialRequests: specialRequests?.trim() || '',
      createdAt: HOSTEL_CONFIG.operatingDate
    };

    // If Google Calendar is connected and requested, auto-sync
    if (syncToGoogleCal && googleToken) {
      try {
        const calEvent = await syncBookingToGoogleCalendar(googleToken, newBooking);
        newBooking.syncedToGoogleCalendar = true;
        newBooking.googleCalendarEventId = calEvent.id;
      } catch (err) {
        console.warn('Auto sync to Google Calendar failed:', err);
      }
    }

    // Real-time availability reflects immediately!
    setBookings(prev => [newBooking, ...prev]);
    setSelectedRoomForBooking(null);
    setCompletedBooking(newBooking);

    // Persist live to Firestore database with sync state updates
    setSyncStatus('syncing');
    saveBookingToFirestore(newBooking)
      .then(() => {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setSyncError(null);
      })
      .catch(err => {
        console.warn('Firestore booking save fallback:', err);
        setSyncStatus('unsynced');
        setSyncError(err?.message || 'Database write failed');
      });

    showToast(`Reservation ${bookingId} (${newBooking.status}) created & synced to database!`);
    return newBooking;
  };

  // Update booking status
  const updateBookingStatus = (id: string, newStatus: BookingStatus) => {
    let updatedBooking: Booking | undefined;
    setBookings(prev =>
      prev.map(b => {
        if (b.id === id) {
          updatedBooking = { ...b, status: newStatus };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) {
      setSyncStatus('syncing');
      saveBookingToFirestore(updatedBooking)
        .then(() => {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          setSyncError(null);
        })
        .catch(err => {
          console.warn('Firestore booking status update fallback:', err);
          setSyncStatus('unsynced');
          setSyncError(err?.message || 'Database update failed');
        });
    }
    showToast(`Booking ${id} status changed to ${newStatus}`);
  };

  // Cancel booking (frees up room availability immediately!)
  const cancelBooking = (id: string) => {
    let updatedBooking: Booking | undefined;
    setBookings(prev =>
      prev.map(b => {
        if (b.id === id) {
          updatedBooking = { ...b, status: 'Cancelled' as BookingStatus };
          return updatedBooking;
        }
        return b;
      })
    );
    if (updatedBooking) {
      setSyncStatus('syncing');
      saveBookingToFirestore(updatedBooking)
        .then(() => {
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          setSyncError(null);
        })
        .catch(err => {
          console.warn('Firestore booking cancel fallback:', err);
          setSyncStatus('unsynced');
        });
    }
    showToast(`Booking ${id} cancelled. Room is now immediately available.`);
  };

  // Delete booking record permanently
  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setSyncStatus('syncing');
    deleteBookingFromFirestore(id)
      .then(() => {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setSyncError(null);
      })
      .catch(err => {
        console.warn('Firestore booking delete fallback:', err);
        setSyncStatus('unsynced');
      });
    showToast(`Booking ${id} record removed.`);
  };

  // Compute live operating overview stats
  const stats: OperatingStats = useMemo(() => {
    const today = HOSTEL_CONFIG.operatingDate;

    const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
    const checkedInCount = bookings.filter(b => b.status === 'Checked-in').length;
    const tentativeCount = bookings.filter(b => b.status === 'Tentative').length;
    const checkedOutCount = bookings.filter(b => b.status === 'Checked-out').length;
    const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;

    const arrivalsToday = bookings.filter(
      b => b.checkIn === today && (b.status === 'Confirmed' || b.status === 'Checked-in')
    ).length;
    const departuresToday = bookings.filter(
      b => b.checkOut === today && b.status !== 'Cancelled'
    ).length;

    // Confirmed, checked-in and checked-out count towards revenue (Cancelled excluded)
    const revenueEligible = bookings.filter(
      b => b.status === 'Confirmed' || b.status === 'Checked-in' || b.status === 'Checked-out'
    );

    const grossBookingValueTZS = revenueEligible.reduce((sum, b) => sum + b.stayTotalTZS, 0);
    const depositsReceivedTZS = revenueEligible.reduce((sum, b) => sum + b.depositPaidTZS, 0);
    const outstandingBalanceTZS = revenueEligible.reduce((sum, b) => sum + b.balanceDueTZS, 0);
    const grossBookingValueUSD = Number((grossBookingValueTZS / (exchangeRates.USD || 2650)).toFixed(2));

    const totalBeds = rooms.reduce((sum, r) => sum + r.totalBeds, 0);
    const bookedBeds = rooms.reduce((sum, r) => sum + r.bookedBeds, 0);
    const freeBeds = Math.max(0, totalBeds - bookedBeds);

    return {
      operatingDate: HOSTEL_CONFIG.operatingDate,
      revenueMonth: HOSTEL_CONFIG.revenueMonth,
      totalRooms: rooms.length,
      totalBeds,
      bookedBeds,
      freeBeds,
      holdBeds: 0,
      arrivalsToday,
      departuresToday,
      grossBookingValueTZS,
      grossBookingValueUSD,
      depositsReceivedTZS,
      netReceivedTZS: depositsReceivedTZS,
      outstandingBalanceTZS,
      confirmedCount,
      checkedInCount,
      tentativeCount,
      checkedOutCount,
      cancelledCount,
      bookingIssues: 0,
      assignmentIssues: 0
    };
  }, [bookings, rooms, exchangeRates]);

  const todayDateStr = HOSTEL_CONFIG.operatingDate;

  const arrivingTodayList = useMemo(() => {
    return bookings.filter(
      b => b.checkIn === todayDateStr && (b.status === 'Confirmed' || b.status === 'Checked-in')
    );
  }, [bookings, todayDateStr]);

  const departuresTodayList = useMemo(() => {
    return bookings.filter(
      b => b.checkOut === todayDateStr && b.status !== 'Cancelled'
    );
  }, [bookings, todayDateStr]);

  const checkedInList = useMemo(() => {
    return bookings.filter(b => b.status === 'Checked-in');
  }, [bookings]);

  const bookedTonightBeds = useMemo(() => {
    return rooms.reduce((sum, r) => sum + r.bookedBeds, 0);
  }, [rooms]);

  const freeTonightBeds = useMemo(() => {
    const total = rooms.reduce((sum, r) => sum + r.totalBeds, 0);
    return Math.max(0, total - bookedTonightBeds);
  }, [rooms, bookedTonightBeds]);

  const outstandingPaymentsList = useMemo(() => {
    return bookings.filter(
      b => b.balanceDueTZS > 0 && b.status !== 'Cancelled' && b.status !== 'Checked-out'
    );
  }, [bookings]);

  return (
    <BookingContext.Provider
      value={{
        syncStatus,
        lastSyncedAt,
        syncError,
        isSyncingDatabase,
        syncDatabase,
        userRole,
        setUserRole,
        users,
        currentUser,
        setCurrentUser: (u) => switchUser(u.id),
        switchUser,
        createUser,
        updateUser,
        deleteUser,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isUserManagementOpen,
        setIsUserManagementOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        profileUserToEdit,
        setProfileUserToEdit,
        openProfileModal,
        closeProfileModal,
        canManageUsers,
        isAdmin,
        rooms,
        bookings,
        currency,
        setCurrency,
        exchangeRates,
        updateExchangeRate,
        convertAmount,
        formatPrice,
        formatPriceDual,
        formatInCurrency,
        formatUSDOnly,
        formatTZSOnly,
        activeTab,
        setActiveTab,
        checkInDate,
        setCheckInDate,
        checkOutDate,
        setCheckOutDate,
        nightsCount,
        guestsCount,
        setGuestsCount,
        getAvailabilityForDates,
        checkDateOverlap,
        selectedRoomForBooking,
        openBookingModal,
        closeBookingModal,
        completedBooking,
        setCompletedBooking,
        submitNewBooking,
        updateBookingStatus,
        cancelBooking,
        deleteBooking,
        googleUser,
        googleToken,
        isConnectingCalendar,
        calendarEvents,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncBookingEvent,
        isSyncingBooking,
        calendarConfirmModal,
        setCalendarConfirmModal,
        executeCalendarAction,
        stats,
        toastMessage,
        showToast,
        theme,
        setTheme,
        basePricePerNightTZS,
        updateOverallBasePrice,
        addRoom,
        updateRoom,
        deleteRoom,
        autoSyncExchangeRates,
        setAutoSyncExchangeRates,
        lastRateSyncTime,
        isSyncingRates,
        syncGlobalExchangeRates,
        lastBackgroundRefresh,
        isOnline,
        searchQuery,
        setSearchQuery,
        showDevProfileSwitcher,
        setShowDevProfileSwitcher,
        isNewBookingOpen,
        setIsNewBookingOpen,
        openNewBookingDrawer,
        quickCheckIn,
        quickCheckOut,
        quickCollectPayment,
        signOut,
        isAuthenticated,
        authSession,
        currentUserPermissions,
        hasPermission,
        handleLoginSuccess,
        isAssignRoleOpen,
        assignRoleTargetUser,
        openAssignRoleModal,
        closeAssignRoleModal,
        canManageRoles,
        arrivingTodayList,
        departuresTodayList,
        checkedInList,
        bookedTonightBeds,
        freeTonightBeds,
        outstandingPaymentsList
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
