import React from 'react';
import { useBooking } from '../context/BookingContext';
import { Room, Booking } from '../types';
import { Bed, Plus } from 'lucide-react';
import { formatMoney } from '../utils/formatters';
import { HOSTEL_CONFIG } from '../data/initialData';

interface BedLevelRoomGridProps {
  onBookRoom?: (room: Room) => void;
  showBookButton?: boolean;
}

export const BedLevelRoomGrid: React.FC<BedLevelRoomGridProps> = ({
  onBookRoom,
  showBookButton = true
}) => {
  const { rooms, bookings, currency, exchangeRates, openNewBookingDrawer } = useBooking();

  const handleBook = (room: Room) => {
    if (onBookRoom) {
      onBookRoom(room);
    } else {
      openNewBookingDrawer({ roomId: room.id });
    }
  };

  const todayStr = HOSTEL_CONFIG.operatingDate;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-secondary flex-wrap px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--status-success-text)]" />
          <span>Free</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-[var(--status-info-bg)] border border-[var(--status-info-border)]" />
          <span>Booked</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)]" />
          <span>Arriving today</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-[var(--status-success-bg)] border border-[var(--status-success-border)]" />
          <span>Checked-in</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => {
          // Find bookings in this room staying tonight or checking in today
          const roomBookings = bookings.filter(
            b => b.roomId === room.id && 
                 b.status !== 'Cancelled' && 
                 b.status !== 'Checked-out' &&
                 b.checkIn <= todayStr && todayStr < b.checkOut
          );

          // Calculate rate in active currency
          const roomRateMoney = formatMoney(
            currency === 'TZS' ? room.pricePerNightTZS : room.pricePerNightTZS / (exchangeRates[currency] || 2650),
            currency,
            exchangeRates
          );

          // Expand active bookings into occupied bed slots
          const occupiedBedSlots: { booking: Booking; guestName: string; isCheckedIn: boolean; isArriving: boolean }[] = [];
          for (const b of roomBookings) {
            const count = Math.min(b.guestsCount || 1, room.totalBeds - occupiedBedSlots.length);
            for (let k = 0; k < count; k++) {
              occupiedBedSlots.push({
                booking: b,
                guestName: b.guestName,
                isCheckedIn: b.status === 'Checked-in',
                isArriving: b.checkIn === todayStr && b.status === 'Confirmed'
              });
            }
          }

          // Generate bed items
          const beds = Array.from({ length: room.totalBeds }, (_, i) => {
            const bedIndex = i + 1;
            const slot = occupiedBedSlots[i];
            const isOccupied = Boolean(slot);
            const isArriving = slot?.isArriving || false;
            const isCheckedIn = slot?.isCheckedIn || false;

            return {
              bedIndex,
              isOccupied,
              isArriving,
              isCheckedIn,
              guestName: slot?.guestName,
              status: slot ? (slot.isCheckedIn ? 'Checked-in' : slot.isArriving ? 'Arriving' : 'Booked') : 'Free'
            };
          });

          return (
            <div
              key={room.id}
              className="card-surface p-4 flex flex-col justify-between"
            >
              {/* Room Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-subtle">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-primary">
                        {room.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-primary font-semibold border border-subtle">
                        {room.roomCode}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-secondary font-medium">
                        {room.freeBeds} of {room.totalBeds} free
                      </span>
                    </div>
                    <span className="text-[12px] text-tertiary block mt-1">
                      {room.bedConfiguration}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-primary tabular-nums block">
                      {roomRateMoney.primary}
                    </span>
                    <span className="text-[12px] text-tertiary tabular-nums block">
                      {roomRateMoney.secondary} · {room.priceUnit || 'per bed / night'}
                    </span>
                  </div>
                </div>

                {/* Bed-level slots: Free = quiet outline with green dot; Booked/Checked-in = visible tint */}
                <div className="my-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {beds.map((b) => {
                    const bedCode = `B${b.bedIndex}`;

                    if (b.isCheckedIn) {
                      return (
                        <div
                          key={b.bedIndex}
                          className="bed-tile-checkedin p-2 rounded-xl text-left text-xs"
                          title={`Bed ${bedCode}: Checked in (${b.guestName || 'Guest'})`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[12px] flex items-center gap-1 font-mono">
                              <Bed className="w-3.5 h-3.5" />
                              {bedCode}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[var(--status-success-text)]" />
                          </div>
                          <span className="block truncate text-[11px] font-semibold">
                            {b.guestName ? b.guestName.split(' ')[0] : 'Checked-in'}
                          </span>
                        </div>
                      );
                    }

                    if (b.isArriving) {
                      return (
                        <div
                          key={b.bedIndex}
                          className="bed-tile-arriving p-2 rounded-xl text-left text-xs"
                          title={`Bed ${bedCode}: Arriving today (${b.guestName || 'Guest'})`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[12px] flex items-center gap-1 font-mono">
                              <Bed className="w-3.5 h-3.5" />
                              {bedCode}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[var(--status-warning-text)]" />
                          </div>
                          <span className="block truncate text-[11px] font-semibold">
                            {b.guestName ? b.guestName.split(' ')[0] : 'Arriving'}
                          </span>
                        </div>
                      );
                    }

                    if (b.isOccupied) {
                      return (
                        <div
                          key={b.bedIndex}
                          className="bed-tile-booked p-2 rounded-xl text-left text-xs"
                          title={`Bed ${bedCode}: Booked (${b.guestName || 'Occupied'})`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[12px] flex items-center gap-1 font-mono">
                              <Bed className="w-3.5 h-3.5" />
                              {bedCode}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-[var(--status-info-text)]" />
                          </div>
                          <span className="block truncate text-[11px] font-medium">
                            {b.guestName ? b.guestName.split(' ')[0] : 'Booked'}
                          </span>
                        </div>
                      );
                    }

                    // Free bed: quiet outline with green dot
                    return (
                      <button
                        key={b.bedIndex}
                        type="button"
                        onClick={() => handleBook(room)}
                        className="bed-tile-free p-2 rounded-xl text-left text-xs transition-colors cursor-pointer"
                        title={`Bed ${bedCode}: Free - Click to reserve`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[12px] flex items-center gap-1 font-mono text-primary">
                            <Bed className="w-3.5 h-3.5" />
                            {bedCode}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-[var(--status-success-text)]" />
                        </div>
                        <span className="block truncate text-[11px] text-secondary">
                          Free
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Footer Action: Outline Book this room button */}
              {showBookButton && (
                <div className="pt-2 border-t border-subtle flex items-center justify-between">
                  <span className="text-[12px] text-tertiary">
                    {room.totalBeds} beds total
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBook(room)}
                    className="btn-secondary !h-8 !px-3 !text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book this room</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
