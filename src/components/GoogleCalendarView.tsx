import React, { useState, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeader } from './PageHeader';
import { 
  ChevronLeft, 
  ChevronRight, 
  Columns3, 
  List,
  CalendarDays
} from 'lucide-react';
import { HOSTEL_CONFIG } from '../data/initialData';
import { formatBookingId, formatDateDisplay } from '../utils/formatters';
import { CalendarDayDetailsModal } from './CalendarDayDetailsModal';

type CalendarViewMode = 'timeline' | 'month' | 'schedule';

export const GoogleCalendarView: React.FC = () => {
  const {
    bookings,
    rooms,
    openNewBookingDrawer,
    setCompletedBooking
  } = useBooking();

  const operatingDate = HOSTEL_CONFIG.operatingDate; // '2026-09-23'

  // Default to Room Timeline
  const [viewMode, setViewMode] = useState<CalendarViewMode>('timeline');

  // Month navigation: September 2026
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)

  // Timeline start offset
  const [timelineStartOffset, setTimelineStartOffset] = useState<number>(0);

  // Selected date for day details modal
  const [selectedDayForDetails, setSelectedDayForDetails] = useState<string | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Month days computation
  const totalHostelBeds = useMemo(() => {
    return rooms.reduce((sum, r) => sum + r.totalBeds, 0);
  }, [rooms]);

  const monthDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Prefix empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      // Calculate total booked beds across all rooms on this day
      const activeBookings = bookings.filter(b => 
        b.status !== 'Cancelled' && b.checkIn <= dateStr && dateStr < b.checkOut
      );
      const bookedBedsCount = activeBookings.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
      const freeBedsCount = Math.max(0, totalHostelBeds - bookedBedsCount);

      days.push({
        dayNumber: day,
        dateStr,
        isToday: dateStr === operatingDate,
        bookedBedsCount,
        freeBedsCount,
        isFull: freeBedsCount === 0,
        activeBookings
      });
    }

    return days;
  }, [currentYear, currentMonth, bookings, operatingDate, totalHostelBeds]);

  // Timeline 14-days window computation
  const timelineDates = useMemo(() => {
    const dates = [];
    const base = new Date(operatingDate + 'T00:00:00');
    base.setDate(base.getDate() + timelineStartOffset);

    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayNum = d.getDate();

      dates.push({
        dateStr,
        weekday,
        dayNum,
        isToday: dateStr === operatingDate
      });
    }
    return dates;
  }, [operatingDate, timelineStartOffset]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability"
        description="Room timeline and occupancy calendar across all hostel rooms and beds."
        actions={
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-subtle text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-surface-3 text-primary border border-strong'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Room Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-surface-3 text-primary border border-strong'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('schedule')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'schedule'
                  ? 'bg-surface-3 text-primary border border-strong'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>
        }
      />

      {/* ROOM TIMELINE (Default View) */}
      {viewMode === 'timeline' && (
        <div className="card-surface p-5 space-y-4">
          {/* Timeline Navigation Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
            <div>
              <h3 className="text-base font-semibold text-primary">
                Room-by-Room 14-Day Timeline
              </h3>
              <span className="text-xs text-secondary">
                Click any free date cell to create a new reservation prefilled with room and dates
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimelineStartOffset(prev => prev - 7)}
                className="btn-secondary !h-8 !px-2.5 !text-xs"
                title="Previous 7 days"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev 7d</span>
              </button>

              <button
                type="button"
                onClick={() => setTimelineStartOffset(0)}
                className="btn-secondary !h-8 !px-2.5 !text-xs font-semibold"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setTimelineStartOffset(prev => prev + 7)}
                className="btn-secondary !h-8 !px-2.5 !text-xs"
                title="Next 7 days"
              >
                <span>Next 7d</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-xs border-collapse min-w-[750px]">
              <thead>
                <tr>
                  <th className="py-2.5 px-3 text-left font-semibold text-secondary uppercase tracking-wider text-[12px] bg-surface-2 border border-subtle w-44">
                    Room
                  </th>
                  {timelineDates.map(d => (
                    <th
                      key={d.dateStr}
                      className={`py-2 px-1 text-center border border-subtle text-[12px] font-semibold ${
                        d.isToday ? 'bg-surface-3 text-primary border-strong' : 'bg-surface-2 text-secondary'
                      }`}
                    >
                      <div className="leading-tight">{d.weekday}</div>
                      <div className="text-sm font-semibold">{d.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  return (
                    <tr key={room.id} className="hover:bg-surface-2/40 transition-colors">
                      {/* Room Header Cell */}
                      <td className="py-3 px-3 font-semibold text-primary border border-subtle bg-surface-1">
                        <div className="truncate">{room.name}</div>
                        <div className="text-[12px] text-tertiary font-normal">
                          {room.roomCode} · {room.totalBeds} beds
                        </div>
                      </td>

                      {/* 14 Date Cells */}
                      {timelineDates.map(d => {
                        const active = bookings.filter(b => 
                          b.roomId === room.id && 
                          b.status !== 'Cancelled' && 
                          b.checkIn <= d.dateStr && 
                          d.dateStr < b.checkOut
                        );
                        const bookedBeds = active.reduce((sum, b) => sum + (b.guestsCount || 1), 0);
                        const freeBeds = Math.max(0, room.totalBeds - bookedBeds);
                        const isFull = freeBeds === 0;

                        const nextD = new Date(d.dateStr + 'T00:00:00');
                        nextD.setDate(nextD.getDate() + 1);
                        const nextDayStr = nextD.toISOString().slice(0, 10);

                        return (
                          <td
                            key={d.dateStr}
                            onClick={() => {
                              if (!isFull) {
                                openNewBookingDrawer({
                                  roomId: room.id,
                                  checkIn: d.dateStr,
                                  checkOut: nextDayStr
                                });
                              }
                            }}
                            className={`py-2 px-1 text-center border border-subtle transition-all ${
                              isFull
                                ? 'bg-surface-3 text-tertiary cursor-not-allowed'
                                : bookedBeds > 0
                                ? 'bg-[var(--status-warning-bg)] text-primary hover:border-strong cursor-pointer'
                                : 'bg-surface-1 text-[var(--status-success-text)] hover:bg-surface-2 cursor-pointer'
                            }`}
                            title={isFull ? 'Full - 0 beds available' : `${freeBeds} of ${room.totalBeds} beds available. Click to book`}
                          >
                            {isFull ? (
                              <span className="font-semibold text-[11px] text-[var(--status-danger-text)]">Full</span>
                            ) : bookedBeds > 0 ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-xs tabular-nums text-[var(--status-warning-text)] block">
                                  {bookedBeds}b
                                </span>
                                <span className="text-[10px] text-secondary block">
                                  {freeBeds} free
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-[var(--status-success-text)] tabular-nums">
                                {freeBeds}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-secondary flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-surface-1 border border-subtle" />
                <span>All beds free</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)]" />
                <span>Partially booked</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-surface-3 border border-subtle" />
                <span>Full (0 free)</span>
              </span>
            </div>

            <span className="text-[12px] text-tertiary">
              Rates: TZS 53,000 (≈ $20) per bed / night
            </span>
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="card-surface p-5 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-primary">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <span className="text-xs text-secondary">
                Occupancy tinted by booked bed count
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-subtle text-secondary hover:text-primary hover:bg-surface-2 cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth(8);
                  setCurrentYear(2026);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-2 border border-subtle rounded-lg cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-subtle text-secondary hover:text-primary hover:bg-surface-2 cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs text-center font-semibold text-secondary uppercase tracking-wider text-[12px] mb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((d, idx) => {
              if (!d) {
                return <div key={`empty-${idx}`} className="h-20 bg-surface-2/40 rounded-xl" />;
              }

              const hasBookings = d.bookedBedsCount > 0;
              const isFull = d.isFull;

              return (
                <div
                  key={d.dateStr}
                  onClick={() => setSelectedDayForDetails(d.dateStr)}
                  className={`h-22 p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    d.isToday
                      ? 'ring-2 ring-[var(--primary-gold)] border-transparent'
                      : 'border-subtle'
                  } ${
                    isFull
                      ? 'bg-[var(--status-danger-bg)] text-primary border-[var(--status-danger-border)]'
                      : hasBookings
                      ? 'bg-[var(--status-warning-bg)] text-primary hover:border-strong'
                      : 'bg-surface-1 text-primary hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${d.isToday ? 'px-1.5 py-0.5 rounded bg-surface-3 text-primary border border-strong' : ''}`}>
                      {d.dayNumber}
                    </span>
                    {d.isToday && (
                      <span className="text-[10px] font-semibold text-[var(--primary-gold)]">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    {isFull ? (
                      <span className="text-[12px] font-semibold text-[var(--status-danger-text)] block">
                        Full
                      </span>
                    ) : hasBookings ? (
                      <span className="text-[12px] font-semibold text-[var(--status-warning-text)] tabular-nums block">
                        {d.bookedBedsCount} booked
                      </span>
                    ) : (
                      <span className="text-[12px] text-tertiary block">
                        All free
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDULE VIEW */}
      {viewMode === 'schedule' && (
        <div className="card-surface p-5 space-y-4">
          <div className="pb-3 border-b border-subtle">
            <h3 className="text-base font-semibold text-primary">
              Agenda Schedule
            </h3>
            <span className="text-xs text-secondary">
              Chronological log of confirmed reservations and in-house stays
            </span>
          </div>

          <div className="divide-y divide-subtle">
            {bookings
              .filter(b => b.status !== 'Cancelled')
              .map(b => (
                <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-primary">
                        {b.guestName}
                      </span>
                      <span className="font-mono text-xs text-tertiary">
                        {formatBookingId(b.id)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-2 font-semibold text-secondary border border-subtle">
                        {b.roomName} ({b.roomCode})
                      </span>
                    </div>
                    <div className="text-xs text-secondary">
                      {formatDateDisplay(b.checkIn)} → {formatDateDisplay(b.checkOut)} · {b.nights} {b.nights === 1 ? 'night' : 'nights'} · {b.guestsCount} bed(s)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCompletedBooking(b)}
                      className="btn-secondary !h-8 !px-2.5 !text-xs"
                    >
                      View Folio
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDayForDetails && (
        <CalendarDayDetailsModal
          date={selectedDayForDetails}
          isOpen={Boolean(selectedDayForDetails)}
          onClose={() => setSelectedDayForDetails(null)}
        />
      )}
    </div>
  );
};
