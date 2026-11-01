import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';

const GoogleMapsIntegration = ({ latitude, longitude, placeName }) => {
  
  // Open Google Maps app or web
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open Google Maps');
      console.error('Error opening maps:', err);
    });
  };

  // Open Google Street View
  const openStreetView = () => {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open Street View');
      console.error('Error opening street view:', err);
    });
  };

  // Get directions to location
  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open directions');
      console.error('Error opening directions:', err);
    });
  };

  // View photos on Google Maps
  const viewPhotos = () => {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(placeName)}/@${latitude},${longitude},15z`;
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open photos');
      console.error('Error opening photos:', err);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Google Maps Features</Text>
      <Text style={styles.subtitle}>Explore this location on Google Maps</Text>

      <View style={styles.buttonsContainer}>
        {/* Street View 360° */}
        <TouchableOpacity style={[styles.button, styles.streetViewButton]} onPress={openStreetView}>
          <Text style={styles.buttonIcon}>🌐</Text>
          <Text style={styles.buttonText}>Street View 360°</Text>
          <Text style={styles.buttonSubtext}>Panoramic view</Text>
        </TouchableOpacity>

        {/* Photos */}
        <TouchableOpacity style={[styles.button, styles.photosButton]} onPress={viewPhotos}>
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.buttonText}>View Photos</Text>
          <Text style={styles.buttonSubtext}>Google images</Text>
        </TouchableOpacity>

        {/* Directions */}
        <TouchableOpacity style={[styles.button, styles.directionsButton]} onPress={getDirections}>
          <Text style={styles.buttonIcon}>🧭</Text>
          <Text style={styles.buttonText}>Get Directions</Text>
          <Text style={styles.buttonSubtext}>Navigate here</Text>
        </TouchableOpacity>

        {/* Open in Maps */}
        <TouchableOpacity style={[styles.button, styles.mapsButton]} onPress={openGoogleMaps}>
          <Text style={styles.buttonIcon}>📍</Text>
          <Text style={styles.buttonText}>Open in Maps</Text>
          <Text style={styles.buttonSubtext}>View on map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 These links open Google Maps with official data, Street View panoramas, and user photos
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15
  },
  button: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  streetViewButton: {
    borderWidth: 2,
    borderColor: '#4285F4'
  },
  photosButton: {
    borderWidth: 2,
    borderColor: '#EA4335'
  },
  directionsButton: {
    borderWidth: 2,
    borderColor: '#34A853'
  },
  mapsButton: {
    borderWidth: 2,
    borderColor: '#FBBC04'
  },
  buttonIcon: {
    fontSize: 28,
    marginBottom: 5
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  buttonSubtext: {
    fontSize: 11,
    color: '#666'
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3'
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18
  }
});

export default GoogleMapsIntegration;
