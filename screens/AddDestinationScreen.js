import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickPanoramaImage } from '../utils/pickPanorama';
import { addDestination, addPanoramaPoint } from '../services/database';
import LocationPicker from '../components/LocationPicker';
import styles from '../styles/formStyles';

const CATEGORIES = [
  'Natural Wonder',
  'Historical Site',
  'Cultural Heritage',
  'Waterfall',
  'Beach',
  'Mountain',
  'Museum',
  'Other'
];

// FIX: Hindi gumagana ang Alert.alert sa web (walang lumalabas at hindi tumatakbo ang onPress).
// Kaya gumamit ng window.alert sa web at normal na Alert sa phone.
const notify = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

export default function AddDestinationScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    categories: ['Natural Wonder'],
    image: '',
    historical_info: '',
    cultural_significance: '',
    latitude: 14.1008, // Default to CALABARZON center
    longitude: 121.0794
  });
  const [panoramaUri, setPanoramaUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category) => {
    setFormData(prev => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category]
      };
    });
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    setFormData(prev => ({ ...prev, latitude, longitude }));
  };

  const pickImage = async () => {
    // Sa web, hindi kailangan ng permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        notify('Permission Denied', 'We need camera roll permissions to select images.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      handleInputChange('image', result.assets[0].uri);
    }
  };

  const handlePickPanorama = async () => {
    const uri = await pickPanoramaImage();
    if (uri) setPanoramaUri(uri);
  };

  const handleSubmit = async () => {
    if (saving) return;

    // Validation
    if (!formData.name.trim()) {
      notify('Validation Error', 'Please enter a destination name');
      return;
    }
    if (!formData.description.trim()) {
      notify('Validation Error', 'Please enter a description');
      return;
    }
    if (formData.categories.length === 0) {
      notify('Validation Error', 'Please select at least one category');
      return;
    }
    if (!formData.address.trim()) {
      notify('Validation Error', 'Please enter an address');
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      notify('Validation Error', 'Please set the location');
      return;
    }

    setSaving(true);
    try {
      // Ang larawan ay awtomatikong ina-upload sa Supabase Storage ng database.js
      const newId = await addDestination({
        ...formData,
        category: formData.categories.join(', ') // hal. "Cultural Heritage, Mountain"
      });

      if (panoramaUri) {
        await addPanoramaPoint({
          destination_id: newId,
          name: 'Main View',
          panorama_image: panoramaUri,
          rotation: 0,
          is_entry_point: true
        });
      }

      setSaving(false);
      notify('Success', 'Destination added successfully!', () => navigation.goBack());
    } catch (error) {
      setSaving(false);
      console.error('Error adding destination:', error);
      notify(
        'Error',
        `Failed to add destination.\n${error?.message || 'Please try again.'}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.label}>Destination Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />

            <Text style={styles.label}>Category * (multiple)</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((category) => {
                const selected = formData.categories.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selected && styles.categoryButtonActive
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selected && styles.categoryButtonTextActive
                      ]}
                    >
                      {selected ? '✓ ' : ''}{category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter address"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
            />

            {/* Mapa sa phone, lat/long input sa web */}
            <LocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={handleLocationChange}
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Historical Information</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter historical information (optional)"
              value={formData.historical_info}
              onChangeText={(text) => handleInputChange('historical_info', text)}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Cultural Significance</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter cultural significance (optional)"
              value={formData.cultural_significance}
              onChangeText={(text) => handleInputChange('cultural_significance', text)}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Image</Text>
            {formData.image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: formData.image }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                  <Text style={styles.changeImageButtonText}>Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Text style={styles.imagePickerButtonText}>📷 Select Image</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.helperText}>Or enter image URL:</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChangeText={(text) => handleInputChange('image', text)}
            />

            {/* ---- 360° SECTION ---- */}
            <Text style={styles.label}>360° Image (optional)</Text>
            <Text style={styles.helperText}>
              The ratio must be 2:1 (e.g., 4096×2048), coming from a 360 camera or Photo Sphere. The upload limit is up to 50 MB.
            </Text>
            <TouchableOpacity style={styles.panoramaButton} onPress={handlePickPanorama}>
              <Text style={styles.panoramaButtonText}>
                {panoramaUri ? '✅ 360° image selected (tap to change)' : '🌐 Select 360° Image'}
              </Text>
            </TouchableOpacity>
            {panoramaUri && (
              <TouchableOpacity onPress={() => setPanoramaUri(null)}>
                <Text style={styles.removePanoramaText}>Remove 360° image</Text>
              </TouchableOpacity>
            )}
            {/* ---- DULO NG 360° SECTION ---- */}

            <TouchableOpacity
              style={[styles.submitButton, saving && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>
                {saving ? 'Saving... (uploading images)' : 'Add Destination'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}