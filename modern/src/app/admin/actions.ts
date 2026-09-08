'use server';

import { getSession } from '@/lib/session';
import { db } from '@/db';
import { users, authChallenges } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const ALLOWED_EMAILS = ['goagardenresort@gmail.com', 'premsaldana0@gmail.com'];

function hashValue(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

function getMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !MAIL_FROM) {
    throw new Error('SMTP environment variables are missing');
  }
  return {
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    }),
    from: MAIL_FROM,
  };
}

export async function sendOtp(email: string) {
  if (!ALLOWED_EMAILS.includes(email)) {
    return { error: 'Unauthorized email' };
  }

  const session = await getSession();
  if (session.challengeId) {
    const existing = await db.select().from(authChallenges).where(eq(authChallenges.id, session.challengeId)).get();
    if (existing && Date.now() < existing.createdAt.getTime() + 60 * 1000) {
      return { error: 'Please wait before requesting another code' };
    }
  }

  const { transporter, from } = getMailer();
  let user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    user = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      role: 'owner_admin',
      createdAt: new Date(),
    }).returning().get();
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const challengeId = crypto.randomUUID();
  await db.insert(authChallenges).values({
    id: challengeId,
    userId: user.id,
    otpHash: hashValue(otpCode),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    consumed: false,
    createdAt: new Date(),
  });

  session.email = email;
  session.challengeId = challengeId;
  session.emailVerified = false;
  session.isLoggedIn = false;
  session.userId = undefined;
  session.role = undefined;
  await session.save();

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Goa Garden Resort Admin - Login Code',
    text: `Your admin login code is: ${otpCode}. It expires in 10 minutes.`,
  });

  return { success: true };
}

export async function verifyOtp(code: string) {
  const session = await getSession();
  if (!session.challengeId || !session.email) return { error: 'Session expired' };

  const challenge = await db.select().from(authChallenges).where(eq(authChallenges.id, session.challengeId)).get();
  if (!challenge) return { error: 'Challenge not found' };
  if (challenge.consumed) return { error: 'OTP already used' };
  if (Date.now() > challenge.expiresAt.getTime()) return { error: 'OTP expired' };
  if (challenge.attempts >= 5) return { error: 'Too many attempts' };

  await db.update(authChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(authChallenges.id, challenge.id));
  if (challenge.otpHash !== hashValue(code)) return { error: 'Invalid OTP' };

  await db.update(authChallenges).set({ consumed: true }).where(eq(authChallenges.id, challenge.id));
  const user = await db.select().from(users).where(eq(users.email, session.email)).get();
  if (!user) return { error: 'User not found' };

  session.challengeId = undefined;
  session.emailVerified = true;
  session.isLoggedIn = true;
  session.userId = user.id;
  session.role = user.role;
  await session.save();

  return { success: true, email: session.email };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/admin/login');
}
