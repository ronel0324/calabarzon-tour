import { useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

const SPLASH = require('../assets/splash.jpg');
const BG = '#0f4a28'; // dark green sa pinakailalim ng image
const DEFAULT_RATIO = 9 / 16; // gagamitin kung hindi makuha ang tunay na sukat

// Gumagana sa phone; sa web kulang ang resolveAssetSource kaya may fallback
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

  // Kapag nag-load ang image, kunin ang tunay na sukat (lalo na sa web)
  const handleLoad = (e) => {
    const s = e?.nativeEvent?.source;
    if (s && s.width && s.height) setRatio(s.width / s.height);
  };

  const imgWidth = Math.min(width, height * ratio);
  const imgHeight = imgWidth / ratio;

  return (
    <View style={styles.container}>
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
    justifyContent: 'flex-start',
  },
});