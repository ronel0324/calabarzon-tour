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
import { getDestinationById, updateDestination } from '../services/database';
import LocationPicker from '../components/LocationPicker';

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

  const pickImage = async () => {
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

const styles = StyleSheet.create({
  // FIX: Wala dating safeArea style. Walang flex: 1 ang SafeAreaView kaya
  // naging 0 ang taas sa phone (white screen) at hindi nag-scroll sa web.
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50', // Match header color
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 40, // Extra padding for phone navigation buttons
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePickerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  changeImageButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  changeImageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});