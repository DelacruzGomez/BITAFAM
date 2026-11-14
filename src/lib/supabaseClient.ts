import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqajnbdbmijchnkcrggf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxYWpuYmRibWlqY2hua2NyZ2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2ODgxNTAsImV4cCI6MjExMDI2NDE1MH0.2MHEHpypKJlvnXoUDQK19B2c0tdBJ132kULIVLs68S8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
