import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    // Warn but don't crash, let the caller handle errors if keys are missing
    console.warn('Supabase URL or Service Role Key is missing.');
}

// Create a Supabase client with the Service Role Key
// This client has admin privileges and bypasses Row Level Security (RLS).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
