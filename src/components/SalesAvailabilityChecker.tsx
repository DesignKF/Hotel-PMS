import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeader } from './PageHeader';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Check, 
  UserCheck,
  Pencil
} from 'lucide-react';
import { formatMoney, formatBookingId, formatDateDisplay } from '../utils/formatters';
import { Room } from '../types';
import { EditRoomModal } from './EditRoomModal';

export const SalesAvailabilityChecker: React.FC = () => {
  const {
    rooms,
    bookings,
    currency,
    exchangeRates,
    openNewBookingDrawer
  } = useBooking();

  const [expandedRoomIds, setExpandedRoomIds] = useState<Record<string, boolean>>({});
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const toggleExpand = (roomId: string) => {
    setExpandedRoomIds(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Unique amenities that differ across rooms
  const roomDifferentiatingAmenities: Record<string, string[]> = {
    R1: ['1 Single + 1 Bunk Bed', 'Ground Floor Patio', 'Garden Breeze', 'Bed Linens Included'],
    R2: ['3 Sturdy Bunk Beds', 'Bed Privacy Curtains', 'Personal Reading Lamp', 'Individual Metal Lockers'],
    R3: ['2 Solid Bunk Beds', 'Underbed Storage Space', 'High-Output Ceiling Fan', 'Courtyard Facing'],
    R4: ['1 Single + 1 Bunk Bed', 'Dedicated Desk & Reading Nook', 'Mosquito Netting on Windows', '24/7 Solar Hot Water']
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Guests"
        description="Inspect room details, differing amenities, active in-house occupants, and reserve beds."
      />

      {/* One Room List */}
      <div className="space-y-4">
        {rooms.map((room) => {
          const isExpanded = Boolean(expandedRoomIds[room.id]);
          
          // In-house bookings in this room today
          const activeInHouse = bookings.filter(
            b => b.roomId === room.id && b.status === 'Checked-in'
          );

          const rateMoney = formatMoney(
            currency === 'TZS' ? room.pricePerNightTZS : room.pricePerNightTZS / (exchangeRates[currency] || 2650),
            currency,
            exchangeRates
          );

          const diffAmenities = roomDifferentiatingAmenities[room.id] || room.features;

          return (
            <div
              key={room.id}
              className="card-surface p-5 space-y-4 transition-all"
            >
              {/* Room Card Main Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-primary">
                      {room.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-primary font-semibold border border-subtle">
                      {room.roomCode}
                    </span>
                    <span className={room.freeBeds === 0 ? 'badge-danger' : 'badge-success'}>
                      {room.freeBeds} of {room.totalBeds} beds available
                    </span>
                  </div>

                  <p className="text-xs text-secondary">
                    {room.tagline} · {room.bedConfiguration}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-semibold text-primary tabular-nums block">
                      {rateMoney.primary}
                    </span>
                    <span className="text-[12px] text-tertiary tabular-nums block">
                      {rateMoney.secondary} · {room.priceUnit || 'per bed / night'}
                    </span>
                  </div>

                  {/* Room action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingRoom(room)}
                      className="btn-secondary !h-9 !px-2.5 !text-xs cursor-pointer flex items-center gap-1.5"
                      title="Edit Room Particulars"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openNewBookingDrawer({ roomId: room.id })}
                      className="btn-secondary !h-9 !px-3 !text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Book this room</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Differing Amenities */}
              <div className="pt-2 border-t border-subtle flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-semibold text-tertiary mr-1">
                  Key features:
                </span>
                {diffAmenities.map((amenity, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-2 text-primary text-xs font-medium border border-subtle"
                  >
                    <Check className="w-3 h-3 text-[var(--status-success-text)]" />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>

              {/* Expand Toggle */}
              <div className="pt-2 border-t border-subtle flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleExpand(room.id)}
                  className="text-xs font-semibold text-primary hover:text-[var(--primary-gold)] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isExpanded ? 'Hide full details' : 'Show full description & in-house roster'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <span className="text-[12px] text-tertiary">
                  {activeInHouse.length} in-house reservation{activeInHouse.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="pt-3 border-t border-subtle space-y-4 animate-in fade-in duration-150">
                  {/* Full Description */}
                  <div>
                    <span className="text-xs font-semibold text-primary block mb-1">Room Description</span>
                    <p className="text-xs text-secondary leading-relaxed max-w-3xl">
                      {room.description}
                    </p>
                  </div>

                  {/* Active In-House Roster for this room */}
                  <div>
                    <span className="text-xs font-semibold text-primary block mb-2">Current In-House Guests</span>
                    {activeInHouse.length === 0 ? (
                      <p className="text-xs text-tertiary italic">
                        No checked-in guests currently occupying beds in {room.name}.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeInHouse.map(b => (
                          <div key={b.id} className="p-2.5 rounded-xl bg-surface-2 border border-subtle flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-primary block">{b.guestName}</span>
                              <span className="text-[12px] text-tertiary">
                                {formatBookingId(b.id)} · {b.guestsCount} bed(s) · Depart: {formatDateDisplay(b.checkOut)}
                              </span>
                            </div>
                            <span className="badge-success">
                              <UserCheck className="w-3 h-3" />
                              <span>Checked-in</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Room Particulars Modal */}
      <EditRoomModal
        room={editingRoom}
        isOpen={Boolean(editingRoom)}
        onClose={() => setEditingRoom(null)}
      />
    </div>
  );
};
