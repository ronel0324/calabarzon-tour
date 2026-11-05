import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ActivityIndicator,
  TextInput,
  Keyboard
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

// Naka-labas sa component para hindi nagbabago ang reference sa bawat render
const ORIGIN_WHITELIST = ['*'];

const renderMapLoading = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color="#4CAF50" />
  </View>
);

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

// Tanggalin ang accent (Biñan, Los Baños, Dasmariñas) para tugma kahit walang ñ
const normalize = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Mga bayan/lugar bawat province. Dagdagan lang kapag may bagong destination.
const PROVINCE_TOWNS = {
  Quezon: [
    'Agdangan', 'Alabat', 'Atimonan', 'Buenavista', 'Burdeos', 'Calauag', 
    'Candelaria', 'Catanauan', 'Dolores', 'General Luna', 'General Nakar', 
    'Guinayangan', 'Gumaca', 'Infanta', 'Jomalig', 'Lopez', 'Lucban', 
    'Lucena', 'Macalelon', 'Mauban', 'Mulanay', 'Padre Burgos', 'Pagbilao', 
    'Panukulan', 'Patnanungan', 'Perez', 'Pitogo', 'Plaridel', 'Polillo', 
    'Quezon', 'Real', 'Sampaloc', 'San Andres', 'San Antonio', 'San Francisco', 
    'San Narciso', 'Sariaya', 'Tagkawayan', 'Tayabas', 'Tiaong', 'Unisan'
  ],
  Laguna: [
    'Alaminos', 'Bay', 'Biñan', 'Cabuyao', 'Calamba', 'Calauan', 'Cavinti', 
    'Famy', 'Kalayaan', 'Liliw', 'Los Baños', 'Luisiana', 'Lumban', 'Mabitac', 
    'Magdalena', 'Majayjay', 'Nagcarlan', 'Paete', 'Pagsanjan', 'Pakil', 
    'Pangil', 'Pila', 'Rizal', 'San Pablo', 'San Pedro', 'Santa Cruz', 
    'Santa Maria', 'Santa Rosa', 'Siniloan', 'Victoria'
  ],
  Batangas: [
    'Agoncillo', 'Alitagtag', 'Balayan', 'Balete', 'Batangas City', 'Bauan',
    'Calaca', 'Calatagan', 'Cuenca', 'Ibaan', 'Laurel', 'Lemery', 'Lian',
    'Lipa', 'Lobo', 'Mabini', 'Malvar', 'Mataasnakahoy', 'Nasugbu',
    'Padre Garcia', 'Rosario', 'San Jose', 'San Juan', 'San Luis', 'San Pascual',
    'Santa Teresita', 'Santo Tomas', 'Taal', 'Talisay', 'Tanauan', 'Taysan',
    'Tingloy', 'Tuy'
  ],
  Cavite: [
    'Alfonso', 'Amadeo', 'Bacoor', 'Carmona', 'Cavite City', 'Dasmariñas',
    'General Emilio Aguinaldo', 'General Mariano Alvarez', 'General Trias',
    'Imus', 'Indang', 'Kawit', 'Magallanes', 'Maragondon', 'Mendez', 'Naic',
    'Noveleta', 'Rosario', 'Silang', 'Tagaytay', 'Tanza', 'Ternate', 'Trece Martires'
  ],
  Rizal: [
    'Angono', 'Antipolo', 'Baras', 'Binangonan', 'Cainta', 'Cardona', 
    'Jala-jala', 'Morong', 'Pililla', 'Rodriguez', 'San Ildefonso', 
    'San Mateo', 'Tanay', 'Taytay', 'Teresa'
  ]
};

const PROVINCE_NAMES = Object.keys(PROVINCE_TOWNS);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "Rizal St.", "Quezon Ave", "Laguna Blvd" ay pangalan ng kalye, hindi province
const STREET_SUFFIX =
  '(?:st|street|ave|avenue|rd|road|blvd|boulevard|highway|hwy|ext|extension|drive|dr|lane)(?![a-z])';
const stripStreetNames = (text) =>
  text.replace(
    new RegExp(
      `(^|[^a-z])(?:${PROVINCE_NAMES.map(normalize).join('|')})\\s+${STREET_SUFFIX}\\.?`,
      'g'
    ),
    '$1 '
  );

// Posisyon ng huling buong-salita na tugma (-1 kung wala)
const lastIndexOfWord = (text, word) => {
  const re = new RegExp(`(^|[^a-z])${escapeRegex(normalize(word))}(?![a-z])`, 'g');
  let last = -1;
  let m;
  while ((m = re.exec(text)) !== null) last = m.index + m[1].length;
  return last;
};

// Alamin ang province ng destination: 1) `province` field, 2) huling lugar sa address
const getProvinceOf = (dest) => {
  const explicit = PROVINCE_NAMES.find((p) => normalize(p) === normalize(dest.province));
  if (explicit) return explicit;

  const text = stripStreetNames(normalize(dest.address));
  let best = null;
  let bestPos = -1;
  PROVINCE_NAMES.forEach((p) => {
    [p, ...PROVINCE_TOWNS[p]].forEach((word) => {
      const pos = lastIndexOfWord(text, word);
      const isOwnName = word === p; // pangalan mismo ng province ("Rizal" = Rizal province)
      if (pos > bestPos || (pos === bestPos && pos >= 0 && isOwnName)) {
        best = p;
        bestPos = pos;
      }
    });
  });
  return best;
};

const matchesProvince = (dest, province) => {
  if (province === 'All') return true;
  return getProvinceOf(dest) === province;
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
// Optimized: canvas markers + clustering + diff update
const buildMapHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .me {
      width: 16px; height: 16px; border-radius: 8px;
      background: #1976D2; border: 3px solid #fff;
      box-shadow: 0 0 0 4px rgba(25,118,210,0.3);
    }
    .pin-wrap svg { display: block; }
    .leaflet-marker-icon { will-change: transform; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      preferCanvas: true,
      renderer: L.canvas({ padding: 0.3, tolerance: 8 }),
      fadeAnimation: false,
      markerZoomAnimation: false,
      zoomAnimation: false,
      inertia: false,
      keyboard: false,
      boxZoom: false
    }).setView([${CALABARZON_CENTER.latitude}, ${CALABARZON_CENTER.longitude}], ${CALABARZON_CENTER.zoom});

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 0,
      detectRetina: false,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Hugis ng pin (viewBox 36x48): bilog sa taas, matulis sa ilalim
    var PIN_PATH = 'M18 1C8.6 1 1 8.6 1 18c0 12.5 17 29 17 29s17-16.5 17-29C35 8.6 27.4 1 18 1z';

    // Clustering: pinagsasama ang magkakalapit na pin kapag naka-zoom out
    var cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 80,
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      animate: false,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: function (c) {
        var n = c.getChildCount();
        var w = n < 10 ? 38 : n < 50 ? 44 : 50;
        var h = Math.round(w * 4 / 3);
        var fs = n < 10 ? 13 : n < 100 ? 12 : 10;
        var svg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 36 48">' +
          '<path d="' + PIN_PATH + '" fill="#2E7D32" stroke="#fff" stroke-width="2"/>' +
          '<circle cx="18" cy="18" r="11" fill="#fff"/>' +
          '<text x="18" y="18" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="700" font-size="' + fs + '" fill="#1B5E20">' + n + '</text>' +
          '</svg>';
        return L.divIcon({
          html: svg,
          className: 'pin-wrap',
          iconSize: [w, h],
          iconAnchor: [w / 2, h]
        });
      }
    });
    map.addLayer(cluster);

    var markers = {};   // id -> marker
    var meMarker = null;

    // Isang icon bawat kulay, ginagamit ulit (cached) para magaan
    var iconCache = {};
    function pinIcon(color) {
      if (iconCache[color]) return iconCache[color];
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 36 48">' +
        '<path d="' + PIN_PATH + '" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
        '<circle cx="18" cy="18" r="7" fill="#fff"/>' +
        '</svg>';
      iconCache[color] = L.icon({
        iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
        iconSize: [30, 40],
        iconAnchor: [15, 40]
      });
      return iconCache[color];
    }
    var routeLayer = null;

    function send(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }

    // Idagdag/alisin lang ang nagbago, hindi ginagawa ulit ang lahat
    window.setDestinations = function (list, fit) {
      var next = {};
      var toAdd = [];

      list.forEach(function (d) {
        next[d.id] = true;
        var existing = markers[d.id];
        if (existing) {
          if (existing._color !== d.color) {
            existing.setIcon(pinIcon(d.color));
            existing._color = d.color;
          }
          return;
        }
        var m = L.marker([d.latitude, d.longitude], { icon: pinIcon(d.color), riseOnHover: false, keyboard: false });
        m._color = d.color;
        m.on('click', function () {
          map.setView([d.latitude, d.longitude], Math.max(map.getZoom(), 12), { animate: true, duration: 0.4 });
          send({ type: 'marker', id: d.id });
        });
        markers[d.id] = m;
        toAdd.push(m);
      });

      var toRemove = [];
      for (var id in markers) {
        if (!next[id]) { toRemove.push(markers[id]); delete markers[id]; }
      }
      if (toRemove.length) cluster.removeLayers(toRemove);
      if (toAdd.length) cluster.addLayers(toAdd);

      // Kapag nagbago ang filter, i-zoom ang mapa sa mga natirang pin
      if (fit && list.length > 0) {
        if (list.length === 1) {
          map.setView([list[0].latitude, list[0].longitude], 11, { animate: true, duration: 0.5 });
        } else {
          var pts = list.map(function (d) { return [d.latitude, d.longitude]; });
          map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 12, animate: true, duration: 0.5 });
        }
      }
    };

    window.setUserLocation = function (lat, lng, fly) {
      var icon = L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
      if (meMarker) { meMarker.setLatLng([lat, lng]); }
      else { meMarker = L.marker([lat, lng], { icon: icon, interactive: false }).addTo(map); }
      if (fly) { map.setView([lat, lng], 10, { animate: true, duration: 0.6 }); }
    };

    // Iguhit ang ruta. coords ay galing sa OSRM: [[lng, lat], ...]
    window.drawRoute = function (coords) {
      if (routeLayer) { map.removeLayer(routeLayer); }
      var latlngs = coords.map(function (c) { return [c[1], c[0]]; });
      routeLayer = L.layerGroup();
      // puting outline sa ilalim para kita sa kahit anong kulay ng mapa
      L.polyline(latlngs, { color: '#fff', weight: 9, opacity: 0.9, smoothFactor: 2 }).addTo(routeLayer);
      L.polyline(latlngs, { color: '#1976D2', weight: 5, opacity: 1, smoothFactor: 2 }).addTo(routeLayer);
      routeLayer.addTo(map);
      map.fitBounds(L.latLngBounds(latlngs), {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 160]
      });
    };

    window.clearRoute = function () {
      if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    };

    // Lipad sa napiling destination
    window.focusOn = function (lat, lng) {
      map.setView([lat, lng], 15, { animate: true, duration: 0.6 });
    };

    window.centerMap = function () {
      map.setView([${CALABARZON_CENTER.latitude}, ${CALABARZON_CENTER.longitude}], ${CALABARZON_CENTER.zoom}, { animate: true, duration: 0.6 });
    };

    send({ type: 'ready' });
  </script>
</body>
</html>
`;

// Styles ng hamburger menu at filter panel (hiwalay para hindi galawin ang mapStyles.js)
const menuStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bar: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#333',
    marginVertical: 2.5
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F4',
    paddingHorizontal: 14
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#263238', paddingVertical: 0 },
  searchClear: { fontSize: 16, color: '#78909C', paddingLeft: 8 },
  suggestions: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    zIndex: 30,
    elevation: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden'
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1'
  },
  suggestionName: { fontSize: 15, fontWeight: '600', color: '#263238' },
  suggestionAddr: { fontSize: 12, color: '#78909C', marginTop: 1 },
  noResult: { padding: 14, color: '#78909C', fontSize: 14 },

  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdrop: { flex: 1 },
  panel: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#fff',
    paddingHorizontal: 18
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#263238' },
  closeX: { fontSize: 20, color: '#607D8B' },
  panelBody: { flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#90A4AE',
    letterSpacing: 1,
    marginBottom: 10
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 14, color: '#455A64' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  catRowActive: { backgroundColor: '#E8F5E9' },
  catDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  catText: { flex: 1, fontSize: 15, color: '#37474F' },
  catTextActive: { fontWeight: '700', color: '#1B5E20' },
  catCheck: { fontSize: 16, color: '#2E7D32', fontWeight: '700' },
  panelFooter: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1'
  },
  footerReset: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginRight: 10,
    justifyContent: 'center'
  },
  footerResetText: { color: '#546E7A', fontWeight: '600' },
  footerDone: {
    flex: 1,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerDoneText: { color: '#fff', fontWeight: '700' }
});

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
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const activeFilterCount =
    (selectedProvince !== 'All' ? 1 : 0) + (selectedCategory !== 'All' ? 1 : 0);

  const resetFilters = () => {
    setSelectedProvince('All');
    setSelectedCategory('All');
  };
  const filterKeyRef = useRef('All|All');
  const webViewRef = useRef(null);

  // Laki ng system bars (home button / gesture bar) at ng screen
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Isang beses lang gagawin ang source para hindi nagre-reload ang WebView
  const mapSource = useMemo(() => ({ html: buildMapHtml() }), []);

  // Mabilis na hanapan ng destination kapag may na-tap na pin
  const destinationsById = useMemo(() => {
    const m = new Map();
    destinations.forEach((d) => m.set(String(d.id), d));
    return m;
  }, [destinations]);

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

  // Search: hanapin sa pangalan o address (lahat ng destinations, hindi lang yung filtered)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const starts = [];
    const contains = [];
    destinations.forEach((d) => {
      const name = (d.name || '').toLowerCase();
      const addr = (d.address || '').toLowerCase();
      if (name.startsWith(q)) starts.push(d);
      else if (name.includes(q) || addr.includes(q)) contains.push(d);
    });
    return [...starts, ...contains].slice(0, 6);
  }, [searchQuery, destinations]);

  const handleSelectSearch = (dest) => {
    Keyboard.dismiss();
    setSearchQuery('');
    // Kung natatakpan ng filter ang pin, alisin muna ang filter
    const visible = filteredDestinations.some((d) => String(d.id) === String(dest.id));
    if (!visible) resetFilters();
    setTimeout(
      () => runInMap(`window.focusOn(${Number(dest.latitude)}, ${Number(dest.longitude)})`),
      visible ? 0 : 400
    );
  };

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

      // Filter destinations that have coordinates
      const destinationsWithCoords = allDestinations.filter(
        (dest) => dest.latitude && dest.longitude
      );

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

      // Kapag background na pagkuha (hindi button), gamitin ang last known para mabilis
      const location =
        (!showAlert && (await Location.getLastKnownPositionAsync())) ||
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        }));

      runInMap(
        `window.setUserLocation(${location.coords.latitude}, ${location.coords.longitude}, ${showAlert})`
      );
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMessage = useCallback(
    async (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'ready') {
          setMapReady(true);
        } else if (data.type === 'marker') {
          const destination = destinationsById.get(String(data.id));
          if (!destination) return;

          // Ilabas agad ang modal, saka hintayin ang panorama check
          setSelectedDestination(destination);
          setSelectedHasPanorama(false);
          setShowInfoModal(true);

          const entry = await getEntryPanoramaPoint(destination.id);
          setSelectedHasPanorama(!!entry);
        }
      } catch (error) {
        console.error('Error handling map message:', error);
      }
    },
    [destinationsById]
  );

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

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
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
        {/* Top bar: hamburger menu (nasa loob ang filters) */}
        <View style={menuStyles.topBar}>
          <TouchableOpacity
            style={menuStyles.menuButton}
            onPress={() => {
              Keyboard.dismiss();
              setShowMenu(true);
            }}
            accessibilityLabel="Open filters"
          >
            <View style={menuStyles.bar} />
            <View style={menuStyles.bar} />
            <View style={menuStyles.bar} />
            {activeFilterCount > 0 && (
              <View style={menuStyles.badge}>
                <Text style={menuStyles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={menuStyles.searchBox}>
            <Text style={menuStyles.searchIcon}>🔍</Text>
            <TextInput
              style={menuStyles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search destination..."
              placeholderTextColor="#90A4AE"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              onSubmitEditing={() => {
                if (searchResults.length > 0) handleSelectSearch(searchResults[0]);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
                <Text style={menuStyles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Map area (map + buttons + counter) */}
        <View style={styles.mapWrapper}>
          {/* Map View (Leaflet + OpenStreetMap) */}
          <MapWebView
            ref={webViewRef}
            style={styles.map}
            originWhitelist={ORIGIN_WHITELIST}
            source={mapSource}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={renderMapLoading}
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

          {/* Search suggestions */}
          {searchQuery.trim().length > 0 && (
            <View style={menuStyles.suggestions}>
              {searchResults.length === 0 ? (
                <Text style={menuStyles.noResult}>Walang nahanap</Text>
              ) : (
                searchResults.map((d, i) => (
                  <TouchableOpacity
                    key={String(d.id)}
                    style={[
                      menuStyles.suggestionRow,
                      i === searchResults.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => handleSelectSearch(d)}
                  >
                    <View
                      style={[menuStyles.catDot, { backgroundColor: getPinColor(d.category) }]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={menuStyles.suggestionName} numberOfLines={1}>
                        {d.name}
                      </Text>
                      {!!d.address && (
                        <Text style={menuStyles.suggestionAddr} numberOfLines={1}>
                          {d.address}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
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

        {/* Legend: nasa ilalim na ng mapa, at may espasyo para sa home button */}
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

        {/* Hamburger menu: side panel na may Province at Category filters */}
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <View style={menuStyles.overlay}>
            <View
              style={[
                menuStyles.panel,
                { paddingTop: insets.top + 12, paddingBottom: 12 + insets.bottom }
              ]}
            >
              <View style={menuStyles.panelHeader}>
                <Text style={menuStyles.panelTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setShowMenu(false)} hitSlop={10}>
                  <Text style={menuStyles.closeX}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={menuStyles.panelBody} showsVerticalScrollIndicator={false}>
                <Text style={menuStyles.sectionLabel}>PROVINCE</Text>
                <View style={menuStyles.chipWrap}>
                  {PROVINCES.map((province) => {
                    const active = selectedProvince === province;
                    return (
                      <TouchableOpacity
                        key={province}
                        style={[menuStyles.chip, active && menuStyles.chipActive]}
                        onPress={() => setSelectedProvince(province)}
                      >
                        <Text style={[menuStyles.chipText, active && menuStyles.chipTextActive]}>
                          {province}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[menuStyles.sectionLabel, { marginTop: 18 }]}>CATEGORY</Text>
                {CATEGORY_OPTIONS.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[menuStyles.catRow, active && menuStyles.catRowActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      {cat !== 'All' ? (
                        <View
                          style={[menuStyles.catDot, { backgroundColor: categoryColors[cat] }]}
                        />
                      ) : (
                        <View style={[menuStyles.catDot, { backgroundColor: '#B0BEC5' }]} />
                      )}
                      <Text style={[menuStyles.catText, active && menuStyles.catTextActive]}>
                        {cat === 'All' ? 'All Categories' : cat}
                      </Text>
                      {active && <Text style={menuStyles.catCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={menuStyles.panelFooter}>
                <TouchableOpacity style={menuStyles.footerReset} onPress={resetFilters}>
                  <Text style={menuStyles.footerResetText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={menuStyles.footerDone}
                  onPress={() => setShowMenu(false)}
                >
                  <Text style={menuStyles.footerDoneText}>
                    Show {filteredDestinations.length} destinations
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pindutin ang madilim na bahagi para isara */}
            <TouchableOpacity
              style={menuStyles.backdrop}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
          </View>
        </Modal>

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