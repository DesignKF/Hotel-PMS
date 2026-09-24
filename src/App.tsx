import React from 'react';
import { BookingProvider, useBooking } from './context/BookingContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HostelOperationsDashboard } from './components/HostelOperationsDashboard';
import { BookingsManagementView } from './components/BookingsManagementView';
import { GoogleCalendarView } from './components/GoogleCalendarView';
import { SalesAvailabilityChecker } from './components/SalesAvailabilityChecker';
import { SettingsView } from './components/SettingsView';
import { CalendarSyncView } from './components/CalendarSyncView';
import { BookingModal } from './components/BookingModal';
import { BookingConfirmation } from './components/BookingConfirmation';
import { CalendarConfirmModal } from './components/CalendarConfirmModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Footer } from './components/Footer';
import { LoginScreen } from './components/auth/LoginScreen';
import { AssignRoleModal } from './components/roles/AssignRoleModal';

const AppContent: React.FC = () => {
  const { 
    activeTab, 
    toastMessage, 
    isSidebarCollapsed, 
    isAuthenticated, 
    handleLoginSuccess,
    isAssignRoleOpen,
    assignRoleTargetUser,
    closeAssignRoleModal,
    updateUser
  } = useBooking();

  // If not authenticated, render Login Screen as the first and only route
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col font-sans">
      
      {/* Side Navigation Panel: 240px wide or 72px collapsed */}
      <Sidebar />

      {/* Main Content Area: dynamically adjusted to sidebar width */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-60'
        }`}
      >
        {/* Top Bar */}
        <Header />

        {/* Dynamic Tab Body:
            1. Overview
            2. Bookings
            3. Availability (Room Timeline & Calendar)
            4. Rooms & Guests
            5. Settings (Integrations, Currencies, Offline, Dev)
        */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && <HostelOperationsDashboard />}
          {activeTab === 'bookings' && <BookingsManagementView />}
          {activeTab === 'availability' && <GoogleCalendarView />}
          {activeTab === 'rooms' && <SalesAvailabilityChecker />}
          {activeTab === 'sync' && <CalendarSyncView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Responsive Footer */}
        <Footer />
      </div>

      {/* Modals and Overlays */}
      <BookingModal />
      <BookingConfirmation />
      <CalendarConfirmModal />
      <UserManagementModal />
      <UserProfileModal />

      {/* Role Assignment Modal */}
      {isAssignRoleOpen && assignRoleTargetUser && (
        <AssignRoleModal
          isOpen={isAssignRoleOpen}
          user={assignRoleTargetUser}
          currentRole={
            assignRoleTargetUser.role || {
              id: 'role-admin',
              name: 'Admin',
              description: 'System Admin',
              is_system_role: true,
              created_at: '2025-01-01',
              permissions: []
            }
          }
          onClose={closeAssignRoleModal}
          onSuccess={(updated) => {
            updateUser(updated.id, { role_id: updated.role_id });
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-2 text-primary px-4 py-3 rounded-2xl shadow-xl border border-strong text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success-text)] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export function App() {
  return (
    <BookingProvider>
      <AppContent />
    </BookingProvider>
  );
}

export default App;
