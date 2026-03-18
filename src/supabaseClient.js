import { createClient } from '@supabase/supabase-js';

// These values are loaded from .env.local (never committed to git).
// See .env for the required variable names.
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Single shared Supabase client instance used across the entire app.
// The anon key is the public client-side key — it is safe to use in the browser.
// Row Level Security on each table controls what data each user can access.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
