import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';

// Web: iframe na ginagaya ang WebView (injectJavaScript, onMessage, source.html)

// Sa loob ng iframe, ang window.ReactNativeWebView.postMessage ay ipinapasa sa parent page
const SHIM =
  '<script>window.ReactNativeWebView={postMessage:function(m){window.parent.postMessage({__rnwv:true,data:m},"*");}};</script>';

const MapWebView = forwardRef(({ source, onMessage, style }, ref) => {
  const iframeRef = useRef(null);
  const rawHtml = source && source.html ? source.html : '';

  const html = useMemo(() => {
    return rawHtml.includes('<head>')
      ? rawHtml.replace('<head>', '<head>' + SHIM)
      : SHIM + rawHtml;
  }, [rawHtml]);

  // Ito ang ginagamit ng webViewRef.current.injectJavaScript(...)
  useImperativeHandle(ref, () => ({
    injectJavaScript: (js) => {
      try {
        const w = iframeRef.current && iframeRef.current.contentWindow;
        if (w) w.eval(js);
      } catch (error) {
        console.error('injectJavaScript error:', error);
      }
    },
  }));

  // Tanggapin ang mga mensahe galing sa iframe
  useEffect(() => {
    const handler = (event) => {
      const frameWindow = iframeRef.current && iframeRef.current.contentWindow;
      if (!frameWindow || event.source !== frameWindow) return;
      if (!event.data || !event.data.__rnwv) return;
      if (onMessage) onMessage({ nativeEvent: { data: event.data.data } });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  return (
    <View style={style}>
      {React.createElement('iframe', {
        ref: iframeRef,
        srcDoc: html,
        title: 'map',
        style: {
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        },
      })}
    </View>
  );
});

export default MapWebView;
