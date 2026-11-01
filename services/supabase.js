import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Kunin sa Supabase > Project Settings > API
const SUPABASE_URL = 'https://pzzfmkzxqxhzmztmjkcw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ep9hqWZtMsb5I-psj7cITw_90UXPi2P';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export const IMAGE_BUCKET = 'destination-images';
