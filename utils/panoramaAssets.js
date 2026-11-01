import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// Dapat static string ang path sa require() (rule ng Metro)
const LOCAL = {
  RIZALSHRINE: require('../assets/panoramas/RIZALSHRINE.jpg'),
  MALAGONLONG: require('../assets/panoramas/MALAGONLONG.jpg'),
  TAAL: require('../assets/panoramas/TAAL.jpg'),
  MAKILINGPK2: require('../assets/panoramas/MAKILINGPK2.jpg'),
  PAGSANJANFALLS: require('../assets/panoramas/PAGSANJANFALLS.jpg'),
};

export async function resolvePanorama(value) {
  if (!value) return null;
  if (/^(https?:|data:)/.test(value)) return value; // URL na, ibalik lang

  // Galing sa user upload (file path)
  if (value.startsWith('file://')) {
    const b64 = await FileSystem.readAsStringAsync(value, { encoding: 'base64' });
    return `data:image/jpeg;base64,${b64}`;
  }

  const mod = LOCAL[value];
  if (!mod) return null;

  const asset = Asset.fromModule(mod);

  // BAGO: sa web, walang file system. Ang asset ay may sarili nang URL.
  if (Platform.OS === 'web') {
    return asset.uri;
  }

  await asset.downloadAsync();
  const b64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: 'base64',
  });
  return `data:image/jpeg;base64,${b64}`;
}