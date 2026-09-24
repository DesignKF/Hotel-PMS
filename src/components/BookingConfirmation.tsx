import React from 'react';
import { useBooking } from '../context/BookingContext';
import { MoshiUrbanLogo } from './MoshiUrbanLogo';
import { 
  Printer, 
  X
} from 'lucide-react';
import { HOSTEL_CONFIG } from '../data/initialData';

export const BookingConfirmation: React.FC = () => {
  const { 
    completedBooking, 
    setCompletedBooking, 
    formatPrice,
    formatInCurrency,
    currency
  } = useBooking();

  if (!completedBooking) return null;

  const b = completedBooking;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card-surface max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative border border-strong">
        
        {/* Top-right close button */}
        <button
          type="button"
          onClick={() => setCompletedBooking(null)}
          className="absolute top-4 right-4 p-1.5 text-secondary hover:text-primary hover:bg-surface-2 rounded-full transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Official Moshi Urban Logo */}
        <div className="text-center space-y-2 pb-2 border-b border-subtle">
          <div className="flex justify-center mb-1">
            <MoshiUrbanLogo className="h-10" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[var(--primary-gold)] block">
            {b.status === 'Checked-in' ? 'Active In-House Guest' : b.status === 'Checked-out' ? 'Completed Stay Record' : 'Direct Reservation Particulars'}
          </span>
          <h3 className="text-xl font-black text-primary font-serif">
            Booking Particulars #{b.id}
          </h3>
          <p className="text-xs text-secondary">
            Guest ID: {b.guestId} · Status: <span className="font-bold text-primary">{b.status}</span>
          </p>
        </div>

        {/* Voucher Card */}
        <div className="bg-surface-2 border border-subtle rounded-xl p-4.5 text-xs space-y-3">
          
          <div className="flex justify-between items-center pb-2.5 border-b border-subtle">
            <div>
              <span className="text-[11px] text-tertiary block">Guest Name:</span>
              <strong className="text-primary text-sm font-black">{b.guestName}</strong>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-tertiary block">Assigned Room:</span>
              <strong className="text-[var(--primary-gold)] font-black text-sm">{b.roomName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-secondary">
            <div>
              <span className="text-[11px] text-tertiary block">Check-in:</span>
              <strong className="text-primary font-bold">{b.checkIn}</strong>
              <span className="text-[10px] text-tertiary block">From 14:00</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-tertiary block">Check-out:</span>
              <strong className="text-primary font-bold">{b.checkOut}</strong>
              <span className="text-[10px] text-tertiary block">Until 11:00</span>
            </div>
          </div>

          <div className="pt-2 border-t border-subtle space-y-1.5 text-secondary">
            <div className="flex justify-between">
              <span>Stay Duration:</span>
              <strong className="text-primary">{b.nights} night(s) · {b.guestsCount} bed(s)</strong>
            </div>
            <div className="flex justify-between">
              <span>Payment Channel:</span>
              <strong className="text-primary">
                {b.paymentMethod === 'mobile_money' || b.paymentMethod === 'mpesa'
                  ? 'Mobile Money'
                  : b.paymentMethod === 'front_desk'
                  ? 'Pay at Desk'
                  : b.paymentMethod === 'card'
                  ? 'Credit Card'
                  : String(b.paymentMethod).replace('_', ' ')}
              </strong>
            </div>

            <div className="flex justify-between items-center pt-1 text-primary font-black">
              <span>Recorded Payment Amount:</span>
              <span className="text-[var(--primary-gold)] text-sm">
                {b.recordedCurrency && b.recordedTotalAmount 
                  ? `${formatInCurrency(b.recordedTotalAmount, b.recordedCurrency)} ${b.recordedCurrency}` 
                  : formatPrice(b.stayTotalTZS)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-tertiary">
              <span>Display Currency Equivalent ({currency}):</span>
              <span className="font-bold text-primary">{formatPrice(b.stayTotalTZS)}</span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-tertiary">Payment Status:</span>
              <span className="badge-success">
                {b.paymentStatus}
              </span>
            </div>
          </div>

          {b.specialRequests && (
            <div className="pt-2 border-t border-subtle text-[11px] text-secondary bg-surface-1 p-2.5 rounded-lg border border-subtle">
              <span className="font-bold text-primary block mb-0.5">Notes &amp; Requests:</span>
              <span>{b.specialRequests}</span>
            </div>
          )}

          {/* Contact Details from moshiurban.co.tz */}
          <div className="pt-2 border-t border-subtle text-[10px] text-tertiary flex justify-between">
            <span>Tel: {HOSTEL_CONFIG.contactPhone}</span>
            <span>{HOSTEL_CONFIG.contactEmail}</span>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary !h-9 !px-4 !text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Voucher</span>
          </button>
          
          <button
            type="button"
            onClick={() => setCompletedBooking(null)}
            className="btn-primary !h-9 !px-5 !text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
