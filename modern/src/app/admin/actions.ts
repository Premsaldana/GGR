'use server';

import { createClient } from '@/lib/session';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function getAdminSupabase() {
  const cookieStore = cookies();
  // We use the service_role key to bypass RLS when checking allowed_admins during login
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      }
    }
  );
}

export async function sendOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const adminSupabase = getAdminSupabase();
    const { data: allowedAdmin, error: allowedError } = await adminSupabase
      .from('allowed_admins')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    if (allowedError || !allowedAdmin) {
      return { error: 'Unauthorized email' };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      }
    });

    if (error) {
      console.error('Supabase OTP send failed:', error);
      return { error: 'Could not send verification code.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Admin OTP request failed:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function verifyOtp(code: string, email?: string) {
  if (!email) return { error: 'Email is required' };
  
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: 'email',
    });

    if (error) {
      console.error('Supabase OTP verify failed:', error);
      return { error: 'Invalid or expired code' };
    }

    if (data.user?.email) {
      const { db } = await import('@/db');
      const { users } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const existingUser = await db.select().from(users).where(eq(users.email, data.user.email)).limit(1).then(res => res[0]);
      if (!existingUser) {
        await db.insert(users).values({
          id: data.user.id,
          email: data.user.email,
          role: 'owner_admin',
          createdAt: new Date(),
        });
      }
    }

    return { success: true, email: data.user?.email };
  } catch (error) {
    console.error('Admin OTP verification failed:', error);
    return { error: 'We could not verify the code. Please try again.' };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
