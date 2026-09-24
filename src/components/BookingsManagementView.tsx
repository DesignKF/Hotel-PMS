import React, { useState, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { Booking, BookingStatus } from '../types';
import { PageHeader } from './PageHeader';
import { 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  MoreVertical, 
  LogIn, 
  CreditCard, 
  X, 
  Phone, 
  Mail, 
  Check,
  UserX,
  RotateCcw
} from 'lucide-react';
import { formatBookingId, formatMoney, formatDateDisplay, formatShortDate } from '../utils/formatters';

export const BookingsManagementView: React.FC = () => {
  const {
    bookings,
    currency,
    exchangeRates,
    searchQuery,
    quickCheckIn,
    quickCheckOut,
    quickCollectPayment,
    cancelBooking,
    openNewBookingDrawer
  } = useBooking();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [activeMenuBookingId, setActiveMenuBookingId] = useState<string | null>(null);
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<Booking | null>(null);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Status filter
      if (statusFilter !== 'all' && b.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Date range filter
      if (fromDate && b.checkOut < fromDate) return false;
      if (toDate && b.checkIn > toDate) return false;
      // Global / Local search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.guestName.toLowerCase().includes(q);
        const matchesId = b.id.toLowerCase().includes(q) || formatBookingId(b.id).toLowerCase().includes(q);
        const matchesPhone = (b.phone || '').includes(q);
        const matchesRoom = (b.roomName || '').toLowerCase().includes(q) || (b.roomCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesRoom) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, fromDate, toDate, searchQuery]);

  const exportCSV = () => {
    const headers = ['Booking ID', 'Guest Name', 'Room', 'Status', 'Check-In', 'Check-Out', 'Total TZS', 'Balance Due TZS', 'Phone'];
    const rows = filteredBookings.map(b => [
      formatBookingId(b.id),
      `"${b.guestName}"`,
      `"${b.roomName} (${b.roomCode})"`,
      b.status,
      b.checkIn,
      b.checkOut,
      b.stayTotalTZS,
      b.balanceDueTZS,
      b.phone
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `moshi-urban-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusChip = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="badge-info">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed</span>
          </span>
        );
      case 'Checked-in':
        return (
          <span className="badge-success">
            <Check className="w-3.5 h-3.5" />
            <span>Checked-in</span>
          </span>
        );
      case 'Checked-out':
        return (
          <span className="badge-neutral">
            <Clock className="w-3.5 h-3.5" />
            <span>Checked-out</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="badge-danger">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      case 'No-show':
        return (
          <span className="badge-danger">
            <UserX className="w-3.5 h-3.5" />
            <span>No-show</span>
          </span>
        );
      case 'Refunded':
        return (
          <span className="badge-warning">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refunded</span>
          </span>
        );
      case 'Tentative':
      default:
        return (
          <span className="badge-warning">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Tentative</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Search, filter, inspect guest folios, record payments, and manage check-ins."
        actions={
          <button
            type="button"
            onClick={exportCSV}
            className="btn-secondary !h-9 !px-3 !text-xs"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="card-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'confirmed', 'checked-in', 'checked-out', 'no-show', 'refunded', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-surface-3 text-primary font-bold border border-strong'
                  : 'bg-surface-2 text-secondary hover:text-primary hover:bg-surface-3 border border-subtle'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Date range filters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-secondary font-semibold">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-surface !py-1 !px-2 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-secondary font-semibold">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input-surface !py-1 !px-2 text-xs"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-secondary hover:text-primary p-1 cursor-pointer"
              title="Clear date filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bookings View: Responsive Table (Desktop) / Cards (Mobile) */}
      {filteredBookings.length === 0 ? (
        <div className="card-surface p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-subtle text-[var(--primary-gold)] mx-auto flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-2">
              <path d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z" />
              <path d="M9 21V12H15V21" />
            </svg>
          </div>
          <h4 className="text-base font-semibold text-primary">
            No bookings found
          </h4>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            No reservations match your current filters. Karibu! Create a new booking or clear filters to see all reservations.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openNewBookingDrawer()}
              className="btn-secondary"
            >
              <span>+ New booking</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (≥ 768px) */}
          <div className="hidden md:block card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-2 border-b border-subtle text-secondary font-semibold uppercase tracking-wider text-[12px]">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Guest</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {filteredBookings.map((b) => {
                    const balance = formatMoney(
                      currency === 'TZS' ? b.balanceDueTZS : b.balanceDueTZS / (exchangeRates[currency] || 2650),
                      currency,
                      exchangeRates
                    );
                    const isMenuOpen = activeMenuBookingId === b.id;

                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBookingForDrawer(b)}
                        className="hover:bg-surface-2/60 transition-colors cursor-pointer group"
                      >
                        {/* ID */}
                        <td className="py-3 px-4 font-mono font-semibold text-tertiary">
                          {formatBookingId(b.id)}
                        </td>

                        {/* Guest */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{b.guestName}</div>
                          <div className="text-tertiary text-[12px]">{b.phone}</div>
                        </td>

                        {/* Room */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">{b.roomName}</div>
                          <div className="text-tertiary text-[12px]">{b.roomCode} · {b.guestsCount} {b.guestsCount === 1 ? 'bed' : 'beds'}</div>
                        </td>

                        {/* Dates */}
                        <td className="py-3 px-4">
                          <div className="text-primary">{formatShortDate(b.checkIn)} – {formatShortDate(b.checkOut)}</div>
                          <div className="text-tertiary text-[12px]">{b.nights} {b.nights === 1 ? 'night' : 'nights'}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {getStatusChip(b.status)}
                        </td>

                        {/* Balance Due Column */}
                        <td className="py-3 px-4 text-right">
                          <div className={`font-semibold tabular-nums ${b.balanceDueTZS > 0 ? 'text-[var(--status-warning-text)]' : 'text-[var(--status-success-text)]'}`}>
                            {balance.primary}
                          </div>
                          <div className="text-[12px] text-tertiary tabular-nums">
                            {balance.secondary}
                          </div>
                        </td>

                        {/* Row Menu Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActiveMenuBookingId(isMenuOpen ? null : b.id)}
                              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-2 transition-colors cursor-pointer"
                              title="Booking Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1 w-44 bg-surface-2 rounded-xl shadow-xl border border-strong py-1 z-30 animate-in fade-in duration-100">
                                {b.status !== 'Checked-in' && b.status !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      quickCheckIn(b.id);
                                      setActiveMenuBookingId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-3 flex items-center gap-2 cursor-pointer"
                                  >
                                    <LogIn className="w-4 h-4 text-[var(--status-success-text)]" />
                                    <span>Check in guest</span>
                                  </button>
                                )}

                                {b.status === 'Checked-in' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      quickCheckOut(b.id);
                                      setActiveMenuBookingId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-3 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Clock className="w-4 h-4 text-secondary" />
                                    <span>Check out guest</span>
                                  </button>
                                )}

                                {b.balanceDueTZS > 0 && b.status !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      quickCollectPayment(b.id);
                                      setActiveMenuBookingId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-3 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CreditCard className="w-4 h-4 text-[var(--status-warning-text)]" />
                                    <span>Collect payment</span>
                                  </button>
                                )}

                                {b.status !== 'Cancelled' && (
                                  <div className="border-t border-subtle mt-1 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        cancelBooking(b.id);
                                        setActiveMenuBookingId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] flex items-center gap-2 cursor-pointer"
                                    >
                                      <XCircle className="w-4 h-4 text-[var(--status-danger-text)]" />
                                      <span>Cancel booking</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="md:hidden space-y-3">
            {filteredBookings.map((b) => {
              const balance = formatMoney(
                currency === 'TZS' ? b.balanceDueTZS : b.balanceDueTZS / (exchangeRates[currency] || 2650),
                currency,
                exchangeRates
              );
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookingForDrawer(b)}
                  className="card-surface p-4 space-y-3 cursor-pointer hover:border-strong transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-tertiary">
                          {formatBookingId(b.id)}
                        </span>
                        {getStatusChip(b.status)}
                      </div>
                      <h4 className="font-semibold text-sm text-primary mt-1">
                        {b.guestName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-primary block tabular-nums">
                        {balance.primary}
                      </span>
                      <span className="text-[12px] text-tertiary block tabular-nums">
                        {b.balanceDueTZS > 0 ? 'Balance due' : 'Paid in full'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-secondary flex items-center justify-between pt-2 border-t border-subtle">
                    <span>{b.roomName} ({b.roomCode})</span>
                    <span>{formatShortDate(b.checkIn)} – {formatShortDate(b.checkOut)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Booking Details Drawer / Sheet */}
      {selectedBookingForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-surface-1 text-primary h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-subtle">
            {/* Header */}
            <div className="bg-surface-2 p-5 flex items-center justify-between shrink-0 border-b border-subtle">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {formatBookingId(selectedBookingForDrawer.id)} · {selectedBookingForDrawer.guestName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDrawer(null)}
                className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="p-3 bg-surface-2 rounded-xl border border-subtle space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary">Status</span>
                  <span>{getStatusChip(selectedBookingForDrawer.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Room</span>
                  <span className="font-semibold text-primary">
                    {selectedBookingForDrawer.roomName} ({selectedBookingForDrawer.roomCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Dates</span>
                  <span className="font-semibold text-primary">
                    {formatDateDisplay(selectedBookingForDrawer.checkIn)} – {formatDateDisplay(selectedBookingForDrawer.checkOut)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Nights / Beds</span>
                  <span className="font-semibold text-primary">
                    {selectedBookingForDrawer.nights} nights · {selectedBookingForDrawer.guestsCount} bed(s)
                  </span>
                </div>
              </div>

              {/* Guest Contacts */}
              <div className="card-surface p-4 space-y-2">
                <span className="text-xs font-semibold text-primary block">Guest Information</span>
                <div className="flex items-center gap-2 text-secondary">
                  <Phone className="w-4 h-4 text-tertiary" />
                  <span>{selectedBookingForDrawer.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <Mail className="w-4 h-4 text-tertiary" />
                  <span>{selectedBookingForDrawer.email || 'No email provided'}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="card-surface p-4 space-y-2">
                <span className="text-xs font-semibold text-primary block">Payment Breakdown</span>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-secondary">Total Stay:</span>
                  <span className="font-semibold text-primary tabular-nums">
                    {formatMoney(
                      currency === 'TZS' ? selectedBookingForDrawer.stayTotalTZS : selectedBookingForDrawer.stayTotalTZS / (exchangeRates[currency] || 2650),
                      currency,
                      exchangeRates
                    ).primary}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-subtle">
                  <span className="text-secondary">Deposits Paid:</span>
                  <span className="font-semibold text-[var(--status-success-text)] tabular-nums">
                    {formatMoney(
                      currency === 'TZS' ? selectedBookingForDrawer.depositPaidTZS : selectedBookingForDrawer.depositPaidTZS / (exchangeRates[currency] || 2650),
                      currency,
                      exchangeRates
                    ).primary}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-primary">Balance Due:</span>
                  <span className={`font-semibold tabular-nums ${selectedBookingForDrawer.balanceDueTZS > 0 ? 'text-[var(--status-warning-text)]' : 'text-[var(--status-success-text)]'}`}>
                    {formatMoney(
                      currency === 'TZS' ? selectedBookingForDrawer.balanceDueTZS : selectedBookingForDrawer.balanceDueTZS / (exchangeRates[currency] || 2650),
                      currency,
                      exchangeRates
                    ).primary}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-subtle bg-surface-2 flex items-center justify-end gap-2 shrink-0">
              {selectedBookingForDrawer.balanceDueTZS > 0 && selectedBookingForDrawer.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    quickCollectPayment(selectedBookingForDrawer.id);
                    setSelectedBookingForDrawer(null);
                  }}
                  className="btn-secondary !h-9 !text-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect balance</span>
                </button>
              )}

              {selectedBookingForDrawer.status !== 'Checked-in' && selectedBookingForDrawer.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    quickCheckIn(selectedBookingForDrawer.id);
                    setSelectedBookingForDrawer(null);
                  }}
                  className="btn-status-success !h-9 !text-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Check in</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
