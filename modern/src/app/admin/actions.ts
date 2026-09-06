'use server';

import { getSession } from '@/lib/session';
import { db } from '@/db';
import { users, recoveryCodes, authChallenges } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import * as OTPAuth from 'otpauth';
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
    // Simple rate limiting: wait 1 minute
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
  const hashedOtp = hashValue(otpCode);
  const challengeId = crypto.randomUUID();
  
  await db.insert(authChallenges).values({
    id: challengeId,
    userId: user.id,
    otpHash: hashedOtp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0,
    consumed: false,
    createdAt: new Date()
  });

  session.email = email;
  session.challengeId = challengeId;
  session.emailVerified = false; // Reset verification state
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
  if (!session.challengeId || !session.email) {
    return { error: 'Session expired' };
  }

  const challenge = await db.select().from(authChallenges).where(eq(authChallenges.id, session.challengeId)).get();
  
  if (!challenge) return { error: 'Challenge not found' };
  if (challenge.consumed) return { error: 'OTP already used' };
  if (Date.now() > challenge.expiresAt.getTime()) return { error: 'OTP expired' };
  if (challenge.attempts >= 5) return { error: 'Too many attempts' };

  await db.update(authChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(authChallenges.id, challenge.id));

  const hashedInput = hashValue(code);
  if (challenge.otpHash !== hashedInput) {
    return { error: 'Invalid OTP' };
  }

  // Atomically consume
  await db.update(authChallenges).set({ consumed: true }).where(eq(authChallenges.id, challenge.id));

  const user = await db.select().from(users).where(eq(users.email, session.email)).get();
  if (!user) return { error: 'User not found' };

  session.challengeId = undefined;
  session.emailVerified = true;
  await session.save();

  const needsTotpSetup = !user.totpSecret;
  return { success: true, needsTotpSetup, email: session.email };
}

export async function setupTotp() {
  const session = await getSession();
  if (!session.emailVerified || !session.email) return { error: 'Email not verified' };
  
  const user = await db.select().from(users).where(eq(users.email, session.email)).get();
  if (!user || user.totpSecret) return { error: 'TOTP already setup or invalid user' };

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'Goa Garden Resort Admin',
    label: session.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const recoveryCodesPlain = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
  
  await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, user.id));

  const codesToInsert = recoveryCodesPlain.map(code => ({
    id: crypto.randomUUID(),
    userId: user.id!,
    codeHash: hashValue(code),
    used: false,
    createdAt: new Date(),
  }));

  await db.insert(recoveryCodes).values(codesToInsert);
  
  return { 
    success: true, 
    secret: secret.base32, 
    uri: totp.toString(),
    recoveryCodes: recoveryCodesPlain
  };
}

export async function verifyTotp(token: string, newSecret?: string) {
  const session = await getSession();
  if (!session.emailVerified || !session.email) return { error: 'Email not verified' };
  
  const user = await db.select().from(users).where(eq(users.email, session.email)).get();
  if (!user) return { error: 'User not found' };

  const secretToVerify = newSecret || user.totpSecret;
  if (!secretToVerify) return { error: 'TOTP not setup' };

  const totp = new OTPAuth.TOTP({
    issuer: 'Goa Garden Resort Admin',
    label: session.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretToVerify),
  });

  const delta = totp.validate({ token, window: 1 });
  if (delta === null) return { error: 'Invalid TOTP code' };

  if (newSecret && !user.totpSecret) {
    await db.update(users).set({ totpSecret: newSecret }).where(eq(users.id, user.id));
  }

  session.isLoggedIn = true;
  session.userId = user.id;
  session.role = user.role;
  await session.save();

  return { success: true };
}

export async function verifyRecoveryCode(code: string) {
  const session = await getSession();
  if (!session.emailVerified || !session.email) return { error: 'Email not verified' };
  
  const user = await db.select().from(users).where(eq(users.email, session.email)).get();
  if (!user) return { error: 'User not found' };

  const codeHash = hashValue(code);
  const matchedCode = await db.select().from(recoveryCodes)
    .where(and(eq(recoveryCodes.userId, user.id), eq(recoveryCodes.codeHash, codeHash), eq(recoveryCodes.used, false)))
    .get();

  if (!matchedCode) {
    return { error: 'Invalid or already used recovery code' };
  }

  // Atomically mark as used
  await db.update(recoveryCodes).set({ 
    used: true, 
    usedAt: new Date() 
  }).where(eq(recoveryCodes.id, matchedCode.id));

  // Complete recovery: invalidate TOTP secret
  await db.update(users).set({ totpSecret: null }).where(eq(users.id, user.id));

  return { success: true };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/admin/login');
}
