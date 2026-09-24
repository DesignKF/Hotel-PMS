import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { userStore } from './userStore.ts';
import { generateToken, verifyToken } from './security.ts';
import type { User, Role } from '../types/auth.ts';

export const apiRouter = Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok' });
});

const secureCookie = process.env.NODE_ENV === 'production' ? '; Secure' : '';

// Middleware to parse auth bearer token or cookie
export interface AuthenticatedRequest extends Request {
  user?: User;
  role?: Role;
  permissions?: string[];
  token?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    // Check for access_token cookie
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'moshi_access_token') {
        token = decodeURIComponent(v);
        break;
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required to access this resource',
      code: 401
    });
  }

  if (userStore.isTokenRevoked(token)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token has been revoked upon logout',
      code: 401
    });
  }

  const result = verifyToken<{ userId: string }>(token);
  if (!result.valid || !result.payload?.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: result.error || 'Invalid or expired session token',
      code: 401
    });
  }

  const user = userStore.getUserById(result.payload.userId);
  if (!user || user.status === 'suspended') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Account not found or suspended',
      code: 401
    });
  }

  const role = userStore.getRoleById(user.role_id) || userStore.getRoles()[0];
  req.user = user;
  req.role = role;
  req.permissions = role.permissions;
  req.token = token;
  next();
}

/**
 * Permission guard middleware: Checks if caller has a specific permission
 */
export function requirePermission(permissionKey: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.permissions || !req.permissions.includes(permissionKey)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Security enforcement: You lack the required "${permissionKey}" permission to perform this action.`,
        required_permission: permissionKey,
        code: 403
      });
    }
    next();
  };
}

// ==================== AUTH ROUTES ====================

// POST /api/auth/login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Validation Error', message: 'Identifier and password are required' });
    }

    const { user, role, permissions } = userStore.authenticateWithPassword(identifier, password);

    // Short-lived access token (15 mins = 900s)
    const accessToken = generateToken({ userId: user.id, email: user.email, role: role.name }, 900);
    // Longer-lived refresh token (7 days = 604800s)
    const refreshToken = generateToken({ userId: user.id, type: 'refresh' }, 604800);

    // Set secure httpOnly cookie
    res.setHeader('Set-Cookie', [
      `moshi_access_token=${accessToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900${secureCookie}`,
      `moshi_refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secureCookie}`
    ]);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: role.name,
        role_id: role.id,
        status: user.status,
        avatar: user.avatar,
        position: user.position,
        department: user.department
      },
      role,
      permissions,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900
      }
    });
  } catch (err: any) {
    const isLocked = err.message && err.message.toLowerCase().includes('locked');
    const statusCode = isLocked ? 429 : 401;
    return res.status(statusCode).json({
      error: isLocked ? 'Account Locked' : 'Authentication Failed',
      message: err.message || 'Invalid credentials',
      code: statusCode
    });
  }
});

// POST /api/auth/otp/request
apiRouter.post('/auth/otp/request', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email or phone number is required' });
    }

    const result = await userStore.requestOtp(identifier.trim());
    return res.status(200).json(result);
  } catch (err: any) {
    const isRateLimit = err.message && (err.message.includes('cooldown') || err.message.includes('limit reached') || err.message.includes('wait'));
    const statusCode = isRateLimit ? 429 : 400;
    return res.status(statusCode).json({
      error: isRateLimit ? 'Rate Limit Exceeded' : 'OTP Request Failed',
      message: err.message,
      code: statusCode
    });
  }
});

// POST /api/auth/otp/verify
apiRouter.post('/auth/otp/verify', (req: Request, res: Response) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Validation Error', message: 'Identifier and 6-digit code are required' });
    }

    const { user, role, permissions } = userStore.verifyOtp(identifier, code);

    const accessToken = generateToken({ userId: user.id, email: user.email, role: role.name }, 900);
    const refreshToken = generateToken({ userId: user.id, type: 'refresh' }, 604800);

    res.setHeader('Set-Cookie', [
      `moshi_access_token=${accessToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900${secureCookie}`,
      `moshi_refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secureCookie}`
    ]);

    return res.status(200).json({
      success: true,
      message: `OTP verified successfully. Welcome, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: role.name,
        role_id: role.id,
        status: user.status,
        avatar: user.avatar,
        position: user.position,
        department: user.department
      },
      role,
      permissions,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900
      }
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'OTP Verification Failed',
      message: err.message || 'Invalid or expired code',
      code: 400
    });
  }
});

// GET /api/auth/me
apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    user: req.user,
    role: req.role,
    permissions: req.permissions
  });
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    userStore.revokeToken(req.token);
  }
  if (req.user) {
    userStore.logAudit(req.user.id, req.user.name, 'LOGOUT', 'auth', req.user.id, null, { method: 'explicit_logout' });
  }

  res.setHeader('Set-Cookie', [
    `moshi_access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookie}`,
    `moshi_refresh_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookie}`
  ]);

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ==================== ROLES & PERMISSIONS ====================

// GET /api/permissions
apiRouter.get('/permissions', (req: Request, res: Response) => {
  return res.status(200).json({
    permissions: userStore.getPermissions()
  });
});

// GET /api/roles
apiRouter.get('/roles', authMiddleware, requirePermission('view_roles'), (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    roles: userStore.getRoles()
  });
});

// POST /api/roles
apiRouter.post('/roles', authMiddleware, requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const actor = { id: req.user!.id, name: req.user!.name };
    const role = userStore.createRole(actor, { name, description, permissions });
    return res.status(201).json({
      success: true,
      message: `Role "${role.name}" created successfully.`,
      role
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'Role Creation Failed', message: err.message, code: 400 });
  }
});

// PUT /api/roles/:id
apiRouter.put('/roles/:id', authMiddleware, requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const actor = { id: req.user!.id, name: req.user!.name };
    const role = userStore.updateRole(actor, req.params.id, { name, description, permissions });
    return res.status(200).json({
      success: true,
      message: `Role "${role.name}" updated successfully.`,
      role
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'Role Update Failed', message: err.message, code: 400 });
  }
});

// DELETE /api/roles/:id
apiRouter.delete('/roles/:id', authMiddleware, requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = { id: req.user!.id, name: req.user!.name };
    userStore.deleteRole(actor, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully.'
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'Role Deletion Blocked', message: err.message, code: 400 });
  }
});

// ==================== USERS & ROLE ASSIGNMENT ====================

// GET /api/users
apiRouter.get('/users', authMiddleware, requirePermission('view_users'), (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    users: userStore.getUsers()
  });
});

// POST /api/users
apiRouter.post('/users', authMiddleware, requirePermission('manage_users'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = { id: req.user!.id, name: req.user!.name };
    const user = userStore.createUser(actor, req.body);
    return res.status(201).json({
      success: true,
      message: `Staff account for "${user.name}" created.`,
      user
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'User Creation Failed', message: err.message, code: 400 });
  }
});

// PUT /api/users/:id/role
apiRouter.put('/users/:id/role', authMiddleware, requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role_id } = req.body;
    if (!role_id) {
      return res.status(400).json({ error: 'Validation Error', message: 'role_id is required' });
    }
    const actor = { id: req.user!.id, name: req.user!.name };
    const user = userStore.assignRoleToUser(actor, req.params.id, role_id);
    return res.status(200).json({
      success: true,
      message: `Role assigned successfully to ${user.name}.`,
      user
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'Role Assignment Failed', message: err.message, code: 400 });
  }
});

// PUT /api/users/:id
apiRouter.put('/users/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSelf = req.user!.id === req.params.id;
    const hasManageUsers = req.permissions?.includes('manage_users');

    if (!isSelf && !hasManageUsers) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only edit your own profile unless you have manage_users permission.',
        code: 403
      });
    }

    const actor = { id: req.user!.id, name: req.user!.name };
    const user = userStore.updateUser(actor, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: `User details updated for ${user.name}.`,
      user
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'User Update Failed', message: err.message, code: 400 });
  }
});

// ==================== AUDIT LOGS ====================

// GET /api/audit-logs
apiRouter.get('/audit-logs', authMiddleware, requirePermission('view_audit_log'), (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    logs: userStore.getAuditLogs()
  });
});
