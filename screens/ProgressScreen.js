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
import styles from '../styles/progressStyles';

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