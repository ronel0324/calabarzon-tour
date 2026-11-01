import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Kunin sa Supabase > Project Settings > API
const SUPABASE_URL = 'https://pzzfmkzxqxhzmztmjkcw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ep9hqWZtMsb5I-psj7cITw_90UXPi2P';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,      // para hindi ma-logout tuwing isasara ang app
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

export const IMAGE_BUCKET = 'destination-images';