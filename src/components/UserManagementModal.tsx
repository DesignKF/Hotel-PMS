import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { AppUser, UserRole } from '../types';
import { 
  X, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  Sparkles,
  Edit2,
  Check,
  UserCheck,
  Briefcase,
  AlertCircle,
  Sliders,
  Activity
} from 'lucide-react';
import { MoshiUrbanLogo } from './MoshiUrbanLogo';
import { RoleManagementView } from './roles/RoleManagementView';
import { AuditLogView } from './audit/AuditLogView';

const ROLE_DETAILS: Record<UserRole, { label: string; badgeClass: string; description: string; permissions: string[] }> = {
  admin: {
    label: 'Admin (General Manager)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Full system control: provision staff, edit all profile details, customize user permissions, alter bed pricing, manage currencies, and export Google Calendar.',
    permissions: ['Manage Users & Roles', 'Full Financial Access', 'Override Rates & Currencies', 'Google Calendar Sync', 'Delete Records', 'Edit All Profiles & Permissions']
  },
  manager: {
    label: 'Reservation Manager',
    badgeClass: 'bg-[var(--primary-gold)]/15 text-[var(--primary-gold)] border-[var(--primary-gold)]/30',
    description: 'Direct operations & reservations: add/remove front desk and sales staff, edit own profile, manage bookings, check-ins/check-outs, and calendar sync.',
    permissions: ['Add & Remove Staff', 'Edit Own Profile', 'Create & Edit Bookings', 'Check-In / Check-Out', 'Google Calendar Sync', 'Room & Rate Overrides']
  },
  sales: {
    label: 'Sales Agent',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Sales and reservations agent: edit own personal details (name, photo, position, contact info), check live bed availability, and generate booking vouchers.',
    permissions: ['Edit Own Profile', 'Check Live Availability', 'Create Direct Bookings', 'Generate Quotes/Vouchers', 'View Calendar Overview']
  },
  front_desk: {
    label: 'Front Desk Reception',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Front office staff: edit own personal details (name, photo, position, contact info), daily guest check-ins/check-outs, log cash/Mobile Money payments, and inspect day roster.',
    permissions: ['Edit Own Profile', 'Daily Check-In/Out', 'Log Payments & Deposits', 'Guest Contact Access', 'Day Roster Inspection']
  }
};

export const UserManagementModal: React.FC = () => {
  const {
    isUserManagementOpen,
    setIsUserManagementOpen,
    users,
    currentUser,
    switchUser,
    createUser,
    updateUser,
    deleteUser,
    canManageUsers,
    canManageRoles,
    isAdmin,
    openProfileModal,
    currentUserPermissions,
    openAssignRoleModal
  } = useBooking();

  const [activeTab, setActiveTab] = useState<'users' | 'add' | 'roles' | 'audit'>('users');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Form State for New User
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    role: 'sales' as UserRole,
    department: 'Sales & Reservations',
    phone: '+255 ',
    status: 'active' as 'active' | 'inactive'
  });

  if (!isUserManagementOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    if (!formData.name.trim() || !formData.email.trim()) return;

    createUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      position: formData.position.trim() || `${formData.role.replace('_', ' ').toUpperCase()} Staff`,
      role: formData.role,
      department: formData.department,
      phone: formData.phone.trim(),
      status: formData.status,
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`
    });

    setFormData({
      name: '',
      email: '',
      position: '',
      role: 'sales',
      department: 'Sales & Reservations',
      phone: '+255 ',
      status: 'active'
    });
    setActiveTab('users');
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="card-surface rounded-3xl max-w-4xl w-full border border-strong shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-surface-2 text-primary p-5 sm:p-6 shrink-0 relative border-b border-subtle">
          <button
            type="button"
            onClick={() => setIsUserManagementOpen(false)}
            className="absolute top-5 right-5 p-1.5 rounded-full text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-[var(--primary-gold)] text-[var(--primary-gold-text)]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary-gold)]">
              Moshi Urban Hostel PMS · Staff &amp; Roles Administration
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif text-primary tracking-tight">
            User Management &amp; Access Control
          </h3>
          <p className="text-xs text-secondary mt-1 max-w-2xl leading-relaxed">
            Manage hostel team members, customize role-based permissions, edit personal profile information, and switch active staff sessions.
          </p>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-subtle text-xs overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'users'
                  ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-surface-3'
              }`}
            >
              Staff Directory ({users.length})
            </button>

            {/* Add New Staff Tab - accessible to manager and admin */}
            {canManageUsers ? (
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'add'
                    ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                    : 'text-secondary hover:text-primary hover:bg-surface-3'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-xl font-bold text-tertiary opacity-60 flex items-center gap-1.5 cursor-not-allowed shrink-0"
                title="Only Manager and Admin can add new staff"
              >
                <Lock className="w-3 h-3" />
                <span>Add Staff</span>
              </button>
            )}

            {/* Roles & RBAC Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'roles'
                  ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-surface-3'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Roles &amp; RBAC</span>
            </button>

            {/* Security Audit Log Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-surface-3'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Security Audit Log</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-surface-1">
          
          {/* TAB 1: Users Directory */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              {/* Role filter bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="font-bold text-secondary mr-1">Filter:</span>
                  {(['all', 'admin', 'manager', 'sales', 'front_desk'] as const).map(rf => (
                    <button
                      key={rf}
                      type="button"
                      onClick={() => setRoleFilter(rf)}
                      className={`px-2.5 py-1 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shrink-0 ${
                        roleFilter === rf
                          ? 'bg-[var(--primary-navy)] text-white dark:bg-[var(--primary-gold)] dark:text-[var(--primary-gold-text)]'
                          : 'bg-surface-2 text-secondary hover:text-primary hover:bg-surface-3 border border-subtle'
                      }`}
                    >
                      {rf === 'all' ? 'All Roles' : rf.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-secondary flex items-center gap-2">
                  <span>Current Session: <strong className="text-primary">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
                  <button
                    type="button"
                    onClick={() => openProfileModal(currentUser)}
                    className="btn-secondary !h-7 !px-2.5 !text-[10px] flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit My Profile</span>
                  </button>
                </div>
              </div>

              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredUsers.map(user => {
                  const roleConfig = ROLE_DETAILS[user.role] || ROLE_DETAILS.sales;
                  const isCurrent = user.id === currentUser.id;
                  const canEditThisUser = isAdmin || isCurrent;
                  const canDeleteThisUser = canManageUsers && !isCurrent && users.length > 1 && (isAdmin || user.role !== 'admin');

                  return (
                    <div 
                      key={user.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isCurrent
                          ? 'bg-surface-2 border-[var(--primary-gold)] ring-2 ring-[var(--primary-gold)]/30 shadow-xs'
                          : 'bg-surface-2 border-subtle hover:border-strong'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-navy)] text-[var(--primary-gold)] font-black flex items-center justify-center text-sm shadow-xs border border-subtle shrink-0 overflow-hidden">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-primary text-sm leading-tight truncate">
                                {user.name}
                              </h4>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[var(--primary-gold)] block truncate">
                              {user.position || `${user.role.toUpperCase()} Specialist`}
                            </span>
                            <span className="text-[10px] text-tertiary block truncate">
                              {user.department || 'Hostel Staff'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConfig.badgeClass}`}>
                            {roleConfig.label.split(' ')[0]}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-3 text-secondary'
                          }`}>
                            {user.status || 'active'}
                          </span>
                        </div>
                      </div>

                      {/* Contact & Status Details */}
                      <div className="text-xs text-secondary space-y-1 bg-surface-1 p-2.5 rounded-xl border border-subtle">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-tertiary shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-tertiary shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[10px] text-tertiary pt-1 border-t border-subtle">
                          <span>Joined: {user.createdAt}</span>
                          <span>Last active: {user.lastActive || 'Today'}</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-1 text-xs gap-2">
                        
                        {/* Switch profile or Current Indicator */}
                        <div>
                          {isCurrent ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Active Session</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => switchUser(user.id)}
                              className="px-2.5 py-1 bg-[var(--primary-navy)] hover:opacity-90 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer shadow-xs dark:bg-surface-3 dark:hover:bg-surface-2 dark:border dark:border-subtle"
                            >
                              Switch Session
                            </button>
                          )}
                        </div>

                        {/* Edit Profile & Delete Controls */}
                        <div className="flex items-center gap-1.5">
                          
                          {/* Assign Role Button - Accessible to users with canManageRoles */}
                          {canManageRoles && (
                            <button
                              type="button"
                              onClick={() => openAssignRoleModal(user)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs bg-[var(--primary-gold)]/15 hover:bg-[var(--primary-gold)]/25 text-[var(--primary-gold)] border border-[var(--primary-gold)]/30"
                              title="Assign role to this staff member"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Assign Role</span>
                            </button>
                          )}

                          {/* Edit Profile Button */}
                          <button
                            type="button"
                            onClick={() => openProfileModal(user)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                              isAdmin
                                ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800'
                                : isCurrent
                                  ? 'bg-[var(--primary-gold)] hover:brightness-95 text-[var(--primary-gold-text)]'
                                  : 'bg-surface-2 hover:bg-surface-3 text-secondary border border-subtle'
                            }`}
                            title={isAdmin ? 'Edit all user details, role & permissions' : isCurrent ? 'Edit your profile details' : 'View profile details'}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{isAdmin ? 'Edit & Permissions' : isCurrent ? 'Edit Profile' : 'View'}</span>
                          </button>

                          {/* Delete User Button - Only Manager and Admin */}
                          {canDeleteThisUser && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove staff member ${user.name}? This action cannot be undone.`)) {
                                  deleteUser(user.id);
                                }
                              }}
                              className="p-1.5 text-tertiary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Remove Staff Account (Manager/Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Add New Staff Member Form (Restricted to Manager and Admin) */}
          {activeTab === 'add' && (
            canManageUsers ? (
              <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-xl mx-auto bg-surface-2 p-6 rounded-3xl border border-subtle">
                <div className="flex items-center gap-2 pb-2 border-b border-subtle">
                  <UserPlus className="w-4 h-4 text-[var(--primary-gold)]" />
                  <div>
                    <h4 className="text-base font-bold text-primary">
                      Provision New Staff User Profile
                    </h4>
                    <span className="text-[11px] text-tertiary">
                      Authorized for General Manager &amp; Reservation Manager
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amani Kimaro"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. amani@moshiurban.co.tz"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Position / Job Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Safari Consultant"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Assigned System Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        let defaultDept = 'Sales & Reservations';
                        if (newRole === 'admin') defaultDept = 'Executive Administration';
                        if (newRole === 'manager') defaultDept = 'Reservations & Operations';
                        if (newRole === 'front_desk') defaultDept = 'Front Desk Reception';
                        setFormData(prev => ({ ...prev, role: newRole, department: defaultDept }));
                      }}
                      className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs font-bold text-primary focus:outline-none focus:border-[var(--primary-gold)] cursor-pointer"
                    >
                      <option value="admin">Admin (General Manager)</option>
                      <option value="manager">Reservation Manager</option>
                      <option value="sales">Sales Agent</option>
                      <option value="front_desk">Front Desk Reception</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Reservations & Front Office"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary">Phone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+255 7XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs font-semibold text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="btn-secondary !h-9 !px-4 !text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !h-9 !px-5 !text-xs"
                  >
                    Create Staff Member
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center max-w-md mx-auto space-y-3 bg-surface-2 rounded-3xl border border-subtle">
                <AlertCircle className="w-10 h-10 text-[var(--status-warning-text)] mx-auto" />
                <h4 className="font-bold text-primary text-base">
                  Staff Provisioning Restricted
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  Only the <strong>Reservation Manager</strong> and <strong>General Manager (Admin)</strong> are authorized to add or remove staff user accounts.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="btn-primary !h-8 !px-4 !text-xs mx-auto"
                >
                  Return to Staff Directory
                </button>
              </div>
            )
          )}

          {/* TAB 3: Roles & RBAC Management */}
          {activeTab === 'roles' && (
            <RoleManagementView 
              currentUserPermissions={currentUserPermissions} 
            />
          )}

          {/* TAB 4: Security Audit Log */}
          {activeTab === 'audit' && (
            <AuditLogView 
              currentUserPermissions={currentUserPermissions} 
            />
          )}

        </div>

      </div>
    </div>
  );
};
