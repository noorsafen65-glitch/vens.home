import { createClient } from '@supabase/supabase-js';

// هەڵگرتنی کلیلەکان لە بیرگە یان لە ژینگە
const defaultUrl = localStorage.getItem('vh_sql_url') || import.meta.env.VITE_SUPABASE_URL || '';
const defaultKey = localStorage.getItem('vh_sql_key') || import.meta.env.VITE_SUPABASE_KEY || '';

export let supabase = (defaultUrl && defaultKey) ? createClient(defaultUrl, defaultKey) : null;

export const initSupabase = (url, key) => {
  if (url && key) {
    localStorage.setItem('vh_sql_url', url);
    localStorage.setItem('vh_sql_key', key);
    supabase = createClient(url, key);
    return supabase;
  }
  return null;
};
