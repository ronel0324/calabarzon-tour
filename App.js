import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { initDatabase, seedSampleData, seedPanoramaData } from './services/database';
import { updateDestinationsWithCoordinates } from './services/updateDestinationsWithCoordinates';
import { supabase } from './services/supabase';

// Import screens
import HomeScreen from './screens/HomeScreen';
import DestinationListScreen from './screens/DestinationListScreen';
import DestinationDetailScreen from './screens/DestinationDetailScreen';
import AddDestinationScreen from './screens/AddDestinationScreen';
import EditDestinationScreen from './screens/EditDestinationScreen';
import ProgressScreen from './screens/ProgressScreen';
import MapScreen from './screens/MapScreen';
import PanoramaViewScreen from './screens/PanoramaViewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        // magkakasunod, hintayin ang bawat isa
        await initDatabase();
        await seedSampleData();
        await seedPanoramaData();
      } catch (error) {
        console.error('Database setup error:', error);
      }

      // hiwalay para hindi harangan ang app kung mag-error ito
      try {
        await updateDestinationsWithCoordinates();
      } catch (error) {
        console.error('Update coordinates error:', error);
      }

      setDbReady(true);
    };
    setup();
  }, []);

  // Huwag i-render ang mga screen hangga't hindi pa handa ang database
  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CALABARZON Virtual Tour' }} />
        <Stack.Screen name="DestinationList" component={DestinationListScreen} options={{ title: 'Destinations' }} />
        <Stack.Screen name="DestinationDetail" component={DestinationDetailScreen} options={{ title: 'Destination Details' }} />
        <Stack.Screen name="AddDestination" component={AddDestinationScreen} options={{ title: 'Add Destination' }} />
        <Stack.Screen name="EditDestination" component={EditDestinationScreen} options={{ title: 'Edit Destination' }} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'My Progress' }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Destination Map' }} />
        <Stack.Screen
          name="PanoramaView"
          component={PanoramaViewScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}