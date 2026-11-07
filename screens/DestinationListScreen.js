import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  SafeAreaView,
  Modal // NEW: para sa category at province dropdown
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAllDestinations,
  searchDestinations,
  filterDestinationsByCategory, // FIX: dati wala ito sa import
  deleteDestination
} from '../services/database';
import styles from '../styles/listStyles';
import { useAuth } from '../context/AuthContext';


const CATEGORIES = [
  'All',
  'Natural Wonder',
  'Historical Site',
  'Cultural Heritage',
  'Waterfall',
  'Beach',
  'Mountain',
  'Museum',
  'Other'
];

// NEW: CALABARZON provinces para sa dropdown
const PROVINCES = ['All Provinces', 'Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'];

// NEW: Kukunin ang province mula sa item.province kung meron.
// Kung wala, hahanapin sa address (hal. "Tanay, Rizal").
const getProvince = (item) => {
  if (item.province) return item.province;
  const addr = (item.address || '').toLowerCase();
  return PROVINCES.slice(1).find((p) => addr.includes(p.toLowerCase())) || null;
};

export default function DestinationListScreen({ navigation }) {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces'); // NEW
  const [openDropdown, setOpenDropdown] = useState(null); // NEW: null | 'category' | 'province'
  const { isAdmin } = useAuth();

  const loadDestinations = async () => {
    try {
      let results;
      if (searchQuery.trim()) {
        results = await searchDestinations(searchQuery);
      } else if (selectedCategory !== 'All') {
        results = await filterDestinationsByCategory(selectedCategory);
      } else {
        results = await getAllDestinations();
      }

      // NEW: province filter (gumagana kasabay ng search at category)
      if (selectedProvince !== 'All Provinces') {
        results = results.filter((item) => getProvince(item) === selectedProvince);
      }

      setDestinations(results);
    } catch (error) {
      console.error('Error loading destinations:', error);
      Alert.alert('Error', 'Failed to load destinations');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDestinations();
    }, [searchQuery, selectedCategory, selectedProvince]) // NEW: selectedProvince
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when filtering by category
  };

  // NEW: pagpili ng province mula sa dropdown
  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
  };

  // NEW: iisang modal para sa category at province
  const dropdownOptions = openDropdown === 'category' ? CATEGORIES : PROVINCES;
  const dropdownSelected = openDropdown === 'category' ? selectedCategory : selectedProvince;

  const handleOptionSelect = (value) => {
    if (openDropdown === 'category') {
      handleCategoryFilter(value);
    } else {
      handleProvinceSelect(value);
    }
    setOpenDropdown(null);
  };

  // Hiwalay na function para sa actual na pagbura
  const performDelete = async (id) => {
    if (!isAdmin) return;
    try {
      console.log('Deleting id:', id);
      await deleteDestination(id);
      console.log('Deleted!');
      await loadDestinations();
      if (Platform.OS === 'web') {
        window.alert('Destination deleted successfully');
      } else {
        Alert.alert('Success', 'Destination deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting destination:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete destination');
      } else {
        Alert.alert('Error', 'Failed to delete destination');
      }
    }
  };

  const handleDelete = (id, name) => {
    console.log('Delete pressed:', id, name);

    // FIX: Alert.alert na may buttons ay HINDI gumagana sa Expo Web,
    // kaya gumamit ng window.confirm doon.
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
        performDelete(id);
      }
      return;
    }

    Alert.alert(
      'Delete Destination',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(id)
        }
      ]
    );
  };

  // FIX: Hindi na nested ang buttons sa loob ng TouchableOpacity.
  // Ang card ay View na; ang info area lang ang pinipindot para mag-navigate.
  const renderDestinationItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DestinationDetail', { destinationId: item.id })}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/400x200?text=No+Image' }}
          style={styles.cardImage}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <Text style={styles.cardAddress}>{item.address}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>

      {isAdmin && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditDestination', { destinationId: item.id })}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              console.log('Add Quiz pressed:', item.id, item.name);
              console.log('Registered routes:', navigation.getState().routeNames);
              navigation.navigate('AddQuiz', {
                destinationId: item.id,
                destinationName: item.name
              });
            }}
          >
            <Text style={styles.editButtonText}>Add Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const categoryActive = selectedCategory !== 'All';
  const provinceActive = selectedProvince !== 'All Provinces';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* NEW: Dalawang dropdown button — Categories at Province */}
        <View style={dropdownStyles.row}>
          <TouchableOpacity
            style={[styles.filterButton, categoryActive && styles.filterButtonActive]}
            onPress={() => setOpenDropdown('category')}
          >
            <Text
              style={[styles.filterButtonText, categoryActive && styles.filterButtonTextActive]}
            >
              {categoryActive ? selectedCategory : 'Categories'} ▼
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, provinceActive && styles.filterButtonActive]}
            onPress={() => setOpenDropdown('province')}
          >
            <Text
              style={[styles.filterButtonText, provinceActive && styles.filterButtonTextActive]}
            >
              {provinceActive ? selectedProvince : 'Province'} ▼
            </Text>
          </TouchableOpacity>
        </View>

        {/* NEW: Modal na ginagamit ng dalawang dropdown */}
        <Modal
          visible={openDropdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setOpenDropdown(null)}
        >
          <TouchableOpacity
            style={dropdownStyles.overlay}
            activeOpacity={1}
            onPress={() => setOpenDropdown(null)}
          >
            <View style={dropdownStyles.modalContent}>
              <Text style={dropdownStyles.modalTitle}>
                {openDropdown === 'category' ? 'Select Category' : 'Select Province'}
              </Text>
              <ScrollView style={dropdownStyles.optionList}>
                {dropdownOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      dropdownStyles.option,
                      dropdownSelected === option && dropdownStyles.optionActive
                    ]}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <Text
                      style={[
                        dropdownStyles.optionText,
                        dropdownSelected === option && dropdownStyles.optionTextActive
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {destinations.length} {destinations.length === 1 ? 'destination' : 'destinations'} found
          </Text>
        </View>

        {/* Destination List */}
        {destinations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No destinations found</Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddDestination')}
              >
                <Text style={styles.addButtonText}>Add Your First Destination</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={destinations}
            renderItem={renderDestinationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// NEW: styles para sa dropdown row at modal (hiwalay sa listStyles)
const dropdownStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#222' },
  optionList: { flexGrow: 0 },
  option: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
  optionActive: { backgroundColor: '#e8f4ff' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextActive: { color: '#007AFF', fontWeight: '600' }
});