import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeader } from './PageHeader';
import { AppTheme } from '../types';
import { 
  RefreshCw, 
  Calendar as CalendarIcon, 
  LogOut, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight,
  Database,
  Plus,
  Trash2,
  Pencil,
  Bed,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Room } from '../types';
import { EditRoomModal } from './EditRoomModal';

type SettingsTab = 'rooms' | 'pricing' | 'currencies' | 'theme' | 'integrations' | 'offline';

export const SettingsView: React.FC = () => {
  const {
    rooms,
    addRoom,
    deleteRoom,
    basePricePerNightTZS,
    updateOverallBasePrice,
    theme,
    setTheme,
    autoSyncExchangeRates,
    setAutoSyncExchangeRates,
    lastRateSyncTime,
    isSyncingRates,
    syncGlobalExchangeRates,
    exchangeRates,
    updateExchangeRate,
    googleUser,
    googleToken,
    isConnectingCalendar,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    calendarEvents,
    bookings,
    syncBookingEvent,
    isSyncingBooking,
    isOnline,
    showDevProfileSwitcher,
    setShowDevProfileSwitcher,
    showToast
  } = useBooking();

  const [activeSubtab, setActiveSubtab] = useState<SettingsTab>('rooms');

  // Add Room Form State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newSingleBeds, setNewSingleBeds] = useState(1);
  const [newBunkBeds, setNewBunkBeds] = useState(1);
  const [newRoomPrice, setNewRoomPrice] = useState(basePricePerNightTZS);
  const [newRoomTagline, setNewRoomTagline] = useState('Clean & comfortable backpacker accommodation');
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Overall Base Price Form State
  const [tempBasePrice, setTempBasePrice] = useState(basePricePerNightTZS);
  const [applyToAllRooms, setApplyToAllRooms] = useState(true);

  // Manual Rates Form State
  const [manualUSD, setManualUSD] = useState(exchangeRates.USD);
  const [manualEUR, setManualEUR] = useState(exchangeRates.EUR);
  const [manualGBP, setManualGBP] = useState(exchangeRates.GBP);

  useEffect(() => {
    setTempBasePrice(basePricePerNightTZS);
  }, [basePricePerNightTZS]);

  useEffect(() => {
    setManualUSD(exchangeRates.USD);
    setManualEUR(exchangeRates.EUR);
    setManualGBP(exchangeRates.GBP);
  }, [exchangeRates.USD, exchangeRates.EUR, exchangeRates.GBP]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomCode.trim()) {
      showToast('Please enter room name and code.');
      return;
    }

    addRoom({
      name: newRoomName.trim(),
      roomCode: newRoomCode.trim().toUpperCase(),
      type: 'dorm',
      singleBeds: Number(newSingleBeds),
      bunkBeds: Number(newBunkBeds),
      pricePerNightTZS: Number(newRoomPrice),
      bathroom: 'Shared Hot Water Shower',
      tagline: newRoomTagline.trim(),
      description: `${newRoomName.trim()} with ${newSingleBeds} single bed(s) and ${newBunkBeds} sturdy bunk bed(s). Perfect for backpackers and travelers exploring Mount Kilimanjaro.`,
      amenities: ['High-Speed Wi-Fi', 'Solar Hot Water 24/7', 'Daily Housekeeping', 'Individual Lockers']
    });

    setNewRoomName('');
    setNewRoomCode('');
    setNewSingleBeds(1);
    setNewBunkBeds(1);
    setIsAddingRoom(false);
  };

  const handleSaveBasePrice = (e: React.FormEvent) => {
    e.preventDefault();
    updateOverallBasePrice(Number(tempBasePrice), applyToAllRooms);
  };

  const handleSaveManualRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateExchangeRate('USD', Number(manualUSD));
    updateExchangeRate('EUR', Number(manualEUR));
    updateExchangeRate('GBP', Number(manualGBP));
    showToast('Custom exchange rates saved successfully.');
  };

  const syncedCount = bookings.filter(b => b.syncedToGoogleCalendar).length;
  const unsyncedUpcoming = bookings.filter(
    b => !b.syncedToGoogleCalendar && b.status === 'Confirmed'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Hostel rooms & bed inventory, nightly pricing, live global currency synchronization, themes, and integrations."
      />

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-subtle pb-2 overflow-x-auto">
        {[
          { id: 'rooms', label: 'Rooms & Beds' },
          { id: 'pricing', label: 'Nightly Pricing' },
          { id: 'currencies', label: 'Currencies & Rates' },
          { id: 'theme', label: 'App Theme' },
          { id: 'integrations', label: 'Google Calendar' },
          { id: 'offline', label: 'Offline & System' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubtab(tab.id as SettingsTab)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 ${
              activeSubtab === tab.id
                ? 'bg-surface-3 text-primary font-bold border border-strong'
                : 'text-secondary hover:text-primary hover:bg-surface-2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ROOMS & BEDS (Single / Bunker) */}
      {activeSubtab === 'rooms' && (
        <div className="space-y-6">
          <div className="card-surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-subtle">
              <div>
                <h3 className="text-base font-semibold text-primary">
                  Hostel Rooms &amp; Bed Configuration
                </h3>
                <p className="text-xs text-secondary">
                  Manage dorms, private rooms, and bed distribution (single beds vs. bunk beds).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingRoom(!isAddingRoom)}
                className="btn-secondary !h-9 !text-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingRoom ? 'Cancel' : 'Add New Room'}</span>
              </button>
            </div>

            {/* New Room Form */}
            {isAddingRoom && (
              <form onSubmit={handleCreateRoom} className="p-4 bg-surface-2 rounded-xl border border-subtle space-y-4 animate-in fade-in duration-150">
                <h4 className="text-sm font-semibold text-primary">
                  Add New Hostel Room
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-primary">Room Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Serengeti Safari Dorm"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="input-surface w-full !text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-primary">Room Code (Short ID) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. R5"
                      value={newRoomCode}
                      onChange={(e) => setNewRoomCode(e.target.value)}
                      className="input-surface w-full !text-xs uppercase"
                    />
                  </div>
                </div>

                {/* Bed Allocation: Single / Bunker Beds */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-surface-1 p-3 rounded-xl border border-subtle">
                  <div className="space-y-1">
                    <label className="font-semibold text-primary">Single Beds</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={newSingleBeds}
                      onChange={(e) => setNewSingleBeds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="input-surface w-full !text-xs font-semibold"
                    />
                    <span className="text-[11px] text-tertiary block">1 person capacity each</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-primary">Bunker (Bunk) Beds</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={newBunkBeds}
                      onChange={(e) => setNewBunkBeds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="input-surface w-full !text-xs font-semibold"
                    />
                    <span className="text-[11px] text-tertiary block">2 beds per bunker</span>
                  </div>

                  <div className="space-y-1 flex flex-col justify-between">
                    <span className="font-semibold text-primary">Calculated Capacity</span>
                    <div className="p-2 bg-surface-2 border border-subtle rounded-xl text-primary font-semibold text-sm">
                      {Number(newSingleBeds) + (Number(newBunkBeds) * 2)} Total Beds
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-primary">Nightly Rate per Bed (TZS)</label>
                    <input
                      type="number"
                      value={newRoomPrice}
                      onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                      className="input-surface w-full !text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-primary">Tagline</label>
                    <input
                      type="text"
                      value={newRoomTagline}
                      onChange={(e) => setNewRoomTagline(e.target.value)}
                      className="input-surface w-full !text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRoom(false)}
                    className="btn-secondary !h-8 !px-3 !text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !h-8 !px-3 !text-xs"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            )}

            {/* List of current rooms */}
            <div className="divide-y divide-subtle">
              {rooms.map((room) => (
                <div key={room.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm sm:text-base text-primary">{room.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-primary font-semibold border border-subtle">
                        {room.roomCode}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-secondary font-medium">
                        {room.totalBeds} beds ({room.singleBeds || 0} single + {room.bunkBeds || 0} bunks)
                      </span>
                      <span className="text-xs font-semibold text-[var(--primary-gold)]">
                        {room.pricePerNightTZS.toLocaleString()} TZS / bed
                      </span>
                    </div>

                    <p className="text-xs text-secondary line-clamp-1 max-w-xl">
                      {room.description || room.tagline}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {room.bathroom && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-2 text-tertiary border border-subtle">
                          🚿 {room.bathroom}
                        </span>
                      )}
                      {room.amenities?.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-2 text-tertiary border border-subtle">
                          {a}
                        </span>
                      ))}
                      {(room.amenities?.length || 0) > 3 && (
                        <span className="text-[11px] text-tertiary self-center">
                          +{(room.amenities?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingRoom(room)}
                      className="btn-secondary !h-8 !px-3 !text-xs cursor-pointer flex items-center gap-1.5"
                      title="Edit Room Particulars"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                      <span>Edit Particulars</span>
                    </button>

                    {rooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteRoom(room.id)}
                        className="p-1.5 rounded-lg text-secondary hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] transition-colors cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NIGHTLY PRICING */}
      {activeSubtab === 'pricing' && (
        <div className="card-surface p-5 space-y-4 max-w-xl">
          <div className="pb-3 border-b border-subtle">
            <h3 className="text-base font-semibold text-primary">
              Global Nightly Bed Pricing
            </h3>
            <p className="text-xs text-secondary">
              Update the standard default rate applied across all dorm beds in Tanzanian Shillings (TZS).
            </p>
          </div>

          <form onSubmit={handleSaveBasePrice} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-primary">
                Base Nightly Price (TZS per bed)
              </label>
              <input
                type="number"
                step="1000"
                value={tempBasePrice}
                onChange={(e) => setTempBasePrice(Number(e.target.value))}
                className="input-surface w-full !text-sm font-semibold"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAllRooms}
                onChange={(e) => setApplyToAllRooms(e.target.checked)}
                className="w-4 h-4 text-[var(--primary-gold)] rounded border-strong"
              />
              <span className="font-semibold text-primary">
                Update all existing rooms to this new base price
              </span>
            </label>

            {/* Currency Conversions Preview */}
            <div className="p-3 bg-surface-2 rounded-xl border border-subtle space-y-2">
              <span className="font-semibold text-primary block">
                Live Converted Values:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-surface-1 rounded-lg border border-subtle">
                  <span className="text-[11px] text-tertiary block">USD</span>
                  <span className="font-semibold text-primary">
                    ${(tempBasePrice / exchangeRates.USD).toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-surface-1 rounded-lg border border-subtle">
                  <span className="text-[11px] text-tertiary block">EUR</span>
                  <span className="font-semibold text-primary">
                    €{(tempBasePrice / exchangeRates.EUR).toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-surface-1 rounded-lg border border-subtle">
                  <span className="text-[11px] text-tertiary block">GBP</span>
                  <span className="font-semibold text-primary">
                    £{(tempBasePrice / exchangeRates.GBP).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-secondary !h-9 !text-xs">
              <span>Save Base Price</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CURRENCIES & LIVE EXCHANGE RATES */}
      {activeSubtab === 'currencies' && (
        <div className="space-y-6 max-w-2xl">
          {/* Automatic Synchronization */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-subtle">
              <div>
                <h3 className="text-base font-semibold text-primary">
                  Automatic Live Currency Sync
                </h3>
                <p className="text-xs text-secondary">
                  Synchronize USD, EUR, and GBP with global exchange rates in the background.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoSyncExchangeRates(!autoSyncExchangeRates)}
                className="cursor-pointer"
                title="Toggle automatic global rate sync"
              >
                {autoSyncExchangeRates ? (
                  <ToggleRight className="w-8 h-8 text-[var(--primary-gold)]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-tertiary" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-primary block">
                  Status: {autoSyncExchangeRates ? 'Automatic sync active' : 'Manual mode active'}
                </span>
                <span className="text-secondary block text-[11px]">
                  {autoSyncExchangeRates 
                    ? 'Background engine refreshes rates every 60 seconds automatically without interrupting staff operations.' 
                    : 'Rates will remain fixed until updated manually.'}
                </span>
                {lastRateSyncTime && (
                  <span className="text-[11px] text-[var(--status-success-text)] block pt-1">
                    Last updated: {lastRateSyncTime}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => syncGlobalExchangeRates()}
                disabled={isSyncingRates}
                className="btn-secondary !h-8 !px-3 !text-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRates ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Manual Override */}
          <div className="card-surface p-5 space-y-4">
            <div className="pb-3 border-b border-subtle">
              <h3 className="text-base font-semibold text-primary">
                Manual Currency Override
              </h3>
              <p className="text-xs text-secondary">
                Override global market rates with custom rates in Tanzanian Shillings (TZS).
              </p>
            </div>

            <form onSubmit={handleSaveManualRates} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-primary">
                    1 USD in TZS
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={manualUSD}
                    onChange={(e) => setManualUSD(Number(e.target.value))}
                    className="input-surface w-full !text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-primary">
                    1 EUR in TZS
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={manualEUR}
                    onChange={(e) => setManualEUR(Number(e.target.value))}
                    className="input-surface w-full !text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-primary">
                    1 GBP in TZS
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={manualGBP}
                    onChange={(e) => setManualGBP(Number(e.target.value))}
                    className="input-surface w-full !text-xs font-semibold"
                  />
                </div>
              </div>

              <button type="submit" className="btn-secondary !h-9 !text-xs">
                <span>Save Custom Rates</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: APP THEME (Light, Dark, System) */}
      {activeSubtab === 'theme' && (
        <div className="card-surface p-5 space-y-4 max-w-xl">
          <div className="pb-3 border-b border-subtle">
            <h3 className="text-base font-semibold text-primary">
              App Theme &amp; Visual Appearance
            </h3>
            <p className="text-xs text-secondary">
              Select your interface preference with automatic system persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'light' as AppTheme,
                label: 'Light Mode',
                desc: 'Warm off-white & crisp navy',
                icon: Sun
              },
              {
                id: 'dark' as AppTheme,
                label: 'Dark Mode',
                desc: 'Deep navy night palette',
                icon: Moon
              },
              {
                id: 'system' as AppTheme,
                label: 'System Default',
                desc: 'Syncs with device settings',
                icon: Laptop
              }
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-[var(--primary-gold)] ring-2 ring-[var(--primary-gold)]/30 bg-surface-2'
                      : 'border-subtle hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--primary-gold)]' : 'text-secondary'}`} />
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--primary-gold)]" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-primary block">
                      {t.label}
                    </span>
                    <span className="text-[11px] text-tertiary block mt-0.5">
                      {t.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE CALENDAR INTEGRATION */}
      {activeSubtab === 'integrations' && (
        <div className="card-surface p-5 space-y-4 max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-2 text-primary flex items-center justify-center shrink-0 border border-subtle">
                <CalendarIcon className="w-5 h-5 text-[var(--status-info-text)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary">
                  Google Calendar Integration
                </h3>
                <p className="text-xs text-secondary">
                  Sync direct reservations with your staff and management calendar in real time.
                </p>
              </div>
            </div>

            <div>
              {googleToken ? (
                <div className="flex items-center gap-2">
                  <span className="badge-success">
                    <span className="w-2 h-2 rounded-full bg-[var(--status-success-text)]" />
                    <span>Connected ({googleUser?.email || 'Active'})</span>
                  </span>
                  <button
                    type="button"
                    onClick={disconnectGoogleCalendar}
                    className="btn-secondary !h-8 !px-2.5 !text-xs !text-[var(--status-danger-text)]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectGoogleCalendar}
                  disabled={isConnectingCalendar}
                  className="btn-secondary !h-9 !text-xs"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>{isConnectingCalendar ? 'Connecting...' : 'Connect Google Calendar'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sync Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-surface-2 rounded-xl border border-subtle">
              <span className="text-tertiary block mb-0.5">Synced Reservations</span>
              <span className="text-lg font-semibold text-primary tabular-nums">
                {syncedCount} / {bookings.length}
              </span>
            </div>

            <div className="p-3 bg-surface-2 rounded-xl border border-subtle">
              <span className="text-tertiary block mb-0.5">Pending Calendar Sync</span>
              <span className="text-lg font-semibold text-[var(--status-warning-text)] tabular-nums">
                {unsyncedUpcoming.length}
              </span>
            </div>

            <div className="p-3 bg-surface-2 rounded-xl border border-subtle">
              <span className="text-tertiary block mb-0.5">Calendar Events Retrieved</span>
              <span className="text-lg font-semibold text-primary tabular-nums">
                {calendarEvents.length}
              </span>
            </div>
          </div>

          {googleToken && unsyncedUpcoming.length > 0 && (
            <div className="p-4 bg-surface-2 rounded-xl border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-primary block">
                  {unsyncedUpcoming.length} upcoming reservations are not yet synced
                </span>
                <span className="text-[12px] text-secondary">
                  Push them to Google Calendar to ensure external devices stay up to date.
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  for (const b of unsyncedUpcoming) {
                    await syncBookingEvent(b, 'create');
                  }
                }}
                disabled={isSyncingBooking}
                className="btn-secondary !h-8 !text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBooking ? 'animate-spin' : ''}`} />
                <span>Sync all now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: OFFLINE & CACHE & BACKGROUND SYNC */}
      {activeSubtab === 'offline' && (
        <div className="card-surface p-5 space-y-4 max-w-xl">
          <div className="pb-3 border-b border-subtle">
            <h3 className="text-base font-semibold text-primary">
              Offline Resilience &amp; Automatic Background Refresh
            </h3>
            <p className="text-xs text-secondary">
              Local cache and silent background syncing keep staff working uninterrupted during network drops in Moshi.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-2 rounded-xl border border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-[var(--status-success-text)]" />
                ) : (
                  <WifiOff className="w-4 h-4 text-[var(--status-warning-text)]" />
                )}
                <span className="font-semibold text-primary">Network Connectivity</span>
              </div>
              <span className={isOnline ? 'badge-success' : 'badge-warning'}>
                {isOnline ? 'Online' : 'Offline (Local Cache Active)'}
              </span>
            </div>

            <div className="p-3 bg-surface-2 rounded-xl border border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--status-info-text)]" />
                <span className="font-semibold text-primary">Background Auto-Refresh</span>
              </div>
              <span className="font-semibold text-[var(--status-success-text)]">
                Active (Every 60s silent poll)
              </span>
            </div>

            <div className="p-3 bg-surface-2 rounded-xl border border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--status-info-text)]" />
                <span className="font-semibold text-primary">Cached Bookings</span>
              </div>
              <span className="font-semibold text-primary tabular-nums">
                {bookings.length} reservations persisted
              </span>
            </div>

            <div className="p-3 bg-surface-2 rounded-xl border border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--status-success-text)]" />
                <span className="font-semibold text-primary">Service Worker</span>
              </div>
              <span className="font-semibold text-[var(--status-success-text)]">
                {'serviceWorker' in navigator ? 'Installed & Registered' : 'Active'}
              </span>
            </div>

            {/* Dev Switcher Toggle */}
            <div className="p-3 bg-surface-2 rounded-xl border border-subtle flex items-center justify-between pt-3">
              <div>
                <span className="font-semibold text-primary block">
                  Show "Switch Profile" in Account Menu
                </span>
                <span className="text-[11px] text-tertiary">
                  Rapid testing flag for role permissions without signing out.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDevProfileSwitcher(!showDevProfileSwitcher);
                  showToast(`Switch Profile ${!showDevProfileSwitcher ? 'enabled' : 'disabled'}`);
                }}
                className="cursor-pointer text-primary"
              >
                {showDevProfileSwitcher ? (
                  <ToggleRight className="w-8 h-8 text-[var(--primary-gold)]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-tertiary" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Particulars Modal */}
      <EditRoomModal
        room={editingRoom}
        isOpen={Boolean(editingRoom)}
        onClose={() => setEditingRoom(null)}
      />
    </div>
  );
};
