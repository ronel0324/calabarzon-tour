import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapWebView from '../components/MapWebView';
import * as Location from 'expo-location';
import { getAllDestinations, getEntryPanoramaPoint } from '../services/database';
import styles from '../styles/mapStyles';

const CALABARZON_CENTER = { latitude: 14.1008, longitude: 121.0794, zoom: 9 };

// Masyadong mabilis ang oras na binibigay ng OSRM (ideal na bilis, walang traffic).
// Ginagawang multiplier para mas realistic. Taasan kung mabilis pa rin, ibaba kung bagal na.
const TRAFFIC_FACTOR = 1.7;

// Alert.alert ay hindi gumagana sa web, kaya window.alert doon
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Category colors for pins
const categoryColors = {
  'Natural Wonder': '#4CAF50',
  'Historical Site': '#FF9800',
  'Cultural Heritage': '#9C27B0',
  'Waterfall': '#2196F3',
  'Beach': '#00BCD4',
  'Mountain': '#795548',
  'Museum': '#E91E63',
  'Other': '#607D8B'
};

// Kulay ng pin: kunin ang unang category kung marami (hal. "Beach, Mountain")
const getPinColor = (category) => {
  const first = (category || '').split(',')[0].trim();
  return categoryColors[first] || categoryColors['Other'];
};

// Mga pagpipilian sa filter
const PROVINCES = ['All', 'Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'];
const CATEGORY_OPTIONS = ['All', ...Object.keys(categoryColors)];

// Province: tinitingnan ang `province` field (kung meron) at ang address ng destination
const matchesProvince = (dest, province) => {
  if (province === 'All') return true;
  const text = `${dest.province || ''} ${dest.address || ''}`.toLowerCase();
  return text.includes(province.toLowerCase());
};

// Category: kaya ang maraming category sa isang destination (hal. "Beach, Mountain")
const matchesCategory = (dest, category) => {
  if (category === 'All') return true;
  return (dest.category || '')
    .split(',')
    .map((c) => c.trim())
    .includes(category);
};

// Format ng layo at oras para sa route card
const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds) => {
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

// Leaflet + OpenStreetMap (walang API key na kailangan)
const buildMapHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .pin {
      width: 36px; height: 36px; border-radius: 18px;
      border: 3px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .me {
      width: 16px; height: 16px; border-radius: 8px;
      background: #1976D2; border: 3px solid #fff;
      box-shadow: 0 0 0 4px rgba(25,118,210,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${CALABARZON_CENTER.latitude}, ${CALABARZON_CENTER.longitude}], ${CALABARZON_CENTER.zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var meMarker = null;
    var routeLayer = null;

    function send(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }

    window.setDestinations = function (list, fit) {
      markersLayer.clearLayers();
      list.forEach(function (d) {
        var icon = L.divIcon({
          className: '',
          html: '<div class="pin" style="background:' + d.color + '">📍</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        L.marker([d.latitude, d.longitude], { icon: icon })
          .addTo(markersLayer)
          .on('click', function () {
            map.flyTo([d.latitude, d.longitude], 12, { duration: 0.6 });
            send({ type: 'marker', id: d.id });
          });
      });

      // Kapag nagbago ang filter, i-zoom ang mapa sa mga natirang pin
      if (fit && list.length > 0) {
        if (list.length === 1) {
          map.flyTo([list[0].latitude, list[0].longitude], 11, { duration: 0.8 });
        } else {
          var pts = list.map(function (d) { return [d.latitude, d.longitude]; });
          map.flyToBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 12, duration: 0.8 });
        }
      }
    };

    window.setUserLocation = function (lat, lng, fly) {
      var icon = L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
      if (meMarker) { meMarker.setLatLng([lat, lng]); }
      else { meMarker = L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map); }
      if (fly) { map.flyTo([lat, lng], 10, { duration: 1 }); }
    };

    // Iguhit ang ruta. coords ay galing sa OSRM: [[lng, lat], ...]
    window.drawRoute = function (coords) {
      if (routeLayer) { map.removeLayer(routeLayer); }
      var latlngs = coords.map(function (c) { return [c[1], c[0]]; });
      routeLayer = L.layerGroup();
      // puting outline sa ilalim para kita sa kahit anong kulay ng mapa
      L.polyline(latlngs, { color: '#fff', weight: 9, opacity: 0.9 }).addTo(routeLayer);
      L.polyline(latlngs, { color: '#1976D2', weight: 5, opacity: 1 }).addTo(routeLayer);
      routeLayer.addTo(map);
      map.fitBounds(L.latLngBounds(latlngs), {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 160]
      });
    };

    window.clearRoute = function () {
      if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      }
    };

    window.centerMap = function () {
      map.flyTo([${CALABARZON_CENTER.latitude}, ${CALABARZON_CENTER.longitude}], ${CALABARZON_CENTER.zoom}, { duration: 1 });
    };

    send({ type: 'ready' });
  </script>
</body>
</html>
`;

const MapScreen = ({ navigation }) => {
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedHasPanorama, setSelectedHasPanorama] = useState(false);
  const [route, setRoute] = useState(null); // { name, distance, duration }
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const filterKeyRef = useRef('All|All');
  const webViewRef = useRef(null);

  // FIX: kunin ang laki ng system bars (home button / gesture bar) at ng screen
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const mapHtml = useMemo(() => buildMapHtml(), []);

  const runInMap = (js) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`${js}; true;`);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  // Destinations na pasok sa napiling province at category
  const filteredDestinations = useMemo(
    () =>
      destinations.filter(
        (d) =>
          matchesProvince(d, selectedProvince) && matchesCategory(d, selectedCategory)
      ),
    [destinations, selectedProvince, selectedCategory]
  );

  // Ipadala ang (filtered) destinations sa map kapag ready na ang map at may data
  useEffect(() => {
    if (!mapReady) return;
    const payload = filteredDestinations.map((d) => ({
      id: d.id,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      color: getPinColor(d.category)
    }));

    // i-zoom lang ang mapa kapag filter ang nagbago (hindi kapag nag-reload)
    const key = `${selectedProvince}|${selectedCategory}`;
    const filterChanged = filterKeyRef.current !== key;
    filterKeyRef.current = key;

    runInMap(`window.setDestinations(${JSON.stringify(payload)}, ${filterChanged})`);
  }, [mapReady, filteredDestinations]);

  // Kunin ang lokasyon ng user kapag ready na ang map
  useEffect(() => {
    if (mapReady) {
      getUserLocation(false);
    }
  }, [mapReady]);

  const loadDestinations = async () => {
    try {
      const allDestinations = await getAllDestinations();
      console.log('📍 Total destinations:', allDestinations.length);

      // Filter destinations that have coordinates
      const destinationsWithCoords = allDestinations.filter(
        (dest) => dest.latitude && dest.longitude
      );

      console.log('📍 Destinations with coordinates:', destinationsWithCoords.length);

      setDestinations(destinationsWithCoords);

      if (destinationsWithCoords.length === 0) {
        notify(
          'No Destinations Found',
          'No destinations have GPS coordinates. Please add coordinates to your destinations or reload sample data.'
        );
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
      notify('Error', 'Failed to load destinations');
    }
  };

  const getUserLocation = async (showAlert = true) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (showAlert) {
          notify(
            'Permission Denied',
            'Location permission is required to show your position on the map'
          );
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      runInMap(
        `window.setUserLocation(${location.coords.latitude}, ${location.coords.longitude}, ${showAlert})`
      );
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'ready') {
        setMapReady(true);
      } else if (data.type === 'marker') {
        const destination = destinations.find((d) => d.id === data.id);
        if (destination) {
          setSelectedDestination(destination);
          const entry = await getEntryPanoramaPoint(destination.id);
          setSelectedHasPanorama(!!entry);
          setShowInfoModal(true);
        }
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  };

  const handleViewDetails = () => {
    setShowInfoModal(false);
    navigation.navigate('DestinationDetail', {
      destinationId: selectedDestination.id
    });
  };

  const handleView360 = async () => {
    const entry = await getEntryPanoramaPoint(selectedDestination.id);
    if (!entry) {
      notify('No 360° View', 'This destination does not have a 360° view yet.');
      return;
    }
    setShowInfoModal(false);
    navigation.navigate('PanoramaView', {
      destinationId: selectedDestination.id,
      destinationName: selectedDestination.name,
      entryPointId: entry.id
    });
  };

  // Ruta mula sa lokasyon ng user papunta sa napiling destination (OSRM, walang API key)
  const handleGetDirections = async () => {
    if (!selectedDestination) return;
    const dest = selectedDestination;
    setShowInfoModal(false);
    setRouteLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        notify(
          'Permission Denied',
          'Location permission is required to get directions from your position.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const from = loc.coords;
      const toLat = Number(dest.latitude);
      const toLng = Number(dest.longitude);

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from.longitude},${from.latitude};${toLng},${toLat}` +
        `?overview=full&geometries=geojson`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
        notify('No Route Found', 'Walang nahanap na ruta papunta sa destination na ito.');
        return;
      }

      const best = json.routes[0];

      runInMap(`window.setUserLocation(${from.latitude}, ${from.longitude}, false)`);
      runInMap(`window.drawRoute(${JSON.stringify(best.geometry.coordinates)})`);

      setRoute({
        name: dest.name,
        distance: best.distance, // meters
        duration: best.duration * TRAFFIC_FACTOR // seconds (adjusted)
      });
    } catch (error) {
      console.error('Error getting directions:', error);
      notify('Error', 'Hindi makuha ang ruta. Check ang internet connection mo at subukan ulit.');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleClearRoute = () => {
    runInMap('window.clearRoute()');
    setRoute(null);
  };

  const centerOnCALABARZON = () => {
    runInMap('window.centerMap()');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Filter bar: province chips + category dropdown button */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            {PROVINCES.map((province) => {
              const active = selectedProvince === province;
              return (
                <TouchableOpacity
                  key={province}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedProvince(province)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {province}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory !== 'All' && styles.categoryButtonActive
            ]}
            onPress={() => setShowCategoryMenu((v) => !v)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory !== 'All' && styles.categoryButtonTextActive
              ]}
              numberOfLines={1}
            >
              {selectedCategory === 'All' ? 'Category' : selectedCategory} ▾
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map area (map + buttons + counter) */}
        <View style={styles.mapWrapper}>
          {/* Map View (Leaflet + OpenStreetMap) */}
          <MapWebView
            ref={webViewRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            )}
          />

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={centerOnCALABARZON}>
              <Text style={styles.controlButtonText}>🎯 Center</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => getUserLocation(true)}>
              <Text style={styles.controlButtonText}>📍 My Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={loadDestinations}>
              <Text style={styles.controlButtonText}>🔄 Reload</Text>
            </TouchableOpacity>
          </View>

          {/* Destination Counter */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              📍 {filteredDestinations.length} Destinations
            </Text>
          </View>

          {/* Category dropdown (nasa loob ng map area para gumana ang touch) */}
          {showCategoryMenu && (
            <>
              <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFillObject}
                onPress={() => setShowCategoryMenu(false)}
              />
              <View style={styles.categoryMenu}>
                <ScrollView>
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryItem, active && styles.categoryItemActive]}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setShowCategoryMenu(false);
                        }}
                      >
                        {cat !== 'All' && (
                          <View
                            style={[
                              styles.categoryDot,
                              { backgroundColor: categoryColors[cat] }
                            ]}
                          />
                        )}
                        <Text
                          style={[styles.categoryItemText, active && styles.categoryItemTextActive]}
                        >
                          {cat === 'All' ? 'All Categories' : cat}
                        </Text>
                        {active && <Text style={styles.categoryCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}

          {/* Loading habang kinukuha ang ruta */}
          {routeLoading && (
            <View style={styles.routeLoading}>
              <ActivityIndicator size="small" color="#1976D2" />
              <Text style={styles.routeLoadingText}>Finding route...</Text>
            </View>
          )}

          {/* Route Card: ETA at layo */}
          {route && (
            <View style={styles.routeCard}>
              <View style={styles.routeCardInfo}>
                <Text style={styles.routeCardName} numberOfLines={1}>
                  🧭 {route.name}
                </Text>
                <View style={styles.routeStatsRow}>
                  <Text style={styles.routeDuration}>~{formatDuration(route.duration)}</Text>
                  <Text style={styles.routeDistance}>{formatDistance(route.distance)}</Text>
                </View>
                <Text style={styles.routeNote}>Estimated time only, traffic not included</Text>
              </View>
              <TouchableOpacity style={styles.routeClearButton} onPress={handleClearRoute}>
                <Text style={styles.routeClearText}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Legend: nasa ilalim na ng mapa (hindi na nakalutang), at may espasyo para sa home button */}
        <View
          style={[
            styles.legendContainer,
            { paddingBottom: 10 + insets.bottom }
          ]}
        >
          <Text style={styles.legendTitle}>Categories:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(categoryColors).map((category) => (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: categoryColors[category] }]} />
                <Text style={styles.legendText}>{category}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Info Modal */}
        <Modal
          visible={showInfoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { maxHeight: height * 0.85, paddingBottom: 20 + insets.bottom }
              ]}
            >
              {selectedDestination && (
                <>
                  {/* Image */}
                  {selectedDestination.image && (
                    <Image
                      source={{ uri: selectedDestination.image }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Destination Info */}
                  <ScrollView style={styles.modalScrollView}>
                    <Text style={styles.modalTitle}>{selectedDestination.name}</Text>

                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>{selectedDestination.category}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>📍 Location</Text>
                      <Text style={styles.modalText}>{selectedDestination.address}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>ℹ️ Description</Text>
                      <Text style={styles.modalText}>{selectedDestination.description}</Text>
                    </View>
                  </ScrollView>

                  {/* Action Buttons */}
                  <View style={styles.modalButtons}>
                    {selectedHasPanorama && (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.view360Button]}
                        onPress={handleView360}
                      >
                        <Text style={styles.modalButtonText}>🌐 View 360°</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.modalButton, styles.directionsButton]}
                      onPress={handleGetDirections}
                    >
                      <Text style={styles.modalButtonText}>🧭 Get Directions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.detailsButton]}
                      onPress={handleViewDetails}
                    >
                      <Text style={styles.modalButtonText}>📖 View Full Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.closeButton]}
                      onPress={() => setShowInfoModal(false)}
                    >
                      <Text style={styles.modalButtonText}>✕ Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default MapScreen;