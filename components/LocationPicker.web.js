import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

// Bersyon para sa web: walang mapa, latitude/longitude input lang
// (hindi gumagana ang react-native-maps sa web)
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [latText, setLatText] = useState(String(latitude));
  const [lngText, setLngText] = useState(String(longitude));

  const handleLat = (text) => {
    setLatText(text);
    const n = parseFloat(text);
    if (!isNaN(n) && n >= -90 && n <= 90) {
      onChange({ latitude: n, longitude });
    }
  };

  const handleLng = (text) => {
    setLngText(text);
    const n = parseFloat(text);
    if (!isNaN(n) && n >= -180 && n <= 180) {
      onChange({ latitude, longitude: n });
    }
  };

  return (
    <View>
      <Text style={styles.label}>Location *</Text>
      <Text style={styles.helperText}>
        On the web, type the coordinates. On Google Maps, right-click the location and click "What's here?" to get the coordinates.
      </Text>

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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  subLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
});
