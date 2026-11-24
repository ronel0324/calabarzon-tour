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

export async function fetchDestinationMedia(destinationId) {
  const { data, error } = await supabase
    .from('destination_media')
    .select(`${FIELDS}, profiles(username)`)
    .eq('destination_id', destinationId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}


export async function fetchUserMedia(userId) {
  const { data, error } = await supabase
    .from('destination_media')
    .select(`${FIELDS}, destination_id, destinations(name), profiles(username)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function uploadMedia({ asset, destinationId, userId }) {
  const mime = asset.mimeType || '';
  const isVideo = asset.type === 'video' || mime.startsWith('video/');
  const contentType = mime || (isVideo ? 'video/mp4' : 'image/jpeg');
  const ext = (contentType.split('/')[1] || (isVideo ? 'mp4' : 'jpg'))
    .replace('jpeg', 'jpg')
    .replace('quicktime', 'mov');

  let buffer;
  if (Platform.OS === 'web') {
    const res = await fetch(asset.uri);
    buffer = await res.arrayBuffer();
  } else {
    const b64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: 'base64',
    });
    buffer = decode(b64);
  }
  console.log('upload bytes:', buffer.byteLength, contentType);

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
      storage_path: path,
    })
    .select(FIELDS)
    .single();

  if (error) {
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
  const { data: removed, error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove([item.storage_path]);
  console.log('remove file:', removed?.length ?? 0, 'removed', removeError?.message || '');
}