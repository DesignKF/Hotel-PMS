import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { Booking, BookingStatus, Room } from '../types';
import { 
  Calendar, 
  X, 
  Phone, 
  Mail, 
  Building2, 
  Clock, 
  FileText, 
  CheckCircle2, 
  PlusCircle,
  MessageSquare,
  Check
} from 'lucide-react';
import { HOSTEL_CONFIG } from '../data/initialData';

interface CalendarDayDetailsModalProps {
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
  onSelectBookingParticulars?: (booking: Booking) => void;
}

export const CalendarDayDetailsModal: React.FC<CalendarDayDetailsModalProps> = ({
  date,
  isOpen,
  onClose,
  onSelectBookingParticulars
}) => {
  const {
    bookings,
    rooms,
    updateBookingStatus,
    setCompletedBooking,
    openBookingModal,
    setCheckInDate,
    setCheckOutDate,
    formatPrice,
    currency,
    googleToken,
    syncBookingEvent
  } = useBooking();

  if (!isOpen || !date) return null;

  // Format date nicely (e.g. Wednesday, September 23, 2026)
  const dateObj = new Date(date + 'T00:00:00');
  const formattedFullDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isToday = date === HOSTEL_CONFIG.operatingDate;

  // Filter bookings active on this date:
  // Active if: booking.checkIn <= date && date < booking.checkOut (or check-out day)
  const activeBookings = bookings.filter(b => {
    if (b.status === 'Cancelled') return false;
    const isStaying = b.checkIn <= date && date < b.checkOut;
    const isCheckoutDay = b.checkOut === date;
    return isStaying || isCheckoutDay;
  });

  // Calculate beds occupied on this night (excluding those that already checked out in the morning)
  const stayingBookings = activeBookings.filter(b => b.checkIn <= date && date < b.checkOut);
  const totalBedsBookedOnDate = stayingBookings.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
  const totalHostelBeds = rooms.reduce((sum, r) => sum + r.totalBeds, 0);
  const freeBedsOnDate = Math.max(0, totalHostelBeds - totalBedsBookedOnDate);

  // Per room occupancy breakdown on this date
  const roomBreakdown = rooms.map(room => {
    const roomBookings = stayingBookings.filter(b => b.roomId === room.id);
    const bookedBeds = roomBookings.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
    const freeBeds = Math.max(0, room.totalBeds - bookedBeds);
    return {
      room,
      bookedBeds,
      freeBeds,
      isFull: freeBeds === 0
    };
  });

  // Action: Open particulars
  const handleViewParticulars = (booking: Booking) => {
    if (onSelectBookingParticulars) {
      onSelectBookingParticulars(booking);
    } else {
      setCompletedBooking(booking);
    }
  };

  // Action: Quick Book on this date
  const handleQuickBook = (targetRoom?: Room) => {
    const checkIn = date;
    const nextDay = new Date(date + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 2);
    const checkOut = nextDay.toISOString().slice(0, 10);

    setCheckInDate(checkIn);
    setCheckOutDate(checkOut);
    openBookingModal(targetRoom || rooms[0]);
    onClose();
  };

  // Status badge styling helper
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return 'badge-info';
      case 'Checked-in':
        return 'badge-success';
      case 'Checked-out':
        return 'badge-neutral';
      case 'Tentative':
        return 'badge-warning';
      case 'Cancelled':
      case 'No-show':
        return 'badge-danger';
      case 'Refunded':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="card-surface rounded-3xl max-w-3xl w-full border border-strong shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-surface-2 text-primary p-5 sm:p-6 shrink-0 relative border-b border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-[var(--primary-gold)] text-[var(--primary-gold-text)]">
              <Calendar className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary-gold)]">
              Day Availability &amp; Bookings Summary
            </span>
            {isToday && (
              <span className="badge-success text-[10px] font-bold">
                Current Operating Day
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif text-primary tracking-tight">
            {formattedFullDate}
          </h3>

          {/* Quick Metrics Bar for this day */}
          <div className="mt-4 pt-3 border-t border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-secondary text-[11px] block">Beds Booked:</span>
              <span className="text-base font-bold text-[var(--primary-gold)]">
                {totalBedsBookedOnDate} / {totalHostelBeds} beds
              </span>
            </div>
            <div>
              <span className="text-secondary text-[11px] block">Free Beds Left:</span>
              <span className="text-base font-bold text-[var(--status-success-text)]">
                {freeBedsOnDate} beds free
              </span>
            </div>
            <div>
              <span className="text-secondary text-[11px] block">Occupancy Rate:</span>
              <span className="text-base font-bold text-primary">
                {Math.round((totalBedsBookedOnDate / totalHostelBeds) * 100)}%
              </span>
            </div>
            <div>
              <span className="text-secondary text-[11px] block">Active Reservations:</span>
              <span className="text-base font-bold text-primary">
                {activeBookings.length} booking{activeBookings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Room-by-Room Availability Status Bar */}
        <div className="bg-surface-1 border-b border-subtle px-5 sm:px-6 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
              <span>Room Breakdown for {date}:</span>
            </span>

            {freeBedsOnDate > 0 && (
              <button
                type="button"
                onClick={() => handleQuickBook()}
                className="btn-primary !h-8 !px-3 !text-xs self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Booking for this Date</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
            {roomBreakdown.map(({ room, bookedBeds, freeBeds, isFull }) => (
              <div 
                key={room.id}
                onClick={() => freeBeds > 0 && handleQuickBook(room)}
                className={`p-2 rounded-xl border text-xs transition-all ${
                  isFull 
                    ? 'bg-surface-2 border-subtle text-secondary opacity-80'
                    : 'bg-surface-1 border-subtle hover:border-[var(--primary-gold)] cursor-pointer hover:shadow-xs'
                }`}
              >
                <div className="flex justify-between items-center">
                  <strong className="text-primary text-[11px] truncate font-semibold">{room.name}</strong>
                  <span className="text-[10px] text-tertiary">{room.roomCode}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-secondary">{bookedBeds}/{room.totalBeds} beds</span>
                  <span className={freeBeds > 0 ? 'badge-success text-[10px]' : 'badge-danger text-[10px]'}>
                    {freeBeds > 0 ? `${freeBeds} free` : 'Full'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content: Booking Details Cards */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {activeBookings.length === 0 ? (
            <div className="text-center py-10 px-4 bg-surface-2 rounded-2xl border border-dashed border-strong">
              <div className="w-12 h-12 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success-text)] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-primary">
                100% Available Date
              </h4>
              <p className="text-xs text-secondary max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                There are no existing reservations on {formattedFullDate}. All 16 beds across Mawenzi, Njoro, Bondeni, and Soweto are vacant.
              </p>
              <button
                type="button"
                onClick={() => handleQuickBook()}
                className="btn-primary"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Reservation for this Date</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Guest Bookings for this Date ({activeBookings.length})
                </h4>
                <span className="text-[11px] text-tertiary">
                  Click status buttons or particulars to manage
                </span>
              </div>

              {activeBookings.map((b) => {
                const isCheckInDay = b.checkIn === date;
                const isCheckOutDay = b.checkOut === date;
                const isStayNight = b.checkIn <= date && date < b.checkOut;

                return (
                  <div
                    key={b.id}
                    className="card-surface p-4.5 space-y-3.5 transition-all"
                  >
                    {/* Top Row: Guest Name, ID, Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-subtle">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-primary">
                            {b.guestName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-2 text-primary border border-subtle">
                            #{b.id}
                          </span>
                          <span className="text-[11px] text-tertiary">
                            (Guest ID: {b.guestId})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary">
                          <span className="font-semibold text-[var(--primary-gold)]">{b.roomName}</span>
                          <span>·</span>
                          <span>{b.guestsCount} bed(s) reserved</span>
                        </div>
                      </div>

                      {/* Status and Day Indicator */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {isCheckInDay && (
                          <span className="badge-warning text-[10px]">
                            Arriving Today
                          </span>
                        )}
                        {isCheckOutDay && (
                          <span className="badge-danger text-[10px]">
                            Departing Today (11:00)
                          </span>
                        )}
                        {isStayNight && !isCheckInDay && (
                          <span className="badge-info text-[10px]">
                            In-House Night
                          </span>
                        )}
                        
                        <span className={getStatusBadge(b.status)}>
                          {b.status}
                        </span>
                      </div>
                    </div>

                    {/* Middle Grid: Primary Contact, Dates, and Financials */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-surface-2 p-3 rounded-xl border border-subtle">
                      
                      {/* Primary Contact */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider block">
                          Primary Contact:
                        </span>
                        <div className="flex items-center gap-1.5 text-primary font-semibold">
                          <Phone className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                          <a 
                            href={`tel:${b.phone}`} 
                            className="hover:underline"
                            title="Call Guest"
                          >
                            {b.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-secondary truncate">
                          <Mail className="w-3.5 h-3.5 text-tertiary" />
                          <a 
                            href={`mailto:${b.email}`} 
                            className="hover:underline truncate"
                            title="Email Guest"
                          >
                            {b.email}
                          </a>
                        </div>
                        {/* Direct WhatsApp link */}
                        <div className="pt-0.5">
                          <a
                            href={`https://wa.me/${b.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-[var(--status-success-text)] hover:underline inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3 text-[var(--status-success-text)]" />
                            <span>Chat on WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* Stay Duration */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider block">
                          Stay Duration:
                        </span>
                        <div className="flex items-center gap-1.5 text-primary font-semibold">
                          <Clock className="w-3.5 h-3.5 text-tertiary" />
                          <span>{b.nights} night(s) total</span>
                        </div>
                        <div className="text-[11px] text-secondary">
                          {b.checkIn} → {b.checkOut}
                        </div>
                        <div className="text-[10px] text-tertiary">
                          Booked on: {b.createdAt || 'Direct Sales'}
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider block">
                          Financials ({currency}):
                        </span>
                        <div className="flex justify-between">
                          <span className="text-secondary">Total Stay:</span>
                          <strong className="text-primary font-semibold tabular-nums">{formatPrice(b.stayTotalTZS)}</strong>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-secondary">Deposit Paid:</span>
                          <span className="text-[var(--status-success-text)] font-semibold tabular-nums">{formatPrice(b.depositPaidTZS)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-secondary">Balance Due:</span>
                          <span className="text-[var(--status-warning-text)] font-semibold tabular-nums">{formatPrice(b.balanceDueTZS)}</span>
                        </div>
                        <div className="text-[10px] text-tertiary text-right">
                          {b.paymentStatus} ({b.paymentMethod === 'mobile_money' || b.paymentMethod === 'mpesa' ? 'Mobile Money' : b.paymentMethod === 'front_desk' ? 'Pay at Desk' : b.paymentMethod === 'card' ? 'Credit Card' : b.paymentMethod})
                        </div>
                      </div>

                    </div>

                    {/* Notes & Special Requests */}
                    {b.specialRequests && (
                      <div className="p-2.5 rounded-xl bg-surface-2 border border-subtle text-xs">
                        <span className="text-[10px] font-semibold text-[var(--primary-gold)] uppercase tracking-wider block mb-0.5">
                          Notes / Special Requests:
                        </span>
                        <p className="text-secondary italic">
                          "{b.specialRequests}"
                        </p>
                      </div>
                    )}

                    {/* Interactive Action Buttons Bar */}
                    <div className="pt-2 border-t border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Button 1: Booking Particulars */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewParticulars(b)}
                          className="btn-secondary !h-8 !px-3 !text-xs"
                          title="Open official Booking Particulars Voucher"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                          <span>View Booking Particulars</span>
                        </button>

                        {/* Google Calendar Sync status / action */}
                        {b.syncedToGoogleCalendar ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--status-success-text)] bg-[var(--status-success-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--status-success-border)]">
                            <Check className="w-3.5 h-3.5" />
                            <span>Synced to Google</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => syncBookingEvent(b, 'create')}
                            disabled={!googleToken}
                            className={`btn-secondary !h-8 !px-2.5 !text-xs ${
                              !googleToken ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={googleToken ? 'Push this booking to Google Calendar' : 'Connect Google Calendar first'}
                          >
                            <Calendar className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                            <span>Sync to Google Cal</span>
                          </button>
                        )}
                      </div>

                      {/* Button 2: Change Status Quick Menu */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">
                          Status:
                        </span>
                        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-subtle">
                          {(['Confirmed', 'Checked-in', 'Checked-out', 'Tentative', 'Cancelled', 'No-show', 'Refunded'] as BookingStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                updateBookingStatus(b.id, st);
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                b.status === st
                                  ? 'bg-surface-3 text-primary border border-strong font-bold shadow-xs'
                                  : 'text-secondary hover:text-primary'
                              }`}
                              title={`Set status to ${st}`}
                            >
                              {st === 'Checked-in' ? 'Check In' : st === 'Checked-out' ? 'Check Out' : st}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-surface-2 px-5 sm:px-6 py-3.5 border-t border-subtle shrink-0 flex items-center justify-between text-xs text-secondary">
          <div className="flex items-center gap-2">
            <span>Moshi Urban Hostel PMS</span>
            <span>·</span>
            <span>Tel: {HOSTEL_CONFIG.contactPhone}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary !h-8 !px-4 !text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
