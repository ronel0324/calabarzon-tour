import { useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

const SPLASH = require('../assets/splash.jpg');
const BG = '#0f4a28';
const DEFAULT_RATIO = 9 / 16;

const getInitialRatio = () => {
  try {
    if (typeof Image.resolveAssetSource === 'function') {
      const src = Image.resolveAssetSource(SPLASH);
      if (src && src.width && src.height) return src.width / src.height;
    }
  } catch (e) {
    // ignore, gamitin ang default
  }
  return DEFAULT_RATIO;
};

const INITIAL_RATIO = getInitialRatio();

export default function AppSplash() {
  const { width, height } = useWindowDimensions();
  const [ratio, setRatio] = useState(INITIAL_RATIO);

  const handleLoad = (e) => {
    const s = e?.nativeEvent?.source;
    if (s && s.width && s.height) setRatio(s.width / s.height);
  };

  // Buo ang poster: kasya sa lapad AT taas ng screen
  const imgWidth = Math.min(width, height * ratio);
  const imgHeight = imgWidth / ratio;

  return (
    <View style={styles.container}>
      {/* Backdrop: puno ang screen, malabo, may green tint */}
      <Image
        source={SPLASH}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={20}
      />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />

      {/* Ang tunay na poster, buo at nasa gitna */}
      <Image
        source={SPLASH}
        style={{ width: imgWidth, height: imgHeight }}
        resizeMode="contain"
        onLoad={handleLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tint: { backgroundColor: 'rgba(15, 74, 40, 0.6)' }
});