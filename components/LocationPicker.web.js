import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import MapWebView from './MapWebView';

const ORIGIN_WHITELIST = ['*'];

const buildHtml = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

    function report(ll) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'pick', latitude: ll.lat, longitude: ll.lng })
      );
    }
    map.on('click', function (e) { marker.setLatLng(e.latlng); report(e.latlng); });
    marker.on('dragend', function () { report(marker.getLatLng()); });

    window.setPin = function (lat, lng) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], map.getZoom());
    };
  </script>
</body>
</html>
`;

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [latText, setLatText] = useState(String(latitude));
  const [lngText, setLngText] = useState(String(longitude));
  const webViewRef = React.useRef(null);

  // Isang beses lang gagawin para hindi nagre-reload ang mapa
  const source = useMemo(() => ({ html: buildHtml(latitude, longitude) }), []);

  // Kapag napindot ang mapa, i-update ang mga input
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pick') {
        const lat = Number(data.latitude.toFixed(6));
        const lng = Number(data.longitude.toFixed(6));
        setLatText(String(lat));
        setLngText(String(lng));
        onChange({ latitude: lat, longitude: lng });
      }
    } catch (e) {
      console.error('LocationPicker error:', e);
    }
  };

  // Kapag nag-type sa input, ilipat ang pin sa mapa
  const movePin = (lat, lng) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setPin(${lat}, ${lng}); true;`);
    }
  };

  const handleLat = (text) => {
    setLatText(text);
    const n = parseFloat(text);
    if (!isNaN(n) && n >= -90 && n <= 90) {
      onChange({ latitude: n, longitude });
      movePin(n, longitude);
    }
  };

  const handleLng = (text) => {
    setLngText(text);
    const n = parseFloat(text);
    if (!isNaN(n) && n >= -180 && n <= 180) {
      onChange({ latitude, longitude: n });
      movePin(latitude, n);
    }
  };

  return (
    <View>
      <Text style={styles.label}>Location *</Text>
      <Text style={styles.helperText}>
        Tap the map or drag the pin to set the location. You can also type the coordinates below.
      </Text>

      <View style={styles.mapBox}>
        <MapWebView
          ref={webViewRef}
          style={{ flex: 1 }}
          originWhitelist={ORIGIN_WHITELIST}
          source={source}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>

      <Text style={styles.subLabel}>Latitude</Text>
      <TextInput
        style={styles.input}
        value={latText}
        onChangeText={handleLat}
        placeholder="14.1008"
        keyboardType="numeric"
      />

      <Text style={styles.subLabel}>Longitude</Text>
      <TextInput
        style={styles.input}
        value={lngText}
        onChangeText={handleLng}
        placeholder="121.0794"
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
  subLabel: { fontSize: 14, color: '#333', marginTop: 8, marginBottom: 4 },
  helperText: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
  mapBox: {
    height: 280,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  }
});