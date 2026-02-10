
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzbqcysyzybifzzxruvz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6YnFjeXN5enliaWZ6enhydXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU0MTMsImV4cCI6MjA4NjM0MTQxM30.gsXBO5hDPzSWbVVqPQXnHzex_u4xrtcXeJo59nHhHnI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
