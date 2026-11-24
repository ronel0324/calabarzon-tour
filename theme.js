import { Platform } from 'react-native';

export const COLORS = {
  taal: '#0E3B43',
  taalSoft: '#1D5963',
  tealTint: '#E2ECEE',
  paper: '#F5F6F1',
  white: '#FFFFFF',
  gold: '#D9A441',
  goldDeep: '#A87A1C',
  vermilion: '#B8372F',
  vermilionTint: '#FBE9E7',
  leaf: '#3F7D4E',
  leafTint: '#E3EEE5',
  ink: '#1D2A2E',
  muted: '#5C6A6D',
  neutral: '#6B787B',
  line: '#E1E3DA'
};

export const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif'
});

export const card = {
  backgroundColor: COLORS.white,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.line
};
