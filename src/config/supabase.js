import { createClient } from '@supabase/supabase-js';

// REPLACE WITH YOUR SUPABASE CREDENTIALS
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
