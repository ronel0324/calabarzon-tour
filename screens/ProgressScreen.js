import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllProgress, getCompletedDestinations } from '../services/database';

export default function ProgressScreen({ navigation }) {
  const [allProgress, setAllProgress] = useState([]);
  const [completedDestinations, setCompletedDestinations] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  const loadProgress = async () => {
    try {
      const progress = await getAllProgress();
      setAllProgress(progress);

      const completed = await getCompletedDestinations();
      setCompletedDestinations(completed);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const calculateStats = () => {
    const totalAttempts = allProgress.length;
    const totalCompleted = completedDestinations.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            allProgress.reduce((sum, item) => sum + item.quiz_score, 0) /
              totalAttempts
          )
        : 0;

    return { totalAttempts, totalCompleted, avgScore };
  };

  const stats = calculateStats();

  const renderProgressItem = ({ item }) => (
    <TouchableOpacity
      style={styles.progressCard}
      onPress={() =>
        navigation.navigate('DestinationDetail', {
          destinationId: item.destination_id
        })
      }
    >
      <View style={styles.progressHeader}>
        <Text style={styles.destinationName}>{item.destination_name}</Text>
        {item.completed ? (
          <Text style={styles.completedBadge}>✅ Completed</Text>
        ) : (
          <Text style={styles.inProgressBadge}>⏳ In Progress</Text>
        )}
      </View>
      <View style={styles.progressInfo}>
        <Text style={styles.scoreText}>Score: {item.quiz_score}%</Text>
        <Text style={styles.dateText}>
          {new Date(item.completed_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.content}>
        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalAttempts}</Text>
              <Text style={styles.statLabel}>Quiz Attempts</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.avgScore}%</Text>
              <Text style={styles.statLabel}>Average Score</Text>
            </View>
          </View>
        </View>

        {/* Filter Toggle */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !showCompleted && styles.filterButtonActive
            ]}
            onPress={() => setShowCompleted(false)}
          >
            <Text
              style={[
                styles.filterButtonText,
                !showCompleted && styles.filterButtonTextActive
              ]}
            >
              All Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              showCompleted && styles.filterButtonActive
            ]}
            onPress={() => setShowCompleted(true)}
          >
            <Text
              style={[
                styles.filterButtonText,
                showCompleted && styles.filterButtonTextActive
              ]}
            >
              Completed Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress List */}
        <Text style={styles.sectionTitle}>
          {showCompleted ? 'Completed Destinations' : 'All Progress'}
        </Text>

        {(showCompleted ? completedDestinations : allProgress).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showCompleted
                ? 'No completed destinations yet'
                : 'No progress recorded yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              Take quizzes to track your progress!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('DestinationList')}
            >
              <Text style={styles.browseButtonText}>Browse Destinations</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={showCompleted ? completedDestinations : allProgress}
            renderItem={renderProgressItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
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
  scrollContent: {
    paddingBottom: 20, // Reduced since SafeAreaView handles spacing
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inProgressBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
