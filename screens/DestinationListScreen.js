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

export default function DestinationListScreen({ navigation }) {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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