import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    });
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      async accessToken() {
        try {
          return (await auth()).getToken();
        } catch (error) {
          console.error('Failed to get auth token:', error);
          return null;
        }
      },
    }
  );
};

// Anonymous client for public, cacheable reads. It carries no Clerk token, so
// it can run inside `unstable_cache` (which cannot read request headers).
export const createAnonSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};
