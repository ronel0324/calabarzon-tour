import { Platform } from 'react-native';

// Palette: hango sa Taal Lake (teal), sa araw ng watawat (ginto), at sa kulay ng Pahiyas
export const COLORS = {
  taal: '#0E3B43', // malalim na teal, pangunahing kulay at header
  taalSoft: '#1D5963',
  tealTint: '#E2ECEE', // mapusyaw na teal para sa napiling item
  paper: '#F5F6F1', // background ng mga screen
  white: '#FFFFFF',
  gold: '#D9A441',
  goldDeep: '#A87A1C',
  vermilion: '#B8372F', // delete / error
  vermilionTint: '#FBE9E7',
  leaf: '#3F7D4E', // success / completed
  leafTint: '#E3EEE5',
  ink: '#1D2A2E', // pangunahing teksto
  muted: '#5C6A6D', // pangalawang teksto
  neutral: '#6B787B', // cancel / close buttons
  line: '#E1E3DA' // borders
};

// Serif para sa mga pamagat (heritage na dating)
export const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif'
});

// Karaniwang card: puti, manipis na border, walang mabigat na anino
export const card = {
  backgroundColor: COLORS.white,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.line
};
