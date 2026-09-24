import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { PaymentMethod, Room, BookingStatus } from '../types';
import { 
  X, 
  Bed, 
  Phone,
  User,
  Mail,
  Plus,
  CheckCircle,
  Clock,
  LogIn
} from 'lucide-react';
import { formatMoney, formatDateDisplay } from '../utils/formatters';

export const BookingModal: React.FC = () => {
  const {
    isNewBookingOpen,
    setIsNewBookingOpen,
    selectedRoomForBooking,
    closeBookingModal,
    rooms,
    submitNewBooking,
    checkInDate: defaultCheckIn,
    checkOutDate: defaultCheckOut,
    currency,
    exchangeRates,
    googleToken
  } = useBooking();

  const isOpen = isNewBookingOpen || selectedRoomForBooking !== null;

  const initialRoom = selectedRoomForBooking || rooms[0];
  const [roomId, setRoomId] = useState<string>(initialRoom?.id || 'R1');
  const [guestName, setGuestName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('+255 ');
  const [checkIn, setCheckIn] = useState<string>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOut);
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [status, setStatus] = useState<BookingStatus>('Confirmed');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [isDepositOnly, setIsDepositOnly] = useState<boolean>(false);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [syncToGoogleCal, setSyncToGoogleCal] = useState<boolean>(Boolean(googleToken));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (selectedRoomForBooking) {
      setRoomId(selectedRoomForBooking.id);
    }
  }, [selectedRoomForBooking]);

  useEffect(() => {
    if (defaultCheckIn) {
      setCheckIn(defaultCheckIn);
    }
  }, [defaultCheckIn]);

  useEffect(() => {
    if (defaultCheckOut) {
      setCheckOut(defaultCheckOut);
    }
  }, [defaultCheckOut]);

  if (!isOpen) return null;

  const activeRoom: Room = rooms.find(r => r.id === roomId) || rooms[0];

  const handleClose = () => {
    setIsNewBookingOpen(false);
    closeBookingModal();
  };

  // Calculate nights
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const effectiveBeds = Math.min(activeRoom.totalBeds, Math.max(1, guestsCount));
  const standardStayTotalTZS = activeRoom.pricePerNightTZS * nights * effectiveBeds;

  const stayMoney = formatMoney(
    currency === 'TZS' ? standardStayTotalTZS : standardStayTotalTZS / (exchangeRates[currency] || 2650),
    currency,
    exchangeRates
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      setIsSubmitting(true);
      await submitNewBooking({
        roomId,
        guestName: guestName.trim(),
        email: email.trim() || `${guestName.toLowerCase().replace(/\s+/g, '.')}@guest.com`,
        phone: phone.trim(),
        checkIn,
        checkOut,
        guestsCount: effectiveBeds,
        paymentMethod,
        status,
        specialRequests,
        isDepositOnly,
        syncToGoogleCal
      });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="card-surface max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-auto border border-strong">
        
        {/* Header */}
        <div className="bg-surface-2 p-5 flex items-center justify-between border-b border-subtle">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              New booking
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary">
                Guest name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-surface input-with-icon w-full !pl-10 pr-3 !text-xs font-normal"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary">
                Phone / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="+255 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-surface input-with-icon w-full !pl-10 pr-3 !text-xs font-normal"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-primary">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                placeholder="sarah.jenkins@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-surface input-with-icon w-full !pl-10 pr-3 !text-xs font-normal"
              />
            </div>
          </div>

          {/* Room Selection & Beds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary">
                Select room *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input-surface w-full !text-xs font-semibold cursor-pointer"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomCode} - {r.name} ({r.totalBeds} beds)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary">
                Beds reserved *
              </label>
              <div className="relative">
                <Bed className="w-4 h-4 text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  max={activeRoom.totalBeds}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                  className="input-surface input-with-icon w-full !pl-10 pr-3 !text-xs font-normal"
                />
              </div>
            </div>
          </div>

          {/* Dates: Check-in / Check-out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary">
                Check-in date *
              </label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="input-surface w-full !text-xs font-normal"
              />
              <span className="text-[12px] text-tertiary block">
                {formatDateDisplay(checkIn)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primary">
                Check-out date *
              </label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="input-surface w-full !text-xs font-normal"
              />
              <span className="text-[12px] text-tertiary block">
                {formatDateDisplay(checkOut)}
              </span>
            </div>
          </div>

          {/* Booking Status Toggle */}
          <div className="p-3.5 bg-surface-2 rounded-xl border border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <span>Reservation Status *</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-secondary font-medium">
                  {status}
                </span>
              </label>
              <span className="text-[11px] text-tertiary hidden sm:inline">
                {status === 'Confirmed' && 'Bed confirmed for guest'}
                {status === 'Tentative' && 'Bed on hold / provisional inquiry'}
                {status === 'Checked-in' && 'Guest on-site & checked in'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Confirmed')}
                className={`p-2.5 rounded-lg text-xs font-semibold cursor-pointer border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  status === 'Confirmed'
                    ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)] shadow-xs font-bold ring-1 ring-[var(--status-success-border)]'
                    : 'bg-surface-1 text-secondary border-subtle hover:text-primary hover:bg-surface-3'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${status === 'Confirmed' ? 'text-[var(--status-success-text)]' : 'text-tertiary'}`} />
                  <span>Confirmed</span>
                </div>
                <span className="text-[10px] opacity-75 font-normal">Standard booking</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Tentative')}
                className={`p-2.5 rounded-lg text-xs font-semibold cursor-pointer border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  status === 'Tentative'
                    ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)] shadow-xs font-bold ring-1 ring-[var(--status-warning-border)]'
                    : 'bg-surface-1 text-secondary border-subtle hover:text-primary hover:bg-surface-3'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-3.5 h-3.5 ${status === 'Tentative' ? 'text-[var(--status-warning-text)]' : 'text-tertiary'}`} />
                  <span>Tentative</span>
                </div>
                <span className="text-[10px] opacity-75 font-normal">Provisional hold</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Checked-in')}
                className={`p-2.5 rounded-lg text-xs font-semibold cursor-pointer border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  status === 'Checked-in'
                    ? 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-border)] shadow-xs font-bold ring-1 ring-[var(--status-info-border)]'
                    : 'bg-surface-1 text-secondary border-subtle hover:text-primary hover:bg-surface-3'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <LogIn className={`w-3.5 h-3.5 ${status === 'Checked-in' ? 'text-[var(--status-info-text)]' : 'text-tertiary'}`} />
                  <span>Checked-in</span>
                </div>
                <span className="text-[10px] opacity-75 font-normal">Guest arrived</span>
              </button>
            </div>
          </div>

          {/* Payment Method & Deposit Toggle */}
          <div className="p-4 bg-surface-2 rounded-xl border border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">Payment method</span>
              <div className="flex gap-2">
                {[
                  { id: 'mobile_money', label: 'Mobile Money' },
                  { id: 'card', label: 'Credit Card' },
                  { id: 'front_desk', label: 'Pay at Desk' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      paymentMethod === m.id
                        ? 'bg-surface-3 text-primary border border-strong font-bold'
                        : 'bg-surface-1 text-secondary border border-subtle hover:text-primary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-subtle text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-primary">
                <input
                  type="checkbox"
                  checked={isDepositOnly}
                  onChange={(e) => setIsDepositOnly(e.target.checked)}
                  className="rounded text-[var(--primary-gold)] focus:ring-[var(--primary-gold)]"
                />
                <span>Collect 40% deposit only</span>
              </label>

              <div className="text-right">
                <span className="text-[12px] text-tertiary block">
                  {nights} {nights === 1 ? 'night' : 'nights'} · {effectiveBeds} {effectiveBeds === 1 ? 'bed' : 'beds'}
                </span>
                <span className="font-semibold text-sm text-primary tabular-nums">
                  Total: {stayMoney.primary}
                </span>
                <span className="text-[12px] text-tertiary block tabular-nums">
                  {stayMoney.secondary}
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests & Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-primary">
              Special requests &amp; notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Airport shuttle from JRO, late check-in at 8 PM, single bed preference..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="input-surface w-full !text-xs font-normal"
            />
          </div>

          {/* Sync to Google Calendar option if connected */}
          {googleToken && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-primary bg-surface-2 p-3 rounded-xl border border-subtle">
              <input
                type="checkbox"
                checked={syncToGoogleCal}
                onChange={(e) => setSyncToGoogleCal(e.target.checked)}
                className="rounded text-[var(--primary-gold)] focus:ring-[var(--primary-gold)]"
              />
              <span className="font-semibold">Sync reservation block to Google Calendar immediately</span>
            </label>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Creating reservation...' : 'New booking'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
