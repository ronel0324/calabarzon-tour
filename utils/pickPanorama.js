import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Gumagana ang Alert.alert sa phone lang; sa web gumamit ng window.alert
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export async function pickPanoramaImage() {
  // Sa web, hindi kailangan ng permission
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow photo access to choose a 360° image.');
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false, // huwag i-crop, masisira ang 2:1
    quality: 0.7
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const ratio = asset.width / asset.height;
  if (ratio < 1.9 || ratio > 2.1) {
    notify(
      'Not a 360° image',
      'Ang 360° photo ay dapat 2:1 ang ratio (halimbawa 4096×2048). Gumamit ng 360 camera o Google Street View / Photo Sphere app.'
    );
    return null;
  }

  // FIX: Tinanggal ang expo-file-system (hindi gumagana sa web).
  // Ang pagkopya sa permanenteng folder ay hindi na kailangan dahil
  // ina-upload na ang larawan sa Supabase Storage ng addPanoramaPoint (database.js).
  return asset.uri;
}