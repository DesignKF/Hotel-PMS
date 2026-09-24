import type { User, Role, Permission, AuditLog, OtpRecord } from '../types/auth.ts';
import { SYSTEM_PERMISSIONS, SEED_ROLES, SEED_USERS, SYSTEM_ROLE_ADMIN_ID } from './seedData.ts';
import { hashPassword, verifyPassword, generateOtp, getWhatsAppUrl, sendEmailOtp } from './security.ts';

const FAILED_ATTEMPT_LOCK_LIMIT = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_MAX_RESENDS = 3;
const OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

class UserStore {
  private users: User[] = [];
  private roles: Role[] = [];
  private permissions: Permission[] = SYSTEM_PERMISSIONS;
  private auditLogs: AuditLog[] = [];
  private otps: Map<string, OtpRecord> = new Map();
  private revokedTokens: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    // Clone seed roles
    this.roles = JSON.parse(JSON.stringify(SEED_ROLES));
    // Clone seed users
    this.users = JSON.parse(JSON.stringify(SEED_USERS));
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    const adminPassword = (envAdminPassword && envAdminPassword !== 'replace-with-a-strong-password') 
      ? envAdminPassword 
      : 'Admin12345';
    const adminPasswordHash = hashPassword(adminPassword);
    const staffPasswordHash = hashPassword('Moshi123!');
    this.users = this.users.map(user => {
      const isAdmin = user.role_id === SYSTEM_ROLE_ADMIN_ID || 
                      user.email.toLowerCase() === 'admin@moshiurban.co.tz' || 
                      user.email.toLowerCase() === 'gdnjau@gmail.com';
      return {
        ...user,
        password_hash: isAdmin ? adminPasswordHash : staffPasswordHash
      };
    });
    // Seed initial audit log
    this.auditLogs = [
      {
        id: 'audit-init-1',
        actor_user_id: 'user-admin',
        actor_name: 'System Provisioner',
        action: 'CREATE_ROLE',
        target_type: 'role',
        target_id: SYSTEM_ROLE_ADMIN_ID,
        before_value: null,
        after_value: { name: 'Admin', is_system_role: true, permissionsCount: SYSTEM_PERMISSIONS.length },
        created_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'audit-init-2',
        actor_user_id: 'user-admin',
        actor_name: 'System Provisioner',
        action: 'CREATE_USER',
        target_type: 'user',
        target_id: 'user-admin',
        before_value: null,
        after_value: { email: 'gdnjau@gmail.com', role_id: SYSTEM_ROLE_ADMIN_ID },
        created_at: '2025-01-01T08:00:00.000Z'
      }
    ];
  }

  // Permissions
  getPermissions(): Permission[] {
    return this.permissions;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  logAudit(
    actorId: string,
    actorName: string,
    action: AuditLog['action'],
    targetType: AuditLog['target_type'],
    targetId: string,
    beforeValue: any,
    afterValue: any
  ): AuditLog {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_user_id: actorId,
      actor_name: actorName,
      action,
      target_type: targetType,
      target_id: targetId,
      before_value: beforeValue ? JSON.parse(JSON.stringify(beforeValue)) : null,
      after_value: afterValue ? JSON.parse(JSON.stringify(afterValue)) : null,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  // Roles
  getRoles(): (Role & { users_count: number; permissions_count: number })[] {
    return this.roles.map(r => ({
      ...r,
      users_count: this.users.filter(u => u.role_id === r.id).length,
      permissions_count: r.permissions.length
    }));
  }

  getRoleById(id: string): Role | undefined {
    return this.roles.find(r => r.id === id);
  }

  createRole(actor: { id: string; name: string }, data: { name: string; description: string; permissions: string[] }): Role {
    if (!data.name || !data.name.trim()) {
      throw new Error('Role name is required');
    }
    const existing = this.roles.find(r => r.name.toLowerCase() === data.name.trim().toLowerCase());
    if (existing) {
      throw new Error(`A role named "${data.name}" already exists`);
    }

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      is_system_role: false,
      created_at: new Date().toISOString(),
      permissions: Array.isArray(data.permissions) ? data.permissions : []
    };

    this.roles.push(newRole);
    this.logAudit(actor.id, actor.name, 'CREATE_ROLE', 'role', newRole.id, null, newRole);
    return newRole;
  }

  updateRole(
    actor: { id: string; name: string },
    id: string,
    data: { name?: string; description?: string; permissions?: string[] }
  ): Role {
    const role = this.roles.find(r => r.id === id);
    if (!role) {
      throw new Error('Role not found');
    }

    const beforeState = JSON.parse(JSON.stringify(role));

    // SYSTEM ROLE PROTECTION: Reject requests that would remove all permissions from system role
    if (role.is_system_role) {
      if (data.permissions && data.permissions.length === 0) {
        throw new Error('Security policy violation: Cannot remove all permissions from system role (Admin)');
      }
    }

    if (data.name !== undefined) {
      if (role.is_system_role && data.name.trim().toLowerCase() !== 'admin') {
        throw new Error('Cannot rename system Admin role');
      }
      role.name = data.name.trim();
    }

    if (data.description !== undefined) {
      role.description = data.description.trim();
    }

    if (data.permissions !== undefined) {
      role.permissions = Array.isArray(data.permissions) ? data.permissions : [];
    }

    this.logAudit(actor.id, actor.name, 'UPDATE_ROLE', 'role', role.id, beforeState, role);
    return role;
  }

  deleteRole(actor: { id: string; name: string }, id: string): boolean {
    const role = this.roles.find(r => r.id === id);
    if (!role) {
      throw new Error('Role not found');
    }

    // SYSTEM ROLE PROTECTION: Reject any request that would delete this role at API layer
    if (role.is_system_role) {
      throw new Error('Security policy violation: The system Admin role cannot be deleted');
    }

    // ACTIVE USERS PROTECTION: Reject if active users are still assigned
    const assignedUsers = this.users.filter(u => u.role_id === id);
    if (assignedUsers.length > 0) {
      throw new Error(`Cannot delete role "${role.name}" while ${assignedUsers.length} user(s) are still assigned to it`);
    }

    const beforeState = JSON.parse(JSON.stringify(role));
    this.roles = this.roles.filter(r => r.id !== id);
    this.logAudit(actor.id, actor.name, 'DELETE_ROLE', 'role', id, beforeState, null);
    return true;
  }

  // Users
  getUsers(): (User & { role: Role })[] {
    return this.users.map(u => ({
      ...u,
      role: this.roles.find(r => r.id === u.role_id) || this.roles[0]
    }));
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByIdentifier(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^\d+]/g, '');
    return this.users.find(u => 
      u.email.toLowerCase() === clean || 
      u.phone.replace(/[^\d+]/g, '') === cleanPhone
    );
  }

  createUser(actor: { id: string; name: string }, data: Partial<User> & { name: string; email: string; role_id: string }): User {
    if (!data.name?.trim() || !data.email?.trim()) {
      throw new Error('Name and email are required');
    }
    const existing = this.users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      throw new Error(`User with email "${data.email}" already exists`);
    }

    const role = this.getRoleById(data.role_id);
    if (!role) {
      throw new Error('Specified role does not exist');
    }

    const envAdminPassword = process.env.ADMIN_PASSWORD;
    const adminPassword = (envAdminPassword && envAdminPassword !== 'replace-with-a-strong-password') 
      ? envAdminPassword 
      : 'Admin12345';
    const defaultPassword = data.role_id === SYSTEM_ROLE_ADMIN_ID ? adminPassword : 'Moshi123!';

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || '+255 700 000 000',
      password_hash: data.password_hash || hashPassword(defaultPassword),
      role_id: data.role_id,
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      last_login_at: null,
      failed_login_attempts: 0,
      locked_until: null,
      position: data.position || `${role.name} Staff`,
      department: data.department || 'Operations',
      avatar: data.avatar || `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`
    };

    this.users.push(newUser);
    this.logAudit(actor.id, actor.name, 'CREATE_USER', 'user', newUser.id, null, {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: role.name
    });
    return newUser;
  }

  updateUser(actor: { id: string; name: string }, id: string, data: Partial<User>): User {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }

    const beforeState = JSON.parse(JSON.stringify(user));

    // If changing role, check role exists
    if (data.role_id && data.role_id !== user.role_id) {
      const role = this.getRoleById(data.role_id);
      if (!role) {
        throw new Error('Specified role does not exist');
      }
      user.role_id = data.role_id;
      this.logAudit(actor.id, actor.name, 'ASSIGN_ROLE', 'user', user.id, { role_id: beforeState.role_id }, { role_id: role.id, role_name: role.name });
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.email !== undefined) user.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.position !== undefined) user.position = data.position.trim();
    if (data.department !== undefined) user.department = data.department.trim();
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.status !== undefined) {
      user.status = data.status;
      this.logAudit(actor.id, actor.name, data.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER', 'user', user.id, beforeState.status, data.status);
    }
    if (data.password_hash !== undefined) user.password_hash = data.password_hash;

    this.logAudit(actor.id, actor.name, 'UPDATE_USER', 'user', user.id, beforeState, user);
    return user;
  }

  assignRoleToUser(actor: { id: string; name: string }, userId: string, roleId: string): User {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    const role = this.roles.find(r => r.id === roleId);
    if (!role) throw new Error('Role not found');

    const beforeRole = this.roles.find(r => r.id === user.role_id);
    const beforeState = { role_id: user.role_id, role_name: beforeRole?.name || 'Unknown' };

    user.role_id = roleId;
    const afterState = { role_id: role.id, role_name: role.name };

    this.logAudit(actor.id, actor.name, 'ASSIGN_ROLE', 'user', user.id, beforeState, afterState);
    return user;
  }

  // Authentication & Rate Limiting
  authenticateWithPassword(identifier: string, plainTextPassword: string): { user: User; role: Role; permissions: string[] } {
    const user = this.getUserByIdentifier(identifier);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Check account lock status
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until).getTime();
      const now = Date.now();
      if (now < lockExpiry) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / 60000);
        throw new Error(`Account is locked due to 5 failed attempts. Please try again in ${remainingMinutes} minute(s) or use OTP login.`);
      } else {
        // Lock has elapsed, reset counter
        user.locked_until = null;
        user.failed_login_attempts = 0;
      }
    }

    if (user.status === 'suspended') {
      throw new Error('This account has been suspended. Please contact your General Manager.');
    }

    const isValid = verifyPassword(plainTextPassword, user.password_hash);
    if (!isValid) {
      user.failed_login_attempts += 1;
      const attemptsLeft = FAILED_ATTEMPT_LOCK_LIMIT - user.failed_login_attempts;

      this.logAudit(user.id, user.name, 'FAILED_LOGIN', 'auth', user.id, null, {
        failed_attempts: user.failed_login_attempts,
        attempts_remaining: Math.max(0, attemptsLeft)
      });

      if (user.failed_login_attempts >= FAILED_ATTEMPT_LOCK_LIMIT) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
        user.locked_until = lockUntil;
        this.logAudit(user.id, user.name, 'ACCOUNT_LOCKED', 'auth', user.id, null, {
          locked_until: lockUntil,
          duration_minutes: 15
        });
        throw new Error('Account locked for 15 minutes due to 5 failed attempts. Use "Forgot password / use OTP instead" to log in immediately.');
      }

      throw new Error(`Incorrect password. ${attemptsLeft} attempt(s) remaining before a 15-minute lock.`);
    }

    // Login successful: reset failed attempts
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date().toISOString();

    const role = this.getRoleById(user.role_id) || this.roles[0];
    this.logAudit(user.id, user.name, 'LOGIN', 'auth', user.id, null, {
      method: 'password',
      role: role.name
    });

    return {
      user,
      role,
      permissions: role.permissions
    };
  }

  // OTP Management
  async requestOtp(identifier: string): Promise<{
    success: boolean;
    message: string;
    deliveryMethod: 'email' | 'whatsapp' | 'sms';
    whatsappUrl?: string;
    previewCode?: string;
    resendsRemaining: number;
    cooldownSeconds: number;
  }> {
    const user = this.getUserByIdentifier(identifier);
    if (!user) {
      throw new Error('No user account found matching this email or phone number.');
    }

    if (user.status === 'suspended') {
      throw new Error('Account is suspended. Please contact your General Manager.');
    }

    const now = Date.now();
    const cleanId = user.email.toLowerCase();
    const existingOtp = this.otps.get(cleanId);

    // Rate Limiting: 60s cooldown & max 3 resends per 15 minutes
    if (existingOtp) {
      // Check 15-minute window
      if (now - existingOtp.window_start < OTP_WINDOW_MS) {
        if (existingOtp.resends_count >= OTP_MAX_RESENDS) {
          const remainingMinutes = Math.ceil((OTP_WINDOW_MS - (now - existingOtp.window_start)) / 60000);
          throw new Error(`Maximum resend limit reached (3 per 15 minutes). Please wait ${remainingMinutes} minute(s) before requesting another code.`);
        }
        // Check 60-second cooldown
        const timeSinceLast = now - (existingOtp.expires_at - OTP_EXPIRY_MS);
        if (timeSinceLast < OTP_RESEND_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
          throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
        }
      }
    }

    const otpCode = generateOtp();
    const resendsCount = existingOtp && (now - existingOtp.window_start < OTP_WINDOW_MS)
      ? existingOtp.resends_count + 1
      : 1;
    const windowStart = existingOtp && (now - existingOtp.window_start < OTP_WINDOW_MS)
      ? existingOtp.window_start
      : now;

    this.otps.set(cleanId, {
      identifier: cleanId,
      code: otpCode,
      expires_at: now + OTP_EXPIRY_MS,
      used: false,
      resends_count: resendsCount,
      window_start: windowStart
    });

    const isEmail = identifier.includes('@');
    let whatsappUrl: string | undefined;
    let message = '';

    if (isEmail) {
      await sendEmailOtp(user.email, otpCode);
      message = `Security verification code sent to ${user.email}.`;
    } else {
      whatsappUrl = getWhatsAppUrl(user.phone, otpCode);
      message = `Security verification code generated for ${user.phone}.`;
    }

    this.logAudit(user.id, user.name, 'OTP_REQUESTED', 'auth', user.id, null, {
      identifier,
      deliveryMethod: isEmail ? 'email' : 'whatsapp',
      resendsCount
    });

    return {
      success: true,
      message,
      deliveryMethod: isEmail ? 'email' : 'whatsapp',
      whatsappUrl,
      previewCode: process.env.NODE_ENV === 'production' ? undefined : otpCode,
      resendsRemaining: OTP_MAX_RESENDS - resendsCount,
      cooldownSeconds: 60
    };
  }

  verifyOtp(identifier: string, code: string): { user: User; role: Role; permissions: string[] } {
    const user = this.getUserByIdentifier(identifier);
    if (!user) {
      throw new Error('No user account found matching this identifier.');
    }

    const cleanId = user.email.toLowerCase();
    const otpRecord = this.otps.get(cleanId);

    if (!otpRecord) {
      throw new Error('No OTP requested for this account. Please request a new code.');
    }

    if (otpRecord.used) {
      throw new Error('This verification code has already been used. Please request a new one.');
    }

    if (Date.now() > otpRecord.expires_at) {
      throw new Error('Verification code has expired. Codes are valid for 10 minutes.');
    }

    if (otpRecord.code !== code.trim()) {
      throw new Error('Invalid 6-digit verification code. Please check and try again.');
    }

    // Mark as used
    otpRecord.used = true;

    // Reset account locks if any
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date().toISOString();

    const role = this.getRoleById(user.role_id) || this.roles[0];
    this.logAudit(user.id, user.name, 'OTP_LOGIN', 'auth', user.id, null, {
      method: 'otp',
      role: role.name
    });

    return {
      user,
      role,
      permissions: role.permissions
    };
  }

  revokeToken(token: string) {
    this.revokedTokens.add(token);
  }

  isTokenRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }
}

export const userStore = new UserStore();
