import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kyroklmrnhfbewinwwwr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cm9rbG1ybmhmYmV3aW53d3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTY4NDIsImV4cCI6MjA5MjM3Mjg0Mn0.MmyeS0h-epbGEWgB-heZUiyxpRbWwlgGI2fZ42a_rXU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
