import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If we are missing environment variables, we provide a placeholder or skip initialization 
// to avoid crashing the build process.
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (!supabase) {
    console.warn("Supabase environment variables are missing. Initialization skipped.");
}
