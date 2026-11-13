import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

const BUCKET = 'media';

export const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const FIELDS = 'id, user_id, media_type, url, storage_path, created_at';

// Lahat ng media ng isang destination (galing sa lahat ng user)
export async function fetchDestinationMedia(destinationId) {
  const { data, error } = await supabase
    .from('destination_media')
    .select(FIELDS)
    .eq('destination_id', destinationId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

// Media ng user mismo (para sa Profile), kasama ang pangalan ng destination
export async function fetchUserMedia(userId) {
  const { data, error } = await supabase
    .from('destination_media')
    .select(`${FIELDS}, destination_id, destinations(name)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function uploadMedia({ asset, destinationId, userId }) {
  const isVideo = asset.type === 'video';
  const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

  const ext = isVideo ? 'mp4' : 'jpg';

  const b64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: 'base64'
  });
  const buffer = decode(b64);
  console.log('FS upload bytes:', buffer.byteLength, asset.type);

  // userId muna sa path para tugma sa storage policy
  const path = `${userId}/${destinationId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from('destination_media')
    .insert({
      destination_id: destinationId,
      user_id: userId,
      media_type: isVideo ? 'video' : 'photo',
      url: pub.publicUrl,
      storage_path: path
    })
    .select(FIELDS)
    .single();

  if (error) {
    // Burahin ang file kung hindi na-save ang record
    supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data;
}

export async function deleteMedia(item) {
  const { data, error } = await supabase
    .from('destination_media')
    .delete()
    .eq('id', item.id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Nothing was deleted. You can only delete your own media.');
  }
  // Hindi mahalaga kung mabigo ang pagbura ng file
  const { data: removed, error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove([item.storage_path]);
  console.log('remove file:', removed?.length ?? 0, 'removed', removeError?.message || '');
}