export type PermissionCategory = 'Users' | 'Roles' | 'Bookings' | 'Rates' | 'Reports' | 'System';

export interface Permission {
  id: string;
  key: string;
  label: string;
  category: PermissionCategory;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  created_at: string;
  permissions: string[]; // array of permission keys
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role_id: string;
  status: 'active' | 'suspended';
  created_at: string;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null; // ISO date string
  avatar?: string;
  position?: string;
  department?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name: string;
  action: 
    | 'LOGIN'
    | 'LOGOUT'
    | 'FAILED_LOGIN'
    | 'ACCOUNT_LOCKED'
    | 'OTP_REQUESTED'
    | 'OTP_LOGIN'
    | 'CREATE_ROLE'
    | 'UPDATE_ROLE'
    | 'DELETE_ROLE'
    | 'ASSIGN_ROLE'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'SUSPEND_USER'
    | 'ACTIVATE_USER';
  target_type: 'role' | 'user' | 'permission' | 'auth';
  target_id: string;
  before_value: any;
  after_value: any;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface AuthSession {
  user: User;
  role: Role;
  permissions: string[];
  tokens: AuthTokens;
}

export interface OtpRecord {
  identifier: string; // email or phone
  code: string;
  expires_at: number; // timestamp ms
  used: boolean;
  resends_count: number;
  window_start: number; // timestamp ms
}
