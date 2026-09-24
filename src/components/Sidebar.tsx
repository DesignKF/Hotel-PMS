import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { AppTab } from '../types';
import { 
  BarChart3, 
  BookOpenCheck, 
  CalendarDays, 
  BedDouble, 
  Settings,
  RefreshCw,
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  X, 
  UserCog, 
  LogOut, 
  ChevronUp,
  WifiOff
} from 'lucide-react';
import { MoshiUrbanLogo } from './MoshiUrbanLogo';

interface NavItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  actionableBadge?: number;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    setIsUserManagementOpen,
    openProfileModal,
    currentUser,
    users,
    switchUser,
    signOut,
    arrivingTodayList,
    showDevProfileSwitcher,
    setShowDevProfileSwitcher,
    isOnline
  } = useBooking();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Actionable count: arrivals today needing check-in
  const arrivalsCount = arrivingTodayList.filter(b => b.status === 'Confirmed').length;

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      actionableBadge: arrivalsCount > 0 ? arrivalsCount : undefined
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: BookOpenCheck
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: CalendarDays
    },
    {
      id: 'rooms',
      label: 'Rooms & Guests',
      icon: BedDouble
    },
    {
      id: 'sync',
      label: 'Calendar Sync',
      icon: RefreshCw
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  const handleSelectTab = (tabId: AppTab) => {
    setActiveTab(tabId);
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    sales: 'Sales',
    front_desk: 'Front Desk'
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element: 240px wide or 72px collapsed - permanent dark blue brand theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#142032] text-[#FAF7F2] border-r border-[#1B2C44]/80 flex flex-col transition-all duration-200 ease-in-out select-none shadow-2xl ${
          isMobileSidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-60'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-16 px-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isSidebarCollapsed ? (
              <div className="w-9 h-9 rounded-lg bg-[#1B2C44] border border-white/10 flex items-center justify-center shrink-0">
                <MoshiUrbanLogo type="mark" variant="dark" className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5">
                  <MoshiUrbanLogo type="full" variant="dark" className="h-5 w-auto" />
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] border border-[var(--primary-gold)]/30 tracking-wider uppercase shrink-0">
                    PMS
                  </span>
                </div>
                <span className="font-script text-[13px] text-[var(--primary-gold)] tracking-wide -rotate-1 select-none leading-none mt-1 truncate">
                  Your passport to budget bliss
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline indicator banner inside sidebar */}
        {!isOnline && (
          <div className="bg-amber-950/80 border-b border-amber-800/60 px-3 py-2 flex items-center gap-2 text-amber-300 text-xs shrink-0 font-medium">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            {!isSidebarCollapsed && <span>Offline Mode active</span>}
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors relative cursor-pointer group ${
                  isActive
                    ? 'bg-[#1B2C44] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={item.label}
              >
                {/* 3px Gold active-nav indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[var(--primary-gold)] rounded-r-full" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[var(--primary-gold)]' : 'text-slate-400 group-hover:text-white'}`} />
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {/* Single badge style for actionable count only */}
                {item.actionableBadge !== undefined && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full shrink-0 ${
                    isSidebarCollapsed ? 'absolute top-1 right-1 px-1.5 text-[10px]' : ''
                  } bg-[var(--primary-gold)] text-[var(--primary-gold-text)]`}>
                    {item.actionableBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: ONE Account Menu (avatar + name + role) */}
        <div ref={accountMenuRef} className="p-2 border-t border-white/10 relative shrink-0">
          
          {/* Account Menu Popover */}
          {isAccountMenuOpen && (
            <div className={`absolute bottom-full mb-2 bg-[#142032] text-white rounded-xl shadow-2xl border border-white/15 py-1 z-50 animate-in fade-in duration-150 ${
              isSidebarCollapsed ? 'left-2 w-56' : 'left-2 right-2'
            }`}>
              <div className="px-3 py-2 border-b border-white/10">
                <span className="font-semibold text-sm block text-white truncate">
                  {currentUser.name}
                </span>
                <span className="text-xs text-slate-400 block truncate">
                  {currentUser.position || roleLabels[currentUser.role] || 'Staff'} · {currentUser.email}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    openProfileModal(currentUser);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1B2C44] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserCog className="w-4 h-4 text-slate-400" />
                  <span>Edit profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    setIsUserManagementOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#1B2C44] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Manage users &amp; roles</span>
                </button>

                {/* Dev flag: Switch Profile only when dev flag is active */}
                {showDevProfileSwitcher && (
                  <div className="px-3 py-2 border-t border-white/10 bg-[#0D1622]/60">
                    <span className="text-[10px] font-semibold text-[var(--primary-gold)] block mb-1">Dev: Switch User</span>
                    <select
                      value={currentUser.id}
                      onChange={(e) => {
                        switchUser(e.target.value);
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full text-xs font-semibold bg-[#142032] border border-white/20 rounded-lg p-1 text-white focus:outline-none"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id} className="bg-[#142032] text-white">
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="border-t border-white/10 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Trigger Button */}
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer group"
            title={`${currentUser.name} (${roleLabels[currentUser.role]}) - Account`}
            aria-expanded={isAccountMenuOpen}
          >
            <div className="w-8 h-8 rounded-lg bg-[#1B2C44] text-[var(--primary-gold)] flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden border border-white/15">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-white block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[12px] text-slate-400 block truncate leading-tight">
                  {roleLabels[currentUser.role] || 'Staff'}
                </span>
              </div>
            )}

            {!isSidebarCollapsed && (
              <ChevronUp className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
