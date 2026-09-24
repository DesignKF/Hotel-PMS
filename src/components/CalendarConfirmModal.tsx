import React from 'react';
import { useBooking } from '../context/BookingContext';
import { 
  Calendar, 
  X, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';

export const CalendarConfirmModal: React.FC = () => {
  const {
    calendarConfirmModal,
    setCalendarConfirmModal,
    executeCalendarAction,
    isSyncingBooking,
    googleUser
  } = useBooking();

  if (!calendarConfirmModal?.isOpen) return null;

  const { booking, actionType } = calendarConfirmModal;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card-surface max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-strong">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              actionType === 'delete' ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]' : 'bg-surface-2 text-[var(--primary-gold)] border border-subtle'
            }`}>
              {actionType === 'delete' ? <Trash2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-primary font-serif">
                {actionType === 'delete' ? 'Remove from Calendar' : 'Sync to Google Calendar'}
              </h3>
              <p className="text-xs text-secondary">
                Target account: {googleUser?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCalendarConfirmModal(null)}
            className="p-1 text-secondary hover:text-primary rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs text-secondary">
          <p>
            {actionType === 'delete' ? (
              <>Are you sure you want to delete the calendar block for this reservation?</>
            ) : (
              <>
                Confirm adding a reservation block to your primary Google Calendar:
              </>
            )}
          </p>

          <div className="p-3.5 rounded-xl bg-surface-2 border border-subtle space-y-1.5 font-medium text-primary">
            <div className="flex justify-between">
              <span className="text-secondary">Booking ID:</span>
              <strong className="text-primary">{booking.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Guest Name:</span>
              <strong>{booking.guestName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Assigned Room:</span>
              <strong className="text-[var(--primary-gold)]">{booking.roomName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Stay Dates:</span>
              <strong>{booking.checkIn} → {booking.checkOut} ({booking.nights} nights)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Beds:</span>
              <strong>{booking.guestsCount} bed(s)</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
          <button
            type="button"
            onClick={() => setCalendarConfirmModal(null)}
            className="btn-secondary !h-9 !px-3.5 !text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={executeCalendarAction}
            disabled={isSyncingBooking}
            className={`!h-9 !px-4 !text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              actionType === 'delete'
                ? 'bg-[var(--status-danger-text)] text-white hover:opacity-90'
                : 'btn-primary'
            }`}
          >
            {isSyncingBooking ? (
              <span>Updating Calendar...</span>
            ) : (
              <>
                <span>{actionType === 'delete' ? 'Confirm Removal' : 'Confirm & Sync'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
