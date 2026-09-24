import type { Permission, Role, User } from '../types/auth.ts';

export const SYSTEM_PERMISSIONS: Permission[] = [
  // Roles Category
  {
    id: 'perm-manage-roles',
    key: 'manage_roles',
    label: 'Manage Roles & Access Control',
    category: 'Roles',
    description: 'Create, edit, and delete staff roles and customize permission bundles'
  },
  {
    id: 'perm-view-roles',
    key: 'view_roles',
    label: 'View Roles & Permissions',
    category: 'Roles',
    description: 'Inspect assigned role lists and permission matrices without edit access'
  },

  // Users Category
  {
    id: 'perm-manage-users',
    key: 'manage_users',
    label: 'Manage Staff Accounts',
    category: 'Users',
    description: 'Create new staff accounts, edit user particulars, and suspend/activate users'
  },
  {
    id: 'perm-view-users',
    key: 'view_users',
    label: 'View Staff Directory',
    category: 'Users',
    description: 'Browse staff contact list, phone numbers, and active work shifts'
  },
  {
    id: 'perm-view-audit-log',
    key: 'view_audit_log',
    label: 'View Security Audit Log',
    category: 'Users',
    description: 'Inspect security audit logs of logins, role modifications, and account locks'
  },

  // Bookings Category
  {
    id: 'perm-view-bookings',
    key: 'view_bookings',
    label: 'View Bookings & Room Timeline',
    category: 'Bookings',
    description: 'Read reservations ledger, room availability timeline, and arrivals roster'
  },
  {
    id: 'perm-create-bookings',
    key: 'create_bookings',
    label: 'Create Direct Bookings',
    category: 'Bookings',
    description: 'Create new guest reservations, dorm bed bookings, and issue vouchers'
  },
  {
    id: 'perm-manage-bookings',
    key: 'manage_bookings',
    label: 'Check-In / Out & Cancellations',
    category: 'Bookings',
    description: 'Execute guest check-ins, record departures, and manage cancellations'
  },

  // Rates Category
  {
    id: 'perm-manage-rates',
    key: 'manage_rates',
    label: 'Manage Rates & Currency Overrides',
    category: 'Rates',
    description: 'Modify room night pricing, bed tariffs, and live currency conversions'
  },

  // Reports Category
  {
    id: 'perm-view-reports',
    key: 'view_reports',
    label: 'View Financial & Revenue Reports',
    category: 'Reports',
    description: 'Access revenue metrics, occupancy analytics, no-shows, and refunds'
  },

  // System Category
  {
    id: 'perm-manage-system',
    key: 'manage_system',
    label: 'System & Calendar Integrations',
    category: 'System',
    description: 'Configure Google Calendar sync, notification rules, and hostel particulars'
  }
];

export const SYSTEM_ROLE_ADMIN_ID = 'role-admin';

// Seed Roles
export const SEED_ROLES: Role[] = [
  {
    id: SYSTEM_ROLE_ADMIN_ID,
    name: 'Admin',
    description: 'Full system control: unrestricted authority across staff, roles, rates, and hostel operations.',
    is_system_role: true,
    created_at: '2025-01-01T00:00:00.000Z',
    permissions: SYSTEM_PERMISSIONS.map(p => p.key) // Every permission assigned
  },
  {
    id: 'role-manager',
    name: 'Reservation Manager',
    description: 'Direct operations: manage staff accounts, manage guest bookings, oversee rates and reports.',
    is_system_role: false,
    created_at: '2025-01-01T00:00:00.000Z',
    permissions: [
      'manage_roles',
      'view_roles',
      'manage_users',
      'view_users',
      'view_audit_log',
      'view_bookings',
      'create_bookings',
      'manage_bookings',
      'manage_rates',
      'view_reports'
    ]
  },
  {
    id: 'role-frontdesk',
    name: 'Front Desk Reception',
    description: 'Front office: guest arrivals, room check-in/out, vouchers, and guest directory.',
    is_system_role: false,
    created_at: '2025-01-01T00:00:00.000Z',
    permissions: [
      'view_users',
      'view_bookings',
      'create_bookings',
      'manage_bookings'
    ]
  },
  {
    id: 'role-sales',
    name: 'Sales Agent',
    description: 'Sales & reservations: check bed availability, create guest quotes, and book rooms.',
    is_system_role: false,
    created_at: '2025-01-01T00:00:00.000Z',
    permissions: [
      'view_users',
      'view_bookings',
      'create_bookings'
    ]
  }
];

// Seed users receive a fresh hash from ADMIN_PASSWORD when the server starts.
// This placeholder is replaced by UserStore and is never used for authentication.
export const SEED_PASSWORD_HASH = 'pbkdf2$1000$moshi_salt_2025$6a74b68e986fe7f7bfec4259b36d0f576e257eb77353f868ad92497645f75e7a';

export const SEED_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Godfrey Njau',
    email: 'gdnjau@gmail.com',
    phone: '+255692953199',
    password_hash: SEED_PASSWORD_HASH,
    role_id: SYSTEM_ROLE_ADMIN_ID,
    status: 'active',
    created_at: '2025-01-01T08:00:00.000Z',
    last_login_at: '2026-09-24T10:00:00.000Z',
    failed_login_attempts: 0,
    locked_until: null,
    position: 'General Manager & Director',
    department: 'Executive Administration',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-demo-admin',
    name: 'General Manager (Demo)',
    email: 'admin@moshiurban.co.tz',
    phone: '+255715777354',
    password_hash: SEED_PASSWORD_HASH,
    role_id: SYSTEM_ROLE_ADMIN_ID,
    status: 'active',
    created_at: '2025-01-01T08:00:00.000Z',
    last_login_at: '2026-09-24T10:00:00.000Z',
    failed_login_attempts: 0,
    locked_until: null,
    position: 'General Manager (Test Account)',
    department: 'Executive Administration',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-manager',
    name: 'Amina Kimaro',
    email: 'manager@moshiurban.co.tz',
    phone: '+255754123456',
    password_hash: SEED_PASSWORD_HASH,
    role_id: 'role-manager',
    status: 'active',
    created_at: '2025-01-15T09:30:00.000Z',
    last_login_at: '2026-09-24T09:15:00.000Z',
    failed_login_attempts: 0,
    locked_until: null,
    position: 'Head of Operations & Reservations',
    department: 'Front Office',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-frontdesk',
    name: 'Kelvin Mushi',
    email: 'frontdesk@moshiurban.co.tz',
    phone: '+255788998877',
    password_hash: SEED_PASSWORD_HASH,
    role_id: 'role-frontdesk',
    status: 'active',
    created_at: '2025-02-01T11:00:00.000Z',
    last_login_at: '2026-09-23T16:45:00.000Z',
    failed_login_attempts: 0,
    locked_until: null,
    position: 'Senior Receptionist',
    department: 'Guest Relations',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'user-sales',
    name: 'Sarah Ndossi',
    email: 'sales@moshiurban.co.tz',
    phone: '+255767223344',
    password_hash: SEED_PASSWORD_HASH,
    role_id: 'role-sales',
    status: 'active',
    created_at: '2025-02-15T14:20:00.000Z',
    last_login_at: '2026-09-22T12:30:00.000Z',
    failed_login_attempts: 0,
    locked_until: null,
    position: 'Reservations & Sales Agent',
    department: 'Sales & Marketing',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
  }
];
