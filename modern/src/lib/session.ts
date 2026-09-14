import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type SessionData = {
  isLoggedIn: boolean;
  email?: string;
  role?: string;
  userId?: string;
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignored since middleware handles refreshing
          }
        },
      },
    }
  );
}

export async function getSession(): Promise<SessionData> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { isLoggedIn: false };
  }

  // Fetch the user from the local DB to get the correct foreign key ID
  const { db } = await import('@/db');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  
  const localUser = await db.select().from(users).where(eq(users.email, session.user.email!)).limit(1).then(res => res[0]);

  return {
    isLoggedIn: true,
    email: session.user.email,
    userId: localUser ? localUser.id : session.user.id,
    role: 'owner_admin'
  };
}

export async function requireAdmin() {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}
