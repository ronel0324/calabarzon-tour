import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildPanoramaHtml } from '../utils/panoramaHtml';

// Phone (Android / iOS) version. Ang web ay gumagamit ng PanoramaViewer.web.js
const PanoramaViewer = ({
  panoramaImage,
  onHotspotPress,
  hotspots = [],
  initialRotation = 0,
  infoHotspots = [],
  editMode = false,
  draft = null,
  onInfoHotspotPress,
  onPlaceHotspot,
}) => {
  const webRef = useRef(null);

  // Walang infoHotspots/editMode dito para hindi mag-reload ang WebView.
  const html = useMemo(
    () => buildPanoramaHtml({ panoramaImage, hotspots, initialRotation }),
    [panoramaImage, hotspots, initialRotation]
  );

  const pushState = useCallback(() => {
    if (!webRef.current) return;
    const payload = JSON.stringify({
      spots: infoHotspots.map((h) => ({ id: h.id, yaw: h.yaw, pitch: h.pitch })),
      editMode,
      draft,
    });
    webRef.current.injectJavaScript(
      `window.applyState && window.applyState(${JSON.stringify(payload)}); true;`
    );
  }, [infoHotspots, editMode, draft]);

  useEffect(() => {
    pushState();
  }, [pushState]);

  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'hotspot' && onHotspotPress) {
        onHotspotPress(hotspots[msg.index]);
      } else if (msg.type === 'info' && onInfoHotspotPress) {
        const found = infoHotspots.find((h) => String(h.id) === String(msg.id));
        if (found) onInfoHotspotPress(found);
      } else if (msg.type === 'place' && onPlaceHotspot) {
        onPlaceHotspot({ yaw: msg.yaw, pitch: msg.pitch });
      }
    } catch (e) {
      console.warn('Panorama message error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        key={panoramaImage}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        onLoadEnd={pushState}
        javaScriptEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        bounces={false}
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
});

export default PanoramaViewer;