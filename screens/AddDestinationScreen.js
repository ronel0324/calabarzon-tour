import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickPanoramaImage } from '../utils/pickPanorama';
import { getDestinationById, updateDestination, addPanoramaPoint } from '../services/database';
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

const DEFAULT_LAT = 14.1008; // CALABARZON center
const DEFAULT_LNG = 121.0794;

// Alert.alert ay hindi gumagana sa web, kaya window.alert doon
const notify = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

export default function EditDestinationScreen({ route, navigation }) {
  const { destinationId } = route.params;
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    categories: ['Natural Wonder'],
    image: '',
    historical_info: '',
    cultural_significance: '',
    latitude: null,
    longitude: null
  });
  const [panoramaUri, setPanoramaUri] = useState(null);

  useEffect(() => {
    loadDestination();
  }, [destinationId]);

  const loadDestination = async () => {
    try {
      const destination = await getDestinationById(destinationId);
      if (destination) {
        const cats = (destination.category || '')
          .split(',')
          .map(c => c.trim())
          .filter(Boolean);

        setFormData({
          name: destination.name || '',
          description: destination.description || '',
          address: destination.address || '',
          categories: cats.length > 0 ? cats : ['Natural Wonder'],
          image: destination.image || '',
          historical_info: destination.historical_info || '',
          cultural_significance: destination.cultural_significance || '',
          latitude: destination.latitude != null ? Number(destination.latitude) : null,
          longitude: destination.longitude != null ? Number(destination.longitude) : null
        });
      }
    } catch (error) {
      console.error('Error loading destination:', error);
      notify('Error', 'Failed to load destination');
    } finally {
      setLoaded(true);
    }
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    setFormData(prev => ({ ...prev, latitude, longitude }));
  };

  const ensureLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        notify('Permission Denied', 'We need camera roll permissions to select images.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    if (!(await ensureLibraryPermission())) return;

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

  // Kapareho ng Add screen: gamit ang pickPanoramaImage
  const handlePickPanorama = async () => {
    const uri = await pickPanoramaImage();
    if (uri) setPanoramaUri(uri);
  };

  const handleSubmit = async () => {
    if (saving) return;

    if (!formData.name.trim()) {
      notify('Validation Error', 'Please enter a destination name');
      return;
    }
    if (!formData.description.trim()) {
      notify('Validation Error', 'Please enter a description');
      return;
    }
    if (!formData.address.trim()) {
      notify('Validation Error', 'Please enter an address');
      return;
    }
    if (formData.categories.length === 0) {
      notify('Validation Error', 'Please select at least one category');
      return;
    }

    setSaving(true);
    try {
      // Kung bagong larawan galing sa picker, ina-upload ito ng database.js sa Supabase
      await updateDestination(destinationId, {
        ...formData,
        category: formData.categories.join(', ')
      });

      // Kapareho ng Add screen: ang 360 ay sine-save bilang panorama point
      if (panoramaUri) {
        await addPanoramaPoint({
          destination_id: destinationId,
          name: 'Main View',
          panorama_image: panoramaUri,
          rotation: 0,
          is_entry_point: true
        });
      }
      setSaving(false);
      notify('Success', 'Destination updated successfully!', () => navigation.goBack());
    } catch (error) {
      setSaving(false);
      console.error('Error updating destination:', error);
      notify(
        'Error',
        `Failed to update destination.\n${error?.message || 'Please try again.'}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.label}>Destination Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter destination name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />

          <Text style={styles.label}>Category * (pwede more than one)</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((category) => {
              const selected = formData.categories.includes(category);
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryButton, selected && styles.categoryButtonActive]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[styles.categoryButtonText, selected && styles.categoryButtonTextActive]}
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

          {/* Mapa sa phone, lat/long input sa web (kapareho ng Add screen) */}
          {loaded && (
            <LocationPicker
              latitude={formData.latitude ?? DEFAULT_LAT}
              longitude={formData.longitude ?? DEFAULT_LNG}
              onChange={handleLocationChange}
            />
          )}

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

          {/* ===== 360° Image ===== */}
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

          <TouchableOpacity
            style={[styles.submitButton, saving && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? 'Saving...' : 'Update Destination'}
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
    </SafeAreaView>
  );
}