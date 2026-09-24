import React, { useState, useEffect, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { 
  Bell, 
  X, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Bed, 
  Calendar, 
  RefreshCw, 
  UserCheck, 
  LogOut, 
  Plus, 
  Trash2, 
  Filter, 
  Eye,
  StickyNote,
  ChevronRight
} from 'lucide-react';
import { formatMoney, formatBookingId } from '../utils/formatters';
import { HOSTEL_CONFIG } from '../data/initialData';

export interface StaffNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  priority: 'normal' | 'urgent';
  isDone: boolean;
}

export type NotificationCategory = 'all' | 'actions' | 'payments' | 'inventory' | 'notes';

interface NotificationItem {
  id: string;
  category: 'actions' | 'payments' | 'inventory' | 'sync' | 'notes';
  priority: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
  onAction?: () => void;
  isDismissible: boolean;
  metaBadge?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const {
    bookings,
    rooms,
    currency,
    exchangeRates,
    arrivingTodayList,
    departuresTodayList,
    outstandingPaymentsList,
    quickCheckIn,
    quickCheckOut,
    quickCollectPayment,
    openNewBookingDrawer,
    setActiveTab,
    googleToken,
    syncBookingEvent,
    showToast,
    currentUser
  } = useBooking();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('moshi_pms_dismissed_notifications_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [staffNotes, setStaffNotes] = useState<StaffNote[]>(() => {
    try {
      const saved = localStorage.getItem('moshi_pms_staff_notes_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'note-1',
        text: 'Morning linen delivery arriving at 10:30 AM. Front desk please sign invoice.',
        author: 'General Manager',
        createdAt: '08:15 AM',
        priority: 'normal',
        isDone: false
      },
      {
        id: 'note-2',
        text: 'Guest in Room 2 (Bunk 1) requested early breakfast at 06:30 for Kilimanjaro hike.',
        author: 'Front Desk',
        createdAt: '09:00 AM',
        priority: 'urgent',
        isDone: false
      }
    ];
  });

  const [newNoteText, setNewNoteText] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'normal' | 'urgent'>('normal');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Persist dismissed items
  useEffect(() => {
    localStorage.setItem('moshi_pms_dismissed_notifications_v1', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  // Persist staff notes
  useEffect(() => {
    localStorage.setItem('moshi_pms_staff_notes_v1', JSON.stringify(staffNotes));
  }, [staffNotes]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const handleClearAllDismissed = () => {
    setDismissedIds([]);
    showToast('Restored all dismissed alerts.');
  };

  const handleDismissAllActive = () => {
    const activeIds = rawNotifications.map(n => n.id);
    setDismissedIds(prev => Array.from(new Set([...prev, ...activeIds])));
    showToast('Marked all alerts as read.');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: StaffNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      author: currentUser?.name || 'Staff',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: newNotePriority,
      isDone: false
    };

    setStaffNotes(prev => [newNote, ...prev]);
    setNewNoteText('');
    setIsAddingNote(false);
    showToast('Handover note posted.');
  };

  const handleToggleNoteDone = (id: string) => {
    setStaffNotes(prev => prev.map(n => n.id === id ? { ...n, isDone: !n.isDone } : n));
  };

  const handleDeleteNote = (id: string) => {
    setStaffNotes(prev => prev.filter(n => n.id !== id));
    showToast('Note deleted.');
  };

  // Compile real-time operational notifications
  const rawNotifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    const today = HOSTEL_CONFIG.operatingDate;

    // 1. Pending Arrivals Today
    arrivingTodayList.forEach(b => {
      items.push({
        id: `arrival-${b.id}`,
        category: 'actions',
        priority: 'urgent',
        title: `Pending Arrival: ${b.guestName}`,
        description: `Scheduled to check into ${b.roomName} (${b.guestsCount} bed${b.guestsCount > 1 ? 's' : ''}). Booking ${formatBookingId(b.id)}.`,
        timestamp: 'Check-in from 14:00',
        metaBadge: 'Today Arrival',
        actionLabel: 'Check In Guest',
        isDismissible: false,
        onAction: () => {
          quickCheckIn(b.id);
        }
      });
    });

    // 2. Scheduled Departures Today (still checked in)
    departuresTodayList.forEach(b => {
      items.push({
        id: `departure-${b.id}`,
        category: 'actions',
        priority: 'urgent',
        title: `Scheduled Check-out: ${b.guestName}`,
        description: `Occupying ${b.roomName}. Scheduled to vacate today. Inspect room key and bed locker.`,
        timestamp: 'Check-out by 11:00',
        metaBadge: 'Today Departure',
        actionLabel: 'Complete Check-Out',
        isDismissible: false,
        onAction: () => {
          quickCheckOut(b.id);
        }
      });
    });

    // 3. Outstanding Balances for Active / Arriving Guests
    outstandingPaymentsList.forEach(b => {
      const balanceMoney = formatMoney(
        currency === 'TZS' ? b.balanceDueTZS : b.balanceDueTZS / (exchangeRates[currency] || 2650),
        currency,
        exchangeRates
      );

      const isToday = b.checkIn === today || b.status === 'Checked-in';

      items.push({
        id: `payment-${b.id}`,
        category: 'payments',
        priority: isToday ? 'urgent' : 'warning',
        title: `Balance Due: ${balanceMoney.primary}`,
        description: `${b.guestName} (${b.roomName}) has an unpaid stay balance (${b.paymentStatus}).`,
        timestamp: isToday ? 'Immediate Payment' : `Due on ${b.checkIn}`,
        metaBadge: b.paymentStatus,
        actionLabel: 'Collect Balance',
        isDismissible: true,
        onAction: () => {
          quickCollectPayment(b.id);
        }
      });
    });

    // 4. Room Capacity / Fully Booked Alert
    rooms.forEach(r => {
      if (r.freeBeds === 0) {
        items.push({
          id: `full-room-${r.id}`,
          category: 'inventory',
          priority: 'warning',
          title: `Full Occupancy: ${r.name}`,
          description: `All ${r.totalBeds} beds in ${r.name} are occupied tonight. No walk-in beds available.`,
          timestamp: 'Tonight',
          metaBadge: '100% Full',
          actionLabel: 'View Room Beds',
          isDismissible: true,
          onAction: () => {
            setActiveTab('rooms');
            onClose();
          }
        });
      }
    });

    // 5. Unsynced Google Calendar reservations
    if (googleToken) {
      const unsynced = bookings.filter(b => !b.syncedToGoogleCalendar && b.status === 'Confirmed');
      unsynced.slice(0, 3).forEach(b => {
        items.push({
          id: `sync-${b.id}`,
          category: 'inventory',
          priority: 'info',
          title: `Unsynced Event: ${b.guestName}`,
          description: `Confirmed reservation ${formatBookingId(b.id)} for ${b.roomName} has not synced to Google Calendar.`,
          timestamp: 'Calendar Pending',
          metaBadge: 'Google Calendar',
          actionLabel: 'Sync to Calendar',
          isDismissible: true,
          onAction: () => {
            syncBookingEvent(b, 'create');
          }
        });
      });
    }

    return items;
  }, [
    arrivingTodayList,
    departuresTodayList,
    outstandingPaymentsList,
    rooms,
    bookings,
    googleToken,
    currency,
    exchangeRates,
    quickCheckIn,
    quickCheckOut,
    quickCollectPayment,
    setActiveTab,
    syncBookingEvent,
    onClose
  ]);

  // Filter out dismissed notifications
  const activeNotifications = useMemo(() => {
    return rawNotifications.filter(n => !dismissedIds.includes(n.id));
  }, [rawNotifications, dismissedIds]);

  // Combined notifications including active staff notes
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'notes') return [];
    if (activeCategory === 'actions') {
      return activeNotifications.filter(n => n.category === 'actions');
    }
    if (activeCategory === 'payments') {
      return activeNotifications.filter(n => n.category === 'payments');
    }
    if (activeCategory === 'inventory') {
      return activeNotifications.filter(n => n.category === 'inventory');
    }
    return activeNotifications;
  }, [activeNotifications, activeCategory]);

  const urgentCount = activeNotifications.filter(n => n.priority === 'urgent').length;
  const totalCount = activeNotifications.length + staffNotes.filter(n => !n.isDone).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Background click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div 
        className="w-full max-w-lg bg-surface-1 h-full shadow-2xl border-l border-subtle flex flex-col animate-in slide-in-from-right duration-250 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-subtle flex items-center justify-between bg-surface-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] flex items-center justify-center border border-[var(--primary-gold)]/30">
              <Bell className="w-5 h-5" />
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--status-danger-text)] ring-2 ring-surface-1 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-primary">
                  Operations &amp; Concerns
                </h3>
                {totalCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary-gold)] text-[var(--primary-gold-text)] font-bold">
                    {totalCount} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary">
                Actionable front-desk roster, pending tasks &amp; staff handovers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-subtle bg-surface-1 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          {[
            { id: 'all', label: 'All', count: totalCount },
            { 
              id: 'actions', 
              label: 'Action Required', 
              count: activeNotifications.filter(n => n.category === 'actions').length 
            },
            { 
              id: 'payments', 
              label: 'Payments', 
              count: activeNotifications.filter(n => n.category === 'payments').length 
            },
            { 
              id: 'inventory', 
              label: 'Capacity & Sync', 
              count: activeNotifications.filter(n => n.category === 'inventory').length 
            },
            { 
              id: 'notes', 
              label: 'Staff Notes', 
              count: staffNotes.filter(n => !n.isDone).length 
            }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as NotificationCategory)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-surface-3 text-primary border border-strong font-bold'
                  : 'text-secondary hover:text-primary hover:bg-surface-2'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  tab.id === 'actions' && tab.count > 0
                    ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                    : 'bg-surface-2 text-primary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quick Toolbar: Mark all read / Add Note / Restore */}
        <div className="px-5 py-2.5 bg-surface-2/60 border-b border-subtle flex items-center justify-between text-xs text-secondary shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] hover:bg-[var(--primary-gold)]/25 font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? 'Cancel Note' : 'Add Handover Note'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleDismissAllActive}
                className="hover:text-primary transition-colors cursor-pointer text-[11px]"
              >
                Mark all as read
              </button>
            )}

            {dismissedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllDismissed}
                className="text-tertiary hover:text-secondary transition-colors cursor-pointer text-[11px]"
              >
                Restore ({dismissedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Add Note Inline Form */}
        {isAddingNote && (
          <form onSubmit={handleAddNote} className="p-4 bg-surface-2 border-b border-subtle space-y-3 animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <StickyNote className="w-4 h-4 text-[var(--primary-gold)]" />
                <span>New Staff Handover Note</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <label className="text-secondary text-[11px]">Priority:</label>
                <select
                  value={newNotePriority}
                  onChange={(e) => setNewNotePriority(e.target.value as any)}
                  className="input-surface !py-0.5 !px-2 !text-xs font-semibold"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <textarea
              rows={2}
              required
              placeholder="e.g. Airport shuttle at 17:00 for John Doe. Laundry for Room 1 is ready."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="input-surface w-full !text-xs leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="btn-secondary !h-7 !px-2.5 !text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary !h-7 !px-3 !text-xs font-semibold"
              >
                Post Note
              </button>
            </div>
          </form>
        )}

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Staff Notes Section (when All or Notes tab active) */}
          {(activeCategory === 'all' || activeCategory === 'notes') && staffNotes.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>Staff Handover Notes ({staffNotes.length})</span>
                </span>
              </div>

              {staffNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    note.isDone
                      ? 'bg-surface-2/40 border-subtle opacity-60'
                      : note.priority === 'urgent'
                        ? 'bg-[var(--status-danger-bg)] border-[var(--status-danger-border)]'
                        : 'bg-surface-2 border-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleNoteDone(note.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          note.isDone
                            ? 'bg-[var(--status-success-text)] border-[var(--status-success-text)] text-white'
                            : 'border-strong hover:border-[var(--primary-gold)]'
                        }`}
                        title={note.isDone ? 'Mark Undone' : 'Mark Done'}
                      >
                        {note.isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <p className={`text-xs leading-relaxed ${note.isDone ? 'line-through text-tertiary' : 'text-primary font-medium'}`}>
                          {note.text}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-tertiary">
                          <span>{note.author}</span>
                          <span>·</span>
                          <span>{note.createdAt}</span>
                          {note.priority === 'urgent' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] font-bold text-[10px]">
                              URGENT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-lg text-tertiary hover:text-[var(--status-danger-text)] transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Operational Notifications Section */}
          {activeCategory !== 'notes' && (
            <>
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-subtle flex items-center justify-center mx-auto text-secondary">
                    <CheckCircle2 className="w-6 h-6 text-[var(--status-success-text)]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary">All caught up!</h4>
                    <p className="text-xs text-secondary max-w-xs mx-auto mt-1">
                      No pending concerns in this category. All check-ins, check-outs, and balances are under control.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        item.priority === 'urgent'
                          ? 'bg-surface-2 border-[var(--status-danger-border)] shadow-xs'
                          : item.priority === 'warning'
                            ? 'bg-surface-2 border-[var(--status-warning-border)]'
                            : 'bg-surface-2 border-subtle'
                      }`}
                    >
                      {/* Top Bar: Icon + Title + Meta + Dismiss */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            item.priority === 'urgent'
                              ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                              : item.priority === 'warning'
                                ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
                                : 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]'
                          }`}>
                            {item.category === 'actions' ? (
                              <UserCheck className="w-4 h-4" />
                            ) : item.category === 'payments' ? (
                              <DollarSign className="w-4 h-4" />
                            ) : (
                              <Bed className="w-4 h-4" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-primary">
                                {item.title}
                              </span>
                              {item.metaBadge && (
                                <span className={`text-[10px] px-2 py-0.2 rounded-md font-semibold border ${
                                  item.priority === 'urgent'
                                    ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[var(--status-danger-border)]'
                                    : 'bg-surface-3 text-secondary border-subtle'
                                }`}>
                                  {item.metaBadge}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-secondary leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {item.isDismissible && (
                          <button
                            type="button"
                            onClick={() => handleDismiss(item.id)}
                            className="p-1 rounded-lg text-tertiary hover:text-primary transition-colors cursor-pointer shrink-0"
                            title="Dismiss Notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Bottom Action Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-subtle/60 text-xs">
                        <span className="text-[11px] text-tertiary flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </span>

                        {item.actionLabel && item.onAction && (
                          <button
                            type="button"
                            onClick={item.onAction}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              item.priority === 'urgent'
                                ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] hover:brightness-105 shadow-xs'
                                : 'btn-secondary !h-7 !px-2.5 !text-xs'
                            }`}
                          >
                            <span>{item.actionLabel}</span>
                            <ChevronRight className="w-3 h-3 stroke-[3]" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* Drawer Footer Status */}
        <div className="px-5 py-3 border-t border-subtle bg-surface-2 flex items-center justify-between text-[11px] text-tertiary shrink-0">
          <span>Operating Date: {HOSTEL_CONFIG.operatingDate}</span>
          <span>Real-time Sync Active</span>
        </div>

      </div>
    </div>
  );
};
