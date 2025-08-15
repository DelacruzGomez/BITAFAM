import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alqzzwzgzvvugtdjlqym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscXp6d3pnenZ2dWd0ZGpscXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTE2MDQsImV4cCI6MjA2OTQ4NzYwNH0.XvGTgLEtGS9fJRsm14oC26vdz3ktIJvzx0JHWHlY9UM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
