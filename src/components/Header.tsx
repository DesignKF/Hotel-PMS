import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { SupportedCurrency } from '../types';
import { 
  Menu,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  CircleDot,
  WifiOff,
  Bell
} from 'lucide-react';
import { HOSTEL_CONFIG } from '../data/initialData';
import { NotificationCenter } from './NotificationCenter';

export const Header: React.FC = () => {
  const {
    activeTab,
    currency,
    setCurrency,
    setIsMobileSidebarOpen,
    openNewBookingDrawer,
    searchQuery,
    setSearchQuery,
    googleToken,
    googleUser,
    setActiveTab,
    isOnline,
    arrivingTodayList,
    departuresTodayList,
    outstandingPaymentsList,
    syncStatus,
    lastSyncedAt,
    syncError,
    isSyncingDatabase,
    syncDatabase
  } = useBooking();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const formattedLastSync = lastSyncedAt 
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const pendingConcernsCount = 
    arrivingTodayList.length + 
    departuresTodayList.length + 
    outstandingPaymentsList.filter(b => b.checkIn <= HOSTEL_CONFIG.operatingDate || b.status === 'Checked-in').length;

  // Keyboard shortcut: Press 'N' to open New Booking modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openNewBookingDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openNewBookingDrawer]);

  const pageTitles: Record<string, string> = {
    overview: 'Overview',
    bookings: 'Bookings',
    availability: 'Availability',
    rooms: 'Rooms & Guests',
    sync: 'Calendar Sync',
    settings: 'Settings & Integrations'
  };

  const currencies: SupportedCurrency[] = ['USD', 'TZS', 'EUR', 'GBP'];

  return (
    <>
      <header className="bg-surface-1 text-primary border-b border-subtle sticky top-0 z-30 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Mobile hamburger & Page Title (shown once) */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-2 transition-colors cursor-pointer"
              title="Open Navigation"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-sm font-semibold text-primary hidden sm:inline-block">
              {pageTitles[activeTab] || 'Hostel PMS'}
            </span>
          </div>

          {/* Center: Global Search */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative">
              <Search className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search guest, MU-001, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-2 hover:bg-surface-3 focus:bg-surface-1 text-primary placeholder:text-tertiary !pl-10 pr-3 py-1.5 rounded-xl text-xs font-normal border border-subtle focus:border-[var(--primary-gold)] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Currency Segmented Control, Truthful Sync Chip & Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Live Database Sync Indicator & Manual Sync Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => syncDatabase()}
                disabled={isSyncingDatabase}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  syncStatus === 'synced'
                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)] hover:opacity-90'
                    : syncStatus === 'syncing'
                    ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]'
                    : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[var(--status-danger-border)] hover:opacity-90 animate-pulse'
                }`}
                title={
                  syncStatus === 'synced'
                    ? `Database synchronized live (Last: ${formattedLastSync}). Click to verify.`
                    : syncStatus === 'syncing'
                    ? 'Synchronizing changes with database...'
                    : `Unsynced changes! Click to synchronize with database (${syncError || 'Pending'})`
                }
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-[var(--status-warning-text)]" />
                ) : syncStatus === 'synced' ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-success-text)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--status-success-text)]"></span>
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[var(--status-danger-text)]" />
                )}

                <span className="hidden sm:inline">
                  {syncStatus === 'synced' ? 'Database Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Unsynced'}
                </span>
                <span className="sm:hidden">
                  {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : 'Unsynced'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => syncDatabase()}
                disabled={isSyncingDatabase}
                className="p-1.5 rounded-xl text-secondary hover:text-primary hover:bg-surface-2 transition-colors cursor-pointer border border-subtle disabled:opacity-50"
                title={`Manually synchronize database now (Last sync: ${formattedLastSync})`}
                aria-label="Synchronize database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDatabase ? 'animate-spin text-[var(--primary-gold)]' : ''}`} />
              </button>
            </div>

            {/* Truthful Google Calendar Sync chip */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                googleToken
                  ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]'
                  : 'bg-surface-2 text-secondary border-subtle hover:bg-surface-3'
              }`}
              title={googleToken ? `Google Calendar connected: ${googleUser?.email || 'Active'}` : 'Click to connect Google Calendar'}
            >
              <span className={`w-2 h-2 rounded-full ${googleToken ? 'bg-[var(--status-success-text)]' : 'bg-tertiary'}`} />
              <span>{googleToken ? 'Calendar connected' : 'Calendar not connected'}</span>
            </button>

            {/* Offline Chip if offline */}
            {!isOnline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </span>
            )}

            {/* Compact Currency Segmented Control */}
            <div className="flex items-center bg-surface-2 p-0.5 rounded-xl border border-subtle text-xs font-semibold">
              {currencies.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    currency === c
                      ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs font-bold'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Operational Concerns & Notifications Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-2 transition-colors cursor-pointer border border-subtle"
              title="Operational Concerns & Handover Notes"
              aria-label="Open notifications"
            >
              <Bell className="w-5 h-5" />
              {pendingConcernsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--primary-gold)] text-[var(--primary-gold-text)] font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {pendingConcernsCount}
                </span>
              )}
            </button>

            {/* Primary Action Button: Solid Gold #E3B04B, Navy text, 40px tall */}
            <button
              type="button"
              onClick={() => openNewBookingDrawer()}
              className="btn-primary"
              title="Create Reservation"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline font-semibold">Create Reservation</span>
            </button>

          </div>

        </div>
      </header>

      {/* Operational Concerns Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Mobile Floating Action Button (FAB) for Create Reservation */}
      <button
        type="button"
        onClick={() => openNewBookingDrawer()}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xl flex items-center justify-center cursor-pointer border-2 border-surface-1 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        title="Create Reservation"
        aria-label="Create Reservation"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>
    </>
  );
};
