
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://othnutqiwvakkbhzbira.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90aG51dHFpd3Zha2tiaHpiaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTY4NTgsImV4cCI6MjA4NjA5Mjg1OH0.sz0J37UW9PtcGl6Z0wtqxB8UuBZ9D1xLOOStRzN4ZB8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
