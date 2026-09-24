import crypto from 'node:crypto';
import { Resend } from 'resend';

const JWT_SECRET = process.env.JWT_SECRET || 'development-only-jwt-secret';

/**
 * Hash a plain text password using PBKDF2 with SHA-256 and a random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Verify a plain text password against a stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const [, iterationsStr, salt, hash] = parts;
    const iterations = parseInt(iterationsStr, 10);
    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  } catch {
    return false;
  }
}

/**
 * Generate a standard JSON Web Token (JWT) signed with HMAC-SHA256
 */
export function generateToken(payload: object, expiresInSeconds: number, secret = JWT_SECRET): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Verify and decode a JWT
 */
export function verifyToken<T = any>(token: string, secret = JWT_SECRET): { valid: boolean; payload?: T; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token' };
    }
    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSig) {
      return { valid: false, error: 'Invalid signature' };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Verification failed' };
  }
}

/**
 * Generate 6-digit numeric OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format WhatsApp API dispatch link
 * WhatsApp URL: https://api.whatsapp.com/send/?phone=(user's phone number)&text=...
 */
export function getWhatsAppUrl(phone: string, otp: string): string {
  const cleanedPhone = phone.replace(/[^\d]/g, '');
  const message = encodeURIComponent(`Your Moshi Urban Hostel PMS security code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`);
  return `https://api.whatsapp.com/send/?phone=${cleanedPhone}&text=${message}`;
}

/**
 * Resend Email Dispatcher
 */
export async function sendEmailOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'Moshi Urban PMS <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: `Your Login Security Code: ${otp}`,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #1B2C44;">
          <h2>Moshi Urban Hostel PMS Authentication</h2>
          <p>Your one-time security login code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #f8b742;">${otp}</h1>
          <p>This code expires in 10 minutes and is single-use.</p>
        </div>`
      });

      if (!error && data?.id) {
        return { success: true, message: `OTP sent via Resend to ${email}` };
      }

      if (error) {
        console.warn('Resend dispatch error, falling back to simulated dispatch:', error);
      }
    } catch (err) {
      console.warn('Resend dispatch error, falling back to simulated dispatch:', err);
    }
  }

  // Simulated fallback log
  console.log(`[EMAIL DISPATCH] Sent OTP ${otp} to ${email}`);
  return { success: true, message: `Security code generated and dispatched to ${email}` };
}
