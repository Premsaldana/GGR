import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = {
  isLoggedIn: boolean;
  email?: string;
  emailVerified?: boolean; // Indicates if email was successfully verified via OTP
  challengeId?: string;    // Opaque identifier for OTP challenge
  role?: string;
  userId?: string;
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET environment variable is missing or too short (min 32 characters)');
}

export const sessionOptions = {
  password: sessionSecret,
  cookieName: 'ggr_admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getSession() {
  return await getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (session.role !== 'owner_admin') {
    throw new Error('FORBIDDEN');
  }

  if (!session.emailVerified) {
    throw new Error('MFA_REQUIRED');
  }

  const ALLOWED_EMAILS = ['goagardenresort@gmail.com', 'premsaldana0@gmail.com'];
  if (!session.email || !ALLOWED_EMAILS.includes(session.email)) {
    throw new Error('FORBIDDEN_EMAIL');
  }
  
  if (!session.userId) {
    throw new Error('UNAUTHORIZED_USER_ID');
  }

  return session;
}
