import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  CheckCircle2, 
  LogOut, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  Check, 
  ArrowRight
} from 'lucide-react';
import { HOSTEL_CONFIG } from '../data/initialData';

export const CalendarSyncView: React.FC = () => {
  const {
    googleUser,
    googleToken,
    isConnectingCalendar,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    calendarEvents,
    bookings,
    syncBookingEvent,
    showToast,
    setActiveTab
  } = useBooking();

  const [calFeedFilter, setCalFeedFilter] = useState<'all' | 'hostel_only'>('all');
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);

  const operatingDate = HOSTEL_CONFIG.operatingDate;

  const unsyncedUpcoming = bookings.filter(
    b => !b.syncedToGoogleCalendar && b.status === 'Confirmed' && b.checkOut >= operatingDate
  );

  const syncedCount = bookings.filter(b => b.syncedToGoogleCalendar).length;

  const handleBatchSyncUpcoming = async () => {
    if (!googleToken) {
      showToast('Please connect Google Calendar first.');
      return;
    }

    if (unsyncedUpcoming.length === 0) {
      showToast('All upcoming confirmed bookings are already synced to Google Calendar!');
      return;
    }

    try {
      setIsBatchSyncing(true);
      for (const booking of unsyncedUpcoming) {
        await syncBookingEvent(booking, 'create');
      }
      showToast(`Successfully synced ${unsyncedUpcoming.length} upcoming reservations!`);
    } catch (err: any) {
      showToast(err.message || 'Batch sync encountered an error');
    } finally {
      setIsBatchSyncing(false);
    }
  };

  const filteredGoogleEvents = calendarEvents.filter(evt => {
    if (calFeedFilter === 'hostel_only') {
      return (evt.summary || '').includes('[Moshi Urban]');
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="card-surface p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-surface-2 text-[var(--primary-gold)] border border-subtle">
              <RefreshCw className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary-gold)]">
              Google Calendar Integration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1.5 text-primary">
            Calendar Sync Hub
          </h2>
          <p className="text-xs text-secondary mt-1 max-w-2xl leading-relaxed">
            Synchronize direct reservations from Moshi Urban Hostel directly into your Google Calendar. Prevent double bookings, keep staff aligned, and access guest arrival rosters on mobile.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="bg-surface-2 border border-subtle rounded-2xl p-4 text-xs shrink-0 flex items-center gap-4">
          <div className="text-right">
            <span className="text-tertiary text-[11px] block">Sync Progress:</span>
            <span className="font-semibold text-lg text-primary tabular-nums">
              {syncedCount} / {bookings.length} Synced
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Connection Card */}
      <div className="card-surface p-6 space-y-6">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-subtle">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-subtle flex items-center justify-center text-primary shrink-0">
              <CalendarIcon className="w-7 h-7 text-[var(--status-info-text)]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-semibold text-primary">
                  Google Calendar Account Connection
                </h3>
                {googleToken ? (
                  <span className="badge-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connected &amp; Ready</span>
                  </span>
                ) : (
                  <span className="badge-neutral">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary max-w-xl leading-relaxed">
                Connect your Google account using secure OAuth 2.0. Once authorized, all room bookings can be pushed to Google Calendar with guest contact information, dates, and stay notes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 flex items-center gap-3">
            {googleUser ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-surface-2 border border-subtle p-3 rounded-2xl">
                <div className="text-xs">
                  <strong className="text-primary block truncate max-w-[200px]">
                    {googleUser.displayName || 'Authorized Account'}
                  </strong>
                  <span className="text-[11px] text-tertiary truncate max-w-[200px] block">
                    {googleUser.email}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBatchSyncUpcoming}
                    disabled={isBatchSyncing}
                    className="btn-secondary !h-9 !px-3 !text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
                    <span>{isBatchSyncing ? 'Syncing...' : 'Sync All Upcoming'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={disconnectGoogleCalendar}
                    className="p-2 text-secondary hover:text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] rounded-xl transition-colors cursor-pointer"
                    title="Disconnect Google Account"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectGoogleCalendar}
                disabled={isConnectingCalendar}
                className="btn-secondary !h-10 !px-4 !text-xs"
              >
                <CalendarIcon className="w-4 h-4 text-[var(--status-info-text)]" />
                <span>{isConnectingCalendar ? 'Connecting Account...' : 'Connect Google Calendar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-surface-2 border border-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Check className="w-4 h-4 text-[var(--status-success-text)]" />
              <span>Real-Time Bed Booking Sync</span>
            </div>
            <p className="text-secondary text-[11px] leading-relaxed">
              When a new reservation is confirmed, check-in and check-out dates are created on Google Calendar with room details and guest names.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2 border border-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Check className="w-4 h-4 text-[var(--status-success-text)]" />
              <span>Two-Way Conflict Prevention</span>
            </div>
            <p className="text-secondary text-[11px] leading-relaxed">
              Staff can inspect the Availability Calendar tab to verify zero clashing reservations prior to committing dates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2 border border-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Check className="w-4 h-4 text-[var(--status-success-text)]" />
              <span>Mobile Reminders &amp; Roster</span>
            </div>
            <p className="text-secondary text-[11px] leading-relaxed">
              Stay notifications appear directly on iOS/Android Google Calendar apps with one-touch phone dials and WhatsApp links.
            </p>
          </div>

        </div>

      </div>

      {/* External Google Calendar Feed */}
      {googleToken && (
        <div className="card-surface p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
            <div>
              <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[var(--status-info-text)]" />
                <span>Google Calendar Feed ({googleUser?.email})</span>
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Active calendar events retrieved from your primary Google Calendar account.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCalFeedFilter('all')}
                className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                  calFeedFilter === 'all'
                    ? 'bg-surface-3 text-primary border border-strong'
                    : 'bg-surface-2 text-secondary hover:text-primary border border-subtle'
                }`}
              >
                All Events ({calendarEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setCalFeedFilter('hostel_only')}
                className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                  calFeedFilter === 'hostel_only'
                    ? 'bg-surface-3 text-primary border border-strong'
                    : 'bg-surface-2 text-secondary hover:text-primary border border-subtle'
                }`}
              >
                Moshi Urban Stays Only
              </button>
            </div>
          </div>

          {filteredGoogleEvents.length === 0 ? (
            <div className="text-center py-10 text-tertiary text-xs">
              No calendar events found in this feed.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredGoogleEvents.map(evt => (
                <div 
                  key={evt.id} 
                  className="p-4 rounded-2xl border border-subtle bg-surface-2 hover:bg-surface-3 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-primary line-clamp-1 text-sm">
                      {evt.summary || 'Hostel Reservation'}
                    </h4>
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-secondary hover:text-primary transition-colors p-1"
                        title="Open in Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-secondary text-xs">
                    <Clock className="w-3.5 h-3.5 text-tertiary" />
                    <span>
                      {evt.start?.date || evt.start?.dateTime?.slice(0, 10)} → {evt.end?.date || evt.end?.dateTime?.slice(0, 10)}
                    </span>
                  </div>

                  {evt.description && (
                    <p className="text-[11px] text-secondary line-clamp-2 italic bg-surface-1 p-2 rounded-lg border border-subtle">
                      {evt.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation to Interactive Availability Calendar */}
      <div className="card-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-primary">
            Want to see all bookings visually on the interactive grid?
          </h4>
          <p className="text-xs text-secondary mt-0.5">
            Switch to the Availability tab to explore the month grid, schedule agenda, and room timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('availability')}
          className="btn-secondary !h-9 !px-4 !text-xs self-start sm:self-auto shrink-0"
        >
          <span>Go to Availability Calendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
