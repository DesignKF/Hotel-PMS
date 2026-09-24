import React, { useState, useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';
import { AppUser, UserRole } from '../types';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Camera, 
  Upload, 
  Check, 
  RefreshCw, 
  Sparkles,
  Info,
  Sliders,
  FileText
} from 'lucide-react';

const AVATAR_PRESETS = [
  { label: 'Godfrey (Ops)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { label: 'Amani (GM)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { label: 'Grace (Sales)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
  { label: 'Baraka (Front)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { label: 'Juma (Expeditions)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
  { label: 'Zawadi (Host)', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80' },
  { label: 'Tumaini (Guest Services)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
  { label: 'Erick (Audit)', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80' }
];

export const ALL_PERMISSIONS = [
  { id: 'Manage Users & Roles', label: 'Manage Staff & Roles', category: 'Admin & Governance', desc: 'Provision staff members, reassign roles, and configure access permissions.' },
  { id: 'Full Financial Access', label: 'Full Financial Overview', category: 'Admin & Governance', desc: 'Inspect revenue, daily collections, deposits, and financial summaries.' },
  { id: 'Override Rates & Currencies', label: 'Override Bed Rates & FX', category: 'Admin & Governance', desc: 'Modify dorm/private bed prices and update currency conversion rates.' },
  { id: 'Delete Records', label: 'Delete Records & Bookings', category: 'Admin & Governance', desc: 'Permanently remove bookings, customer logs, or staff entries.' },
  { id: 'Google Calendar Sync', label: 'Google Calendar Integration', category: 'Operations & Calendar', desc: 'Authenticate with Google Workspace and sync hostel events.' },
  { id: 'Create & Edit Bookings', label: 'Create & Edit Bookings', category: 'Reservations & Front Desk', desc: 'Book beds, edit stay dates, allocate rooms, and adjust guest counts.' },
  { id: 'Check-In / Check-Out', label: 'Process Check-In & Check-Out', category: 'Reservations & Front Desk', desc: 'Mark guests checked-in, hand over keys, and finalize check-outs.' },
  { id: 'Room & Rate Overrides', label: 'Room Configuration & Rates', category: 'Reservations & Front Desk', desc: 'Adjust room features, amenities, and customized stay rates.' },
  { id: 'Customer Particulars', label: 'Customer Contact & Info', category: 'Reservations & Front Desk', desc: 'Access guest phone numbers, WhatsApp, emails, and notes.' },
  { id: 'Check Live Availability', label: 'Live Bed Availability Chart', category: 'Reservations & Front Desk', desc: 'Inspect bed counts, free beds, and clashes across dates.' },
  { id: 'Generate Quotes/Vouchers', label: 'Generate Quotes & Vouchers', category: 'Reservations & Front Desk', desc: 'Produce printable booking confirmations and guest vouchers.' },
  { id: 'View Calendar Overview', label: 'View Calendar Timeline', category: 'Reservations & Front Desk', desc: 'Browse the 14-day interactive hostel occupancy calendar.' },
  { id: 'Daily Check-In/Out', label: 'Daily Front Desk Log', category: 'Operations & Front Desk', desc: 'Inspect arrivals and departures roster for the operating day.' },
  { id: 'Log Payments & Deposits', label: 'Register Payments & Deposits', category: 'Operations & Front Desk', desc: 'Record cash, Mobile Money, or card payments at reception.' },
  { id: 'Guest Contact Access', label: 'Direct Guest Communications', category: 'Operations & Front Desk', desc: 'Direct access to message guests for arrivals & transfers.' },
  { id: 'Day Roster Inspection', label: 'Day Roster & Housekeeping', category: 'Operations & Front Desk', desc: 'Review bed status and room cleaning schedules.' }
];

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ALL_PERMISSIONS.map(p => p.id),
  manager: [
    'Create & Edit Bookings',
    'Check-In / Check-Out',
    'Google Calendar Sync',
    'Room & Rate Overrides',
    'Customer Particulars',
    'Check Live Availability',
    'Generate Quotes/Vouchers',
    'View Calendar Overview',
    'Daily Check-In/Out',
    'Log Payments & Deposits',
    'Guest Contact Access',
    'Day Roster Inspection'
  ],
  sales: [
    'Check Live Availability',
    'Create & Edit Bookings',
    'Generate Quotes/Vouchers',
    'View Calendar Overview',
    'Customer Particulars',
    'Guest Contact Access'
  ],
  front_desk: [
    'Daily Check-In/Out',
    'Check-In / Check-Out',
    'Log Payments & Deposits',
    'Guest Contact Access',
    'Day Roster Inspection',
    'Check Live Availability',
    'View Calendar Overview'
  ]
};

export const UserProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    closeProfileModal,
    profileUserToEdit,
    currentUser,
    updateUser,
    isAdmin,
    canManageRoles,
    openAssignRoleModal,
    showToast
  } = useBooking();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // The user being viewed or edited
  const targetUser = profileUserToEdit || currentUser;
  const isEditingSelf = targetUser.id === currentUser.id;

  // Active Tab inside modal
  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'avatar'>('profile');

  // Form states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState<UserRole>('sales');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  // Sync state whenever targetUser changes
  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name || '');
      setPosition(targetUser.position || '');
      setEmail(targetUser.email || '');
      setPhone(targetUser.phone || '');
      setDepartment(targetUser.department || '');
      setBio(targetUser.bio || '');
      setAvatar(targetUser.avatar || '');
      setUrlInput(targetUser.avatar || '');
      setRole(targetUser.role || 'sales');
      setStatus(targetUser.status || 'active');
      setPermissions(targetUser.customPermissions || ROLE_DEFAULT_PERMISSIONS[targetUser.role] || []);
    }
  }, [targetUser, isProfileModalOpen]);

  if (!isProfileModalOpen || !targetUser) return null;

  // Role permissions change helper (Admin only)
  const handleRoleChange = (newRole: UserRole) => {
    if (!isAdmin) return;
    setRole(newRole);
    // Automatically apply default permissions for the new role
    setPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || []);
  };

  const handleTogglePermission = (permId: string) => {
    if (!isAdmin) return;
    setPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleResetPermissionsToRoleDefault = () => {
    if (!isAdmin) return;
    setPermissions(ROLE_DEFAULT_PERMISSIONS[role] || []);
    showToast(`Permissions reset to standard ${role.toUpperCase()} defaults`);
  };

  // Avatar file upload reader (stores local base64 preview)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image is larger than 2MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
        setUrlInput(event.target.result);
        showToast('Photo uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (presetUrl: string) => {
    setAvatar(presetUrl);
    setUrlInput(presetUrl);
    showToast('Avatar preset selected');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please provide a full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }

    // Build updates payload based on authorization
    const updates: Partial<AppUser> = {
      name: name.trim(),
      position: position.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      bio: bio.trim(),
      avatar: avatar.trim()
    };

    // If admin is editing, they can update role, status, and permissions
    if (isAdmin) {
      updates.role = role;
      updates.status = status;
      updates.customPermissions = permissions;
    }

    updateUser(targetUser.id, updates);
    closeProfileModal();
  };

  // Group permissions by category
  const permissionCategories = Array.from(new Set(ALL_PERMISSIONS.map(p => p.category)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="card-surface rounded-3xl max-w-2xl w-full border border-strong shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-surface-2 text-primary p-5 sm:p-6 shrink-0 relative border-b border-subtle">
          <button
            type="button"
            onClick={closeProfileModal}
            className="absolute top-5 right-5 p-1.5 rounded-full text-secondary hover:text-primary hover:bg-surface-3 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded bg-[var(--primary-gold)] text-[var(--primary-gold-text)]">
              <User className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary-gold)]">
              {isEditingSelf ? 'Personal Profile Settings' : 'Staff Profile Management'}
            </span>
            {isAdmin ? (
              <span className="ml-auto mr-8 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-300" />
                <span>Admin Full Access</span>
              </span>
            ) : (
              <span className="ml-auto mr-8 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-3 text-secondary border border-subtle flex items-center gap-1">
                <Lock className="w-3 h-3 text-tertiary" />
                <span>Staff Member View</span>
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif text-primary tracking-tight">
            {isEditingSelf ? 'Edit My Profile Details' : `Edit Profile: ${targetUser.name}`}
          </h3>
          <p className="text-xs text-secondary mt-1 max-w-xl leading-relaxed">
            {isAdmin 
              ? 'As an Administrator, you can update all user details including position, role, active status, and custom permissions.'
              : 'Update your display name, profile photo, job position, and contact information. System roles and status are managed by hostel administration.'}
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-subtle text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-surface-3'
              }`}
            >
              Profile Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('avatar')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'avatar'
                  ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-surface-3'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo &amp; Avatar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'bg-[var(--primary-gold)] text-[var(--primary-gold-text)] shadow-xs'
                  : 'text-secondary hover:text-primary hover:bg-surface-3'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Permissions ({permissions.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-surface-1">
          
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {/* Profile Preview Header Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-2 border border-subtle">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--primary-navy)] text-[var(--primary-gold)] font-black flex items-center justify-center text-lg overflow-hidden border-2 border-white/20 shadow-md">
                    {avatar ? (
                      <img 
                        src={avatar} 
                        alt={name || 'Avatar'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image link breaks
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      (name || 'MU').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('avatar')}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[var(--primary-gold)] text-[var(--primary-gold-text)] hover:brightness-95 transition-colors shadow-sm cursor-pointer"
                    title="Change Photo"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-primary truncate">
                      {name || 'Staff Member'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                      status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : 'bg-surface-3 text-secondary border-subtle'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--primary-gold)] font-bold">
                    {position || 'Hostel Staff'}
                  </p>
                  <p className="text-[11px] text-tertiary truncate">
                    {email} · {department || 'Moshi Urban'}
                  </p>
                </div>
              </div>

              {/* General Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name (Editable by user and admin) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary flex items-center justify-between">
                    <span>Full Name *</span>
                    <span className="text-[10px] text-tertiary font-normal">Editable</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-tertiary absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Godfrey Mrosso"
                      className="w-full !pl-10 pr-3 py-2 bg-surface-2 border border-subtle rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                {/* Job Position (Editable by user and admin) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary flex items-center justify-between">
                    <span>Position / Job Title *</span>
                    <span className="text-[10px] text-tertiary font-normal">Editable</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-tertiary absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Reservations & Operations Manager"
                      className="w-full !pl-10 pr-3 py-2 bg-surface-2 border border-subtle rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                {/* Email Address (Editable by user and admin) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary flex items-center justify-between">
                    <span>Email Address *</span>
                    <span className="text-[10px] text-tertiary font-normal">Editable</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-tertiary absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="reservations@moshiurban.co.tz"
                      className="w-full !pl-10 pr-3 py-2 bg-surface-2 border border-subtle rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                {/* Phone / WhatsApp (Editable by user and admin) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary flex items-center justify-between">
                    <span>Phone &amp; WhatsApp *</span>
                    <span className="text-[10px] text-tertiary font-normal">Editable</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-tertiary absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+255 715 777 354"
                      className="w-full !pl-10 pr-3 py-2 bg-surface-2 border border-subtle rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                {/* Department (Editable) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-secondary flex items-center justify-between">
                    <span>Department / Branch</span>
                    <span className="text-[10px] text-tertiary font-normal">Editable</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-tertiary absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Reservations & Front Office, Moshi Urban Hostel"
                      className="w-full !pl-10 pr-3 py-2 bg-surface-2 border border-subtle rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                    />
                  </div>
                </div>

                {/* Staff Bio / Notes (Editable) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-secondary flex items-center justify-between">
                    <span>Staff Bio / Responsibilities</span>
                    <span className="text-[10px] text-tertiary font-normal">Editable</span>
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of primary duties, languages spoken, or guest hospitality specializations..."
                    className="w-full p-2.5 bg-surface-2 border border-subtle rounded-xl text-xs font-normal text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                  />
                </div>

              </div>

              {/* Administrative Governance Section (Role & Status) */}
              <div className={`mt-4 p-4 rounded-2xl border transition-all ${
                isAdmin 
                  ? 'bg-purple-950/20 border-purple-500/30' 
                  : 'bg-surface-2 border-subtle'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-subtle mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-purple-400' : 'text-tertiary'}`} />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                      System Role &amp; Account Status
                    </h5>
                  </div>
                  {!isAdmin && (
                    <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Admin Controlled</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* System Role */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary flex items-center justify-between">
                      <span>Assigned Role</span>
                      {!isAdmin && <span className="text-[10px] text-tertiary">Locked</span>}
                    </label>

                    {isAdmin || canManageRoles ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-surface-1 border border-subtle rounded-xl text-xs font-bold text-primary capitalize">
                          {role.replace('_', ' ')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            closeProfileModal();
                            openAssignRoleModal(targetUser);
                          }}
                          className="btn-primary !h-8.5 !px-3 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                          title="Assign role to this user"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Assign Role</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-surface-1 border border-subtle rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-primary capitalize">
                          {role.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-tertiary font-medium">
                          Managed by Admin
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Account Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary flex items-center justify-between">
                      <span>Account Status</span>
                      {!isAdmin && <span className="text-[10px] text-tertiary">Locked</span>}
                    </label>

                    {isAdmin ? (
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                        className="w-full px-3 py-2 bg-surface-1 border border-purple-400/40 rounded-xl text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
                      >
                        <option value="active">Active (Access Allowed)</option>
                        <option value="inactive">Inactive / Suspended (Access Revoked)</option>
                      </select>
                    ) : (
                      <div className="p-2.5 bg-surface-1 border border-subtle rounded-xl flex items-center justify-between text-xs">
                        <span className={`font-bold capitalize ${status === 'active' ? 'text-emerald-500' : 'text-tertiary'}`}>
                          {status}
                        </span>
                        <span className="text-[10px] text-tertiary font-medium">
                          Managed by Admin
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {!isAdmin && (
                  <p className="text-[11px] text-secondary mt-2.5 leading-relaxed bg-surface-1 p-2.5 rounded-xl border border-subtle">
                    ℹ️ You have permission to edit your <strong>Name, Profile Photo, Position, and Contact Information</strong>. To modify your administrative role or account status, please request a review from the General Manager.
                  </p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Photo & Avatar Manager */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              
              {/* Current Photo View */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-surface-2 rounded-3xl border border-subtle">
                <div className="w-24 h-24 rounded-3xl bg-[var(--primary-navy)] text-[var(--primary-gold)] font-black flex items-center justify-center text-3xl overflow-hidden shadow-lg border-4 border-white/20 shrink-0">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    (name || 'MU').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="font-bold text-primary text-sm">
                    Profile Photo &amp; Avatar
                  </h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Upload an image directly from your computer or phone, choose from our professional safari hostel team presets, or paste a custom web image URL.
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    {/* Device Upload Trigger */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary !h-8 !px-3 !text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatar('');
                          setUrlInput('');
                          showToast('Profile photo reset to name initials');
                        }}
                        className="btn-secondary !h-8 !px-3 !text-xs"
                      >
                        Reset to Initials
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatar Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-secondary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                  <span>Choose from Staff Team Presets</span>
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = avatar === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(preset.url)}
                        className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[var(--primary-gold)] ring-3 ring-[var(--primary-gold)]/30 scale-105 shadow-md' 
                            : 'border-subtle hover:border-[var(--primary-gold)] opacity-80 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img 
                          src={preset.url} 
                          alt={preset.label} 
                          className="w-full h-full object-cover" 
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[var(--primary-gold)]/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Input */}
              <div className="space-y-1.5 pt-2 border-t border-subtle">
                <label className="text-xs font-bold text-secondary">
                  Or Paste Custom Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 bg-surface-2 border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:border-[var(--primary-gold)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (urlInput.trim()) {
                        setAvatar(urlInput.trim());
                        showToast('Applied custom image URL');
                      }
                    }}
                    className="btn-primary !h-8 !px-4 !text-xs"
                  >
                    Apply URL
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Permissions Matrix */}
          {activeTab === 'permissions' && (
            <div className="space-y-5">
              
              {/* Permission Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isAdmin 
                  ? 'bg-purple-950/20 border-purple-500/30 text-purple-200' 
                  : 'bg-surface-2 border-subtle text-secondary'
              }`}>
                <Info className={`w-5 h-5 shrink-0 mt-0.5 ${isAdmin ? 'text-purple-400' : 'text-tertiary'}`} />
                <div className="text-xs flex-1">
                  {isAdmin ? (
                    <>
                      <strong className="block font-bold mb-0.5 text-primary">Admin Permissions Controller:</strong>
                      As an Administrator, you can fine-tune granular capabilities for <strong>{name}</strong> by checking or unchecking individual rights below.
                    </>
                  ) : (
                    <>
                      <strong className="block font-bold mb-0.5 text-primary">Your Active System Rights:</strong>
                      Your account permissions are determined by your <strong>{role.toUpperCase()}</strong> role. To request additional permissions, contact hostel management.
                    </>
                  )}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleResetPermissionsToRoleDefault}
                    className="btn-secondary !h-7 !px-2.5 !text-[11px] shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                )}
              </div>

              {/* Categorized Permissions Grid */}
              <div className="space-y-4">
                {permissionCategories.map((cat) => {
                  const catPermissions = ALL_PERMISSIONS.filter(p => p.category === cat);
                  
                  return (
                    <div key={cat} className="space-y-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-tertiary flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-[var(--primary-gold)]" />
                        <span>{cat}</span>
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {catPermissions.map((perm) => {
                          const isGranted = permissions.includes(perm.id);

                          return (
                            <label
                              key={perm.id}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                                isAdmin ? 'cursor-pointer hover:border-purple-400/50' : 'cursor-default'
                              } ${
                                isGranted 
                                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                                  : 'bg-surface-2/60 border-subtle opacity-60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={!isAdmin}
                                checked={isGranted}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-default"
                              />
                              <div className="min-w-0 flex-1">
                                <span className={`text-xs font-bold block leading-tight ${
                                  isGranted ? 'text-primary' : 'text-tertiary'
                                }`}>
                                  {perm.label}
                                </span>
                                <span className="text-[10px] text-tertiary leading-tight block mt-0.5">
                                  {perm.desc}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Modal Action Bar */}
          <div className="pt-4 border-t border-subtle flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeProfileModal}
              className="btn-secondary !h-9 !px-4 !text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary !h-9 !px-6 !text-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
