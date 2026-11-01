import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView
} from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
           <Image
              source={require('../assets//calabarzon.png')}
              style={styles.headerImage}
              resizeMode="cover"
            />

      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Explore the rich cultural heritage and tourist destinations of Region IV-A
        </Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.highlightedButton]}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🗺️</Text>
            </View>
            <Text style={styles.menuButtonText}>Map View</Text>
            <Text style={styles.menuButtonSubtext}>
              View all destinations on map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('DestinationList')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>📍</Text>
            </View>
            <Text style={styles.menuButtonText}>Browse Destinations</Text>
            <Text style={styles.menuButtonSubtext}>
              Explore tourist spots and cultural sites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('AddDestination')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>➕</Text>
            </View>
            <Text style={styles.menuButtonText}>Add Destination</Text>
            <Text style={styles.menuButtonSubtext}>
              Contribute a new location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>📊</Text>
            </View>
            <Text style={styles.menuButtonText}>My Progress</Text>
            <Text style={styles.menuButtonSubtext}>
              View completed tours and quiz scores
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About CALABARZON</Text>
          <Text style={styles.infoText}>
            Region IV-A (CALABARZON), officially designated as Region IV-A, stands as the most populous and economically dynamic 
            administrative region in the Philippines. Situated immediately southeast of Metro Manila, this contiguous landmass derives its unique 
            name from the acronym of its five constituent provinces: Cavite, Laguna, Batangas, Rizal, and Quezon. The region seamlessly bridges 
            he gap between rapid urban modernization and preserved natural heritage, hosting massive industrial parks, high-tech manufacturing hubs, 
            and vital shipping ports alongside lush agricultural fields and protected mountain ranges. Beyond its massive economic contribution as a 
            manufacturing engine for the country, CALABARZON is steeped in profound cultural and historical significance. It is the birthplace of 
            national heroes like Jose Rizal and Emilio Aguinaldo, the cradle of early Philippine independence, and a sanctuary for traditional arts. 
            Its diverse landscape—characterized by calm inland lakes, rugged volcanic ridges like Tagaytay, and expansive coastlines—makes it a 
            primary destination for ecotourism and a vital gateway to southern Luzon.
          </Text>
        </View>
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
    flexGrow: 1,
    paddingBottom: 20, // Reduced since SafeAreaView handles the spacing
  },
  header: {
    height: 250,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  menuContainer: {
    marginBottom: 30,
  },
  menuButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightedButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIconText: {
    fontSize: 30,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
