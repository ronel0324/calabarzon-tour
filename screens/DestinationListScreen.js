import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAllDestinations,
  searchDestinations,
  filterDestinationsByCategory, // FIX: dati wala ito sa import
  deleteDestination
} from '../services/database';

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

export default function DestinationListScreen({ navigation }) {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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
      setDestinations(results);
    } catch (error) {
      console.error('Error loading destinations:', error);
      Alert.alert('Error', 'Failed to load destinations');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDestinations();
    }, [searchQuery, selectedCategory])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Clear search when filtering by category
  };

  // Hiwalay na function para sa actual na pagbura
  const performDelete = async (id) => {
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

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditDestination', { destinationId: item.id })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedCategory === item && styles.filterButtonActive
                ]}
                onPress={() => handleCategoryFilter(item)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCategory === item && styles.filterButtonTextActive
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddDestination')}
            >
              <Text style={styles.addButtonText}>Add Your First Destination</Text>
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4CAF50', // Match header color
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 5,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  cardInfo: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardCategory: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 5,
  },
  cardAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});