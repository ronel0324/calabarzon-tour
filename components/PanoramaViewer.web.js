import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { buildPanoramaHtml } from '../utils/panoramaHtml';

// Web version: iframe imbes na WebView (hindi suportado ang react-native-webview sa web).
// Awtomatikong pinipili ng Expo/Metro ang .web.js kapag nasa browser.
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
  const iframeRef = useRef(null);

  const html = useMemo(
    () => buildPanoramaHtml({ panoramaImage, hotspots, initialRotation }),
    [panoramaImage, hotspots, initialRotation]
  );

  const pushState = useCallback(() => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    if (!win) return;
    const payload = JSON.stringify({
      spots: infoHotspots.map((h) => ({ id: h.id, yaw: h.yaw, pitch: h.pitch })),
      editMode,
      draft,
    });
    win.postMessage(JSON.stringify({ __panoState: payload }), '*');
  }, [infoHotspots, editMode, draft]);

  useEffect(() => {
    pushState();
  }, [pushState]);

  useEffect(() => {
    const handler = (event) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.type === 'hotspot' && onHotspotPress) {
          onHotspotPress(hotspots[msg.index]);
        } else if (msg.type === 'info' && onInfoHotspotPress) {
          const found = infoHotspots.find((h) => String(h.id) === String(msg.id));
          if (found) onInfoHotspotPress(found);
        } else if (msg.type === 'place' && onPlaceHotspot) {
          onPlaceHotspot({ yaw: msg.yaw, pitch: msg.pitch });
        }
      } catch (e) {
        // hindi sa atin ang message
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [hotspots, infoHotspots, onHotspotPress, onInfoHotspotPress, onPlaceHotspot]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {React.createElement('iframe', {
        ref: iframeRef,
        key: panoramaImage,
        srcDoc: html,
        onLoad: pushState,
        title: 'Panorama',
        style: { border: 0, width: '100%', height: '100%', backgroundColor: '#000' },
      })}
    </View>
  );
};

export default PanoramaViewer;
