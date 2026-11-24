import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { initDatabase, seedSampleData, seedPanoramaData } from './services/database';
import { updateDestinationsWithCoordinates } from './services/updateDestinationsWithCoordinates';
import { COLORS, SERIF } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppSplash from './components/AppSplash';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import DestinationListScreen from './screens/DestinationListScreen';
import DestinationDetailScreen from './screens/DestinationDetailScreen';
import AddDestinationScreen from './screens/AddDestinationScreen';
import EditDestinationScreen from './screens/EditDestinationScreen';
import MapScreen from './screens/MapScreen';
import PanoramaViewScreen from './screens/PanoramaViewScreen';
import AddQuizScreen from './screens/AddQuizScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuizProvincesScreen from './screens/QuizProvincesScreen';
import QuizPlayScreen from './screens/QuizPlayScreen';
import GuessGameScreen from './screens/GuessGameScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import QuizManageScreen from './screens/QuizManageScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, isAdmin, loading: authLoading } = useAuth();

  if (authLoading) return <AppSplash />;

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.taal} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.taal },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontFamily: SERIF, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.paper }
        }}
      >
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CALABARZON Virtual Tour' }} />
            <Stack.Screen name="DestinationList" component={DestinationListScreen} options={{ title: 'Destinations' }} />
            <Stack.Screen name="DestinationDetail" component={DestinationDetailScreen} options={{ title: 'Destination Details' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
            <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Destination Map' }} />
            <Stack.Screen name="PanoramaView" component={PanoramaViewScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="QuizProvinces"
              component={QuizProvincesScreen}
              options={{ title: 'Quiz' }}
            />
            <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
            <Stack.Screen name="GuessGame" component={GuessGameScreen} options={{ title: 'Guess the Place' }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />

            {isAdmin && (
              <>
                <Stack.Screen name="AddDestination" component={AddDestinationScreen} options={{ title: 'Add Destination' }} />
                <Stack.Screen name="EditDestination" component={EditDestinationScreen} options={{ title: 'Edit Destination' }} />
                <Stack.Screen name="AddQuiz" component={AddQuizScreen} options={{ title: 'Add Quiz' }} />
                <Stack.Screen name="QuizManage" component={QuizManageScreen} options={{ title: 'Manage Questions' }} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const setup = async () => {
      try {

        await initDatabase();
      } catch (error) {
        console.error('Database setup error:', error);
      }

      try {
        await updateDestinationsWithCoordinates();
      } catch (error) {
        console.error('Update coordinates error:', error);
      }

      setDbReady(true);
    };
    setup();
  }, []);

  if (!dbReady || !minTimePassed) return <AppSplash />;

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}