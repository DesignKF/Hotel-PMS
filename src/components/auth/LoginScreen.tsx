import React, { useState, useEffect } from 'react';
import { MoshiUrbanLogo } from '../MoshiUrbanLogo';
import { 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldAlert,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { authApi } from '../../services/authApi';
import { AuthSession } from '../../types/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../services/firebase';

interface LoginScreenProps {
  onSuccess: (session: AuthSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  // Mode: 'password' or 'otp_request' or 'otp_verify'
  const [mode, setMode] = useState<'password' | 'otp_request' | 'otp_verify'>('password');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Validation & errors
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState<number | null>(null);

  // Loading & OTP state
  const [loading, setLoading] = useState(false);
  const [otpMeta, setOtpMeta] = useState<{
    deliveryMethod: 'email' | 'whatsapp' | 'sms';
    whatsappUrl?: string;
    previewCode?: string;
    resendsRemaining: number;
    cooldownSeconds: number;
  } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Detect input type: email vs phone
  const detectedType = React.useMemo(() => {
    const trimmed = identifier.trim();
    if (!trimmed) return 'none';
    if (trimmed.includes('@')) return 'email';
    if (/^[+0-9\s-()]+$/.test(trimmed) && trimmed.length >= 4) return 'phone';
    return 'invalid';
  }, [identifier]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Lock countdown timer
  useEffect(() => {
    if (!lockCountdown || lockCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockCountdown(prev => {
        if (!prev || prev <= 1) {
          setIsLocked(false);
          setGeneralError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown]);

  // Validation function
  const validateInputs = (): boolean => {
    let valid = true;
    setIdentifierError(null);
    setPasswordError(null);
    setGeneralError(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Email address or phone number is required.');
      valid = false;
    } else if (detectedType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        setIdentifierError('Please enter a valid email address (e.g., staff@moshiurban.co.tz).');
        valid = false;
      }
    } else if (detectedType === 'phone') {
      const cleanDigits = trimmed.replace(/\D/g, '');
      if (cleanDigits.length < 8 || cleanDigits.length > 15) {
        setIdentifierError('Please enter a valid phone number with country code (e.g., +255 715 000 000).');
        valid = false;
      }
    } else {
      setIdentifierError('Format not recognized. Enter a valid email or phone number.');
      valid = false;
    }

    if (mode === 'password') {
      if (!password) {
        setPasswordError('Password is required.');
        valid = false;
      } else if (password.length < 4) {
        setPasswordError('Password must be at least 4 characters.');
        valid = false;
      }
    }

    return valid;
  };

  // Handle Password Login Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!validateInputs()) return;

    setLoading(true);
    setGeneralError(null);

    try {
      const session = await authApi.login(identifier.trim(), password);
      onSuccess(session);
    } catch (err: any) {
      const msg: string = err.message || 'Login failed';
      setGeneralError(msg);

      if (msg.toLowerCase().includes('locked')) {
        setIsLocked(true);
        setLockCountdown(15 * 60); // 15 minutes in seconds
      } else if (msg.toLowerCase().includes('attempt(s) remaining')) {
        setPasswordError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIdentifierError(null);
    setGeneralError(null);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Please enter your email or phone number to receive an OTP.');
      return;
    }

    setLoading(true);
    try {
      const meta = await authApi.requestOtp(trimmed);
      setOtpMeta(meta);
      setResendCooldown(meta.cooldownSeconds || 60);
      setMode('otp_verify');
      setOtpCode('');
    } catch (err: any) {
      setGeneralError(err.message || 'Unable to request OTP. Please check the identifier.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP Submit
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setGeneralError('Please enter the full 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    setGeneralError(null);

    try {
      const session = await authApi.verifyOtp(identifier.trim(), otpCode.trim());
      onSuccess(session);
    } catch (err: any) {
      setGeneralError(err.message || 'Verification failed. Code may have expired.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Credentials Quick Filler
  const fillDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setIdentifierError(null);
    setPasswordError(null);
    setGeneralError(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const emailLower = user.email?.toLowerCase() || '';
      const isAdminUser = emailLower === 'wolfgodie@gmail.com' || emailLower === 'gdnjau@gmail.com' || emailLower.includes('admin');
      const roleName = isAdminUser ? 'Admin' : 'Reservation Manager';
      const token = await user.getIdToken();

      const session: AuthSession = {
        user: {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Staff User',
          email: user.email || 'staff@moshiurban.co.tz',
          phone: user.phoneNumber || '+255 700 000 000',
          password_hash: '',
          role_id: isAdminUser ? 'role-admin' : 'role-manager',
          status: 'active',
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: null,
          avatar: user.photoURL || undefined,
          position: isAdminUser ? 'System Administrator & Director' : 'Staff Manager',
          department: 'Management'
        },
        role: {
          id: isAdminUser ? 'role-admin' : 'role-manager',
          name: roleName,
          description: 'Google Authenticated Staff User',
          is_system_role: isAdminUser,
          created_at: new Date().toISOString(),
          permissions: ['manage_roles', 'view_roles', 'manage_users', 'view_users', 'view_audit_log', 'view_bookings', 'create_bookings', 'manage_bookings', 'manage_rates', 'view_reports', 'manage_system']
        },
        permissions: ['manage_roles', 'view_roles', 'manage_users', 'view_users', 'view_audit_log', 'view_bookings', 'create_bookings', 'manage_bookings', 'manage_rates', 'view_reports', 'manage_system'],
        tokens: {
          accessToken: token,
          refreshToken: user.refreshToken,
          expiresIn: 3600
        }
      };

      authApi.saveSession(session);
      onSuccess(session);
    } catch (err: any) {
      console.warn('Google Sign-in status:', err);
      setGeneralError(err.message || 'Google Sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[var(--primary-gold)] selection:text-[var(--primary-gold-text)]">
      
      {/* Background Decorative Mountain Silhouette Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[var(--primary-gold)]/10 via-[var(--primary-navy)]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Main Card Container */}
        <div className="bg-surface-1 border border-strong rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-md transition-all duration-300">
          
          {/* Logo Centered Above Form */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="mb-3 transform hover:scale-105 transition-transform duration-200">
              <MoshiUrbanLogo type="full" className="h-14 sm:h-16 w-auto" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-subtle text-[11px] font-bold text-secondary uppercase tracking-widest">
              <KeyRound className="w-3 h-3 text-[var(--primary-gold)]" />
              <span>PMS Staff Portal</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-primary font-serif tracking-tight">
              {mode === 'password' ? 'Staff Authentication' : mode === 'otp_request' ? 'Passwordless OTP Sign-In' : 'Enter Verification Code'}
            </h1>
            <p className="text-xs text-secondary mt-1">
              {mode === 'password' 
                ? 'Sign in to access reservations, room management, and hostel operations.'
                : mode === 'otp_request'
                  ? 'We will send a 6-digit one-time code to your email or WhatsApp.'
                  : `Enter the code sent to ${identifier}`
              }
            </p>
          </div>

          {/* Rate-Limit Account Lock Warning Banner */}
          {isLocked && (
            <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs space-y-1.5 animate-in shake duration-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Account Locked (5 Failed Attempts)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                For security reasons, this account is temporarily locked for 15 minutes.
              </p>
              {lockCountdown && (
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Unlocks in: {Math.floor(lockCountdown / 60)}m {lockCountdown % 60}s
                  </span>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('otp_request');
                    setGeneralError(null);
                  }}
                  className="btn-primary !h-8 !text-xs !bg-[var(--primary-gold)] !text-[var(--primary-gold-text)] w-full font-bold"
                >
                  Bypass with OTP Verification Instead
                </button>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && !isLocked && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{generalError}</div>
            </div>
          )}

          {/* ================= MODE 1: PASSWORD LOGIN ================= */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Email or Phone Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-primary">
                    Email or Phone Number
                  </label>
                  {/* Format Detection Badge */}
                  {detectedType === 'email' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                      <Mail className="w-3 h-3" /> Email Detected
                    </span>
                  )}
                  {detectedType === 'phone' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                      <Phone className="w-3 h-3" /> Phone Detected
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tertiary">
                    {detectedType === 'phone' ? (
                      <Phone className="w-4 h-4 text-[var(--primary-gold)]" />
                    ) : (
                      <Mail className="w-4 h-4 text-tertiary" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value);
                      if (identifierError) setIdentifierError(null);
                    }}
                    placeholder="email@moshiurban.co.tz or +255..."
                    disabled={loading || isLocked}
                    className={`input-field !pl-10 text-xs w-full ${
                      identifierError ? '!border-red-500 !ring-red-500/20' : ''
                    }`}
                    autoComplete="username"
                  />
                </div>
                {identifierError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1 animate-in fade-in">
                    {identifierError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-primary">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('otp_request');
                      setGeneralError(null);
                    }}
                    className="text-[11px] text-[var(--primary-gold)] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password / use OTP instead
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tertiary">
                    <Lock className="w-4 h-4 text-tertiary" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="••••••••••••"
                    disabled={loading || isLocked}
                    className={`input-field !pl-10 !pr-10 text-xs w-full ${
                      passwordError ? '!border-red-500 !ring-red-500/20' : ''
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-tertiary hover:text-primary transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1 animate-in fade-in">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="btn-primary w-full !h-11 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to PMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Divider & Google Sign-In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-subtle" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-surface-1 px-2 text-tertiary font-bold tracking-wider">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || isLocked}
                className="w-full h-11 border border-strong rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors flex items-center justify-center gap-3 text-xs font-semibold text-primary cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign In with Google</span>
              </button>
            </form>
          )}

          {/* ================= MODE 2: REQUEST OTP ================= */}
          {mode === 'otp_request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-primary">
                    Email Address or Mobile Phone
                  </label>
                  {detectedType === 'email' && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      Via Email
                    </span>
                  )}
                  {detectedType === 'phone' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Via WhatsApp / SMS
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tertiary">
                    {detectedType === 'phone' ? <Phone className="w-4 h-4 text-[var(--primary-gold)]" /> : <Mail className="w-4 h-4 text-tertiary" />}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value);
                      if (identifierError) setIdentifierError(null);
                    }}
                    placeholder="Enter registered email or phone"
                    disabled={loading}
                    className={`input-field !pl-10 text-xs w-full ${
                      identifierError ? '!border-red-500' : ''
                    }`}
                  />
                </div>
                {identifierError && (
                  <p className="text-[11px] text-red-500 font-medium pl-1">
                    {identifierError}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full !h-11 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {loading ? (
                    <span>Dispatching OTP...</span>
                  ) : (
                    <>
                      <span>Send 6-Digit Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('password');
                    setGeneralError(null);
                  }}
                  className="btn-secondary w-full !h-9 text-xs font-semibold cursor-pointer"
                >
                  Back to Password Login
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE 3: ENTER OTP ================= */}
          {mode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              
              {/* Delivery notification card */}
              <div className="p-3.5 rounded-2xl bg-surface-2 border border-subtle text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <CheckCircle2 className="w-4 h-4 text-[var(--status-success-text)]" />
                  <span>Security Code Dispatched</span>
                </div>
                <p className="text-[11px] text-secondary">
                  A 6-digit single-use code valid for 10 minutes was sent to <strong className="text-primary">{identifier}</strong>.
                </p>

                {/* WhatsApp Direct Link if phone format */}
                {otpMeta?.whatsappUrl && (
                  <div className="pt-1">
                    <a
                      href={otpMeta.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                    >
                      <span>Open WhatsApp Web Message</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Evaluator Convenience Banner */}
                {otpMeta?.previewCode && (
                  <div className="mt-2 p-2 rounded-xl bg-[var(--primary-gold)]/15 border border-[var(--primary-gold)]/30 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[var(--primary-gold)]" />
                      <span>Demo OTP Code:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(otpMeta.previewCode!)}
                      className="font-mono font-black text-sm px-2 py-0.5 rounded bg-[var(--primary-gold)] text-[var(--primary-gold-text)] hover:opacity-90 transition-opacity cursor-pointer"
                      title="Click to auto-fill code"
                    >
                      {otpMeta.previewCode} (Auto Fill)
                    </button>
                  </div>
                )}
              </div>

              {/* 6-Digit Code Input */}
              <div className="space-y-1">
                <label className="font-bold text-xs text-primary block text-center">
                  Enter 6-Digit Numeric Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                      if (generalError) setGeneralError(null);
                    }}
                    placeholder="000000"
                    autoFocus
                    className="input-field text-center font-mono font-black text-2xl tracking-[0.4em] !h-13 w-60"
                  />
                </div>
              </div>

              {/* Resend Action with 60s cooldown */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-tertiary text-[11px]">
                  Resends remaining: <strong>{otpMeta ? otpMeta.resendsRemaining : 3}/3</strong>
                </span>

                {resendCooldown > 0 ? (
                  <span className="text-secondary text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-tertiary" />
                    <span>Resend in {resendCooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={loading || Boolean(otpMeta && otpMeta.resendsRemaining <= 0)}
                    className="text-[var(--primary-gold)] hover:underline font-bold text-[11px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Submit & Back buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="btn-primary w-full !h-11 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <span>Verify &amp; Enter PMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('password');
                    setGeneralError(null);
                  }}
                  className="btn-secondary w-full !h-9 text-xs font-semibold cursor-pointer"
                >
                  Cancel &amp; Use Password
                </button>
              </div>
            </form>
          )}

          {/* Quick demo credentials are available only on the local development server. */}
          {import.meta.env.DEV && (
          <div className="mt-6 pt-5 border-t border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-tertiary">
                Test Accounts (One-Click Fill)
              </span>
              <span className="text-[10px] text-tertiary">Admin: Admin12345 | Staff: Moshi123!</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemo('admin@moshiurban.co.tz', 'Admin12345')}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-subtle text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-primary truncate">General Manager</div>
                <div className="text-[10px] text-[var(--primary-gold)] font-medium">Admin (System Role)</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('manager@moshiurban.co.tz', 'Moshi123!')}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-subtle text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-primary truncate">Amina Kimaro</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Reservation Manager</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('frontdesk@moshiurban.co.tz', 'Moshi123!')}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-subtle text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-primary truncate">Kelvin Mushi</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Front Desk</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('sales@moshiurban.co.tz', 'Moshi123!')}
                className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-subtle text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-primary truncate">Sarah Ndossi</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Sales Agent</div>
              </button>
            </div>
          </div>
          )}

        </div>

        {/* Footer Security Badge */}
        <div className="mt-4 text-center text-[11px] text-tertiary flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
          <span>Moshi Urban PMS · Protected by JWT, Rate-Limiting &amp; 15-Minute Failed Lockout</span>
        </div>

      </div>
    </div>
  );
};
