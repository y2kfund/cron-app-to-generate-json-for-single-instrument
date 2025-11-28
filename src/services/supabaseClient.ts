import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.SUPABASE_URL;
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);