import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Bersyon para sa phone (Android/iOS): totoong mapa
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [showMap, setShowMap] = useState(false);

  const handleMapPress = (event) => {
    const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
    onChange({
      latitude: parseFloat(lat.toFixed(7)),
      longitude: parseFloat(lng.toFixed(7))
    });
  };

  return (
    <View>
      <Text style={styles.label}>Location on Map *</Text>
      <Text style={styles.helperText}>Tap on the map to set the location pin</Text>

      <TouchableOpacity
        style={styles.mapToggleButton}
        onPress={() => setShowMap(!showMap)}
      >
        <Text style={styles.mapToggleButtonText}>
          {showMap ? '▼ Hide Map' : '▶ Show Map'}
        </Text>
      </TouchableOpacity>

      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.miniMap}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5
            }}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              draggable
              onDragEnd={handleMapPress}
            >
              <View style={styles.customMarker}>
                <Text style={styles.markerText}>📍</Text>
              </View>
            </Marker>
          </MapView>

          <View style={styles.coordinatesDisplay}>
            <Text style={styles.coordinatesText}>
              📍 Latitude: {latitude.toFixed(7)}
            </Text>
            <Text style={styles.coordinatesText}>
              📍 Longitude: {longitude.toFixed(7)}
            </Text>
          </View>
        </View>
      )}
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
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  mapToggleButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  mapToggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  miniMap: {
    width: '100%',
    height: 300,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 24,
  },
  coordinatesDisplay: {
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    padding: 12,
  },
  coordinatesText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
});
