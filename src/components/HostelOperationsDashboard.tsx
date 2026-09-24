import React from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeader } from './PageHeader';
import { BedLevelRoomGrid } from './BedLevelRoomGrid';
import { MonthlyRevenueTrendChart } from './MonthlyRevenueTrendChart';
import { 
  LogIn, 
  LogOut, 
  Bed, 
  UserCheck, 
  DollarSign, 
  Check, 
  Phone, 
  Calendar,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { formatBookingId, formatMoney, formatDateDisplay } from '../utils/formatters';

export const HostelOperationsDashboard: React.FC = () => {
  const {
    arrivingTodayList,
    departuresTodayList,
    checkedInList,
    bookedTonightBeds,
    freeTonightBeds,
    outstandingPaymentsList,
    quickCheckIn,
    quickCheckOut,
    quickCollectPayment,
    currency,
    exchangeRates,
    openNewBookingDrawer
  } = useBooking();

  return (
    <div className="space-y-6">
      {/* 3. Page Header: standard pattern everywhere */}
      <PageHeader
        title="Overview"
        description="Daily operational tasks, live room and bed inventory, pending payments, and revenue performance."
      />

      {/* 5a) Today's Movement & Quick Task Cards: Arrivals, Departures, Checked-in, Beds Free */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Arrivals Today */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-xs font-semibold text-secondary">Arrivals today</span>
            <LogIn className="w-4 h-4 text-[var(--status-success-text)]" />
          </div>
          <div className="text-2xl font-semibold text-primary tabular-nums">
            {arrivingTodayList.length}
          </div>
          <span className="text-[12px] text-tertiary block mt-0.5">
            {arrivingTodayList.filter(b => b.status === 'Confirmed').length} awaiting check-in
          </span>
        </div>

        {/* Departures Today */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-xs font-semibold text-secondary">Departures today</span>
            <LogOut className="w-4 h-4 text-[var(--status-danger-text)]" />
          </div>
          <div className="text-2xl font-semibold text-primary tabular-nums">
            {departuresTodayList.length}
          </div>
          <span className="text-[12px] text-tertiary block mt-0.5">
            Check-out by 10:00 AM
          </span>
        </div>

        {/* Checked-in In-House */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-xs font-semibold text-secondary">Checked-in</span>
            <UserCheck className="w-4 h-4 text-[var(--status-info-text)]" />
          </div>
          <div className="text-2xl font-semibold text-primary tabular-nums">
            {checkedInList.length}
          </div>
          <span className="text-[12px] text-tertiary block mt-0.5">
            {checkedInList.reduce((sum, b) => sum + (b.guestsCount || 1), 0)} guests in-house
          </span>
        </div>

        {/* Beds Free Tonight */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-xs font-semibold text-secondary">Beds free tonight</span>
            <Bed className="w-4 h-4 text-[var(--primary-gold)]" />
          </div>
          <div className="text-2xl font-semibold text-primary tabular-nums">
            {freeTonightBeds}
          </div>
          <span className="text-[12px] text-tertiary block mt-0.5">
            {bookedTonightBeds} of {bookedTonightBeds + freeTonightBeds} beds booked
          </span>
        </div>
      </div>

      {/* Task: Arrivals Today with Quick Check-in Button */}
      {arrivingTodayList.length > 0 && (
        <div className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-subtle">
            <div>
              <h3 className="text-base font-semibold text-primary">
                Arrivals today
              </h3>
              <span className="text-xs text-secondary">
                Guests expected to arrive today at Moshi Urban Hostel
              </span>
            </div>
            <span className="badge-success">
              <LogIn className="w-3 h-3" />
              <span>{arrivingTodayList.length} arrivals</span>
            </span>
          </div>

          <div className="divide-y divide-subtle">
            {arrivingTodayList.map((b) => {
              const balance = formatMoney(
                currency === 'TZS' ? b.balanceDueTZS : b.balanceDueTZS / (exchangeRates[currency] || 2650),
                currency,
                exchangeRates
              );
              const isCheckedIn = b.status === 'Checked-in';

              return (
                <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-primary">
                        {b.guestName}
                      </span>
                      <span className="text-xs font-mono text-tertiary">
                        {formatBookingId(b.id)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-primary font-semibold border border-subtle">
                        {b.roomCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-secondary">
                      <span>{b.guestsCount} {b.guestsCount === 1 ? 'bed' : 'beds'}</span>
                      <span>·</span>
                      <span>Phone: {b.phone || '—'}</span>
                      <span>·</span>
                      <span className="tabular-nums">
                        Balance due: <strong className="text-primary">{balance.primary}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCheckedIn ? (
                      <span className="badge-success">
                        <Check className="w-3.5 h-3.5" />
                        <span>Checked in</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => quickCheckIn(b.id)}
                        className="btn-status-success"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Check in</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5b) Bed-level room grid: One unified component reused on Rooms & Guests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Room &amp; bed availability tonight
            </h3>
            <span className="text-xs text-secondary">
              Live bed-level status across all 4 rooms (16 beds total)
            </span>
          </div>
          <button
            type="button"
            onClick={() => openNewBookingDrawer()}
            className="link-primary text-xs"
          >
            + New booking
          </button>
        </div>

        <BedLevelRoomGrid />
      </div>

      {/* 5c) Outstanding Payments Table */}
      <div className="card-surface p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-subtle">
          <div>
            <h3 className="text-base font-semibold text-primary">
              Outstanding payments
            </h3>
            <span className="text-xs text-secondary">
              Balances pending collection upon check-in or stay completion
            </span>
          </div>
          <span className="badge-warning">
            <AlertCircle className="w-3 h-3" />
            <span>{outstandingPaymentsList.length} pending</span>
          </span>
        </div>

        {outstandingPaymentsList.length === 0 ? (
          <div className="py-6 text-center text-xs text-secondary">
            All current reservations are fully settled.
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {outstandingPaymentsList.map((b) => {
              const balance = formatMoney(
                currency === 'TZS' ? b.balanceDueTZS : b.balanceDueTZS / (exchangeRates[currency] || 2650),
                currency,
                exchangeRates
              );
              return (
                <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-primary">
                        {b.guestName}
                      </span>
                      <span className="text-xs font-mono text-tertiary">
                        {formatBookingId(b.id)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-primary font-semibold border border-subtle">
                        {b.roomCode}
                      </span>
                    </div>
                    <div className="text-xs text-secondary">
                      Dates: {formatDateDisplay(b.checkIn)} – {formatDateDisplay(b.checkOut)} · {b.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[var(--status-warning-text)] tabular-nums block">
                        {balance.primary}
                      </span>
                      <span className="text-[12px] text-tertiary tabular-nums block">
                        {balance.secondary}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => quickCollectPayment(b.id)}
                      className="btn-secondary !h-8 !px-3 !text-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Collect</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5d) Revenue summary: bar chart, honest empty state */}
      <MonthlyRevenueTrendChart />
    </div>
  );
};
