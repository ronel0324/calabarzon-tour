# Implementation Plan: Interactive Map with 360° Virtual Tours

## Feature Requirements

### 1. Map View with Destination Pins
- Display all destinations as pins on a map
- Cluster nearby pins when zoomed out
- Tap on pin to zoom in and show destination info
- Different pin colors for different categories

### 2. 360° Panorama View
- When pin is selected, transition to 360° view
- Gyroscope support for device rotation
- Touch controls for panning/zooming
- Smooth panorama rendering

### 3. Navigation Between Points
- Hot spots on panorama that link to nearby viewpoints
- Click/tap to "walk" to the next location
- Animated transitions between panoramas
- Mini-map showing current position and available paths

## Libraries Needed

### Primary Libraries
```bash
npm install react-native-maps
npm install expo-location
npm install react-native-panorama-view
# OR alternative:
npm install expo-gl three@0.160.0 @react-three/fiber
npm install react-native-reanimated
```

### Optional Enhancements
```bash
npm install react-native-gesture-handler
npm install react-native-svg
```

## Database Schema Updates

### Add to destinations table:
```sql
ALTER TABLE destinations ADD COLUMN latitude REAL;
ALTER TABLE destinations ADD COLUMN longitude REAL;
```

### New table: panorama_points
```sql
CREATE TABLE IF NOT EXISTS panorama_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id INTEGER NOT NULL,
  name TEXT,
  panorama_image TEXT,  -- URL or local path to 360° image
  latitude REAL,
  longitude REAL,
  rotation REAL DEFAULT 0,
  is_entry_point INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (destination_id) REFERENCES destinations(id)
);
```

### New table: panorama_connections
```sql
CREATE TABLE IF NOT EXISTS panorama_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_point_id INTEGER NOT NULL,
  to_point_id INTEGER NOT NULL,
  hotspot_x REAL,  -- X position on panorama (0-1)
  hotspot_y REAL,  -- Y position on panorama (0-1)
  direction_angle REAL,  -- Angle from north (0-360)
  label TEXT,
  FOREIGN KEY (from_point_id) REFERENCES panorama_points(id),
  FOREIGN KEY (to_point_id) REFERENCES panorama_points(id)
);
```

## File Structure

```
screens/
├── MapScreen.js                    # NEW: Main map view with pins
├── PanoramaViewScreen.js           # NEW: 360° panorama viewer
├── PanoramaNavigationScreen.js    # NEW: Navigation between panoramas
└── (existing screens...)

components/
├── MapMarker.js                   # NEW: Custom map pin component
├── PanoramaViewer.js              # NEW: 360° viewer component
├── PanoramaHotspot.js             # NEW: Navigation hotspot component
├── MiniMap.js                     # NEW: Mini-map overlay component
└── DestinationInfoCard.js         # NEW: Info card for selected destination

services/
├── database.js                    # UPDATE: Add map & panorama functions
├── mapService.js                  # NEW: Map-related functions
└── panoramaService.js             # NEW: Panorama-related functions
```

## Implementation Phases

### Phase 1: Basic Map View ✓
1. Install react-native-maps
2. Create MapScreen with basic map
3. Add destination coordinates to database
4. Display pins for each destination
5. Handle pin tap to show destination info

### Phase 2: Map Enhancements ✓
1. Implement clustering for nearby destinations
2. Category-based pin colors
3. Search/filter integration with map
4. Zoom to user location
5. Custom pin designs

### Phase 3: 360° Viewer ✓
1. Install panorama library
2. Create PanoramaViewScreen
3. Load and display 360° images
4. Implement touch controls (pan, zoom)
5. Add gyroscope support

### Phase 4: Navigation System ✓
1. Create panorama_points database
2. Create panorama_connections database
3. Add hotspots to panoramas
4. Implement point-to-point navigation
5. Add transition animations

### Phase 5: Integration ✓
1. Connect map view to panorama view
2. Add "Enter Virtual Tour" button on map
3. Mini-map overlay in panorama view
4. Back navigation to map
5. Progress tracking for visited points

## Sample Data Structure

### Destination with Coordinates
```javascript
{
  id: 1,
  name: "Taal Volcano",
  latitude: 14.0091,
  longitude: 120.9931,
  category: "Natural Wonder",
  // ... other fields
}
```

### Panorama Point
```javascript
{
  id: 1,
  destination_id: 1,
  name: "Volcano Island Viewpoint",
  panorama_image: "https://example.com/taal_360_1.jpg",
  latitude: 14.0091,
  longitude: 120.9931,
  rotation: 0,
  is_entry_point: 1
}
```

### Panorama Connection
```javascript
{
  id: 1,
  from_point_id: 1,
  to_point_id: 2,
  hotspot_x: 0.5,
  hotspot_y: 0.4,
  direction_angle: 90,
  label: "Walk to Crater View"
}
```

## User Flow

```
1. User opens app
   ↓
2. Taps "Browse Destinations" → Goes to MapScreen
   ↓
3. Sees map with pins for all destinations
   ↓
4. Taps on a pin → Info card appears
   ↓
5. Taps "Enter Virtual Tour" → Transition to PanoramaViewScreen
   ↓
6. Views 360° panorama of entry point
   ↓
7. Sees hotspots (arrows/indicators) to other viewpoints
   ↓
8. Taps hotspot → Animated transition to next panorama
   ↓
9. Can continue "walking" through connected points
   ↓
10. Mini-map shows current position
    ↓
11. Taps "Back to Map" → Returns to MapScreen
```

## Technical Considerations

### 360° Image Requirements
- Format: Equirectangular projection (2:1 ratio)
- Resolution: Minimum 4096x2048px (higher is better)
- File format: JPEG (optimized for web) or PNG
- Can be hosted online or bundled in app
- Consider using compressed images for mobile performance

### Performance Optimization
- Lazy load panorama images
- Implement image caching
- Use lower resolution on slower devices
- Preload adjacent panoramas
- Optimize hotspot calculations
- Use React.memo for expensive components

### Alternative Solutions

#### Option A: Full Native Implementation
- Best performance
- Smooth animations
- Requires more setup
- Libraries: react-native-panorama-view + react-native-maps

#### Option B: WebView-based (Easier)
- Use Pannellum.js or Photo Sphere Viewer in WebView
- Easier to implement
- May have slight performance lag
- Good for MVP/prototype

#### Option C: Three.js + Expo GL
- Most flexible
- Can add custom 3D objects
- Steeper learning curve
- Best for advanced features

## Recommended Approach

**For MVP/Initial Version:**
- Use Option B (WebView with Pannellum.js)
- Faster to implement
- Easy to test with sample 360° images
- Can upgrade to native later

**For Production:**
- Use Option A (Native implementation)
- Better performance
- Better user experience
- Professional feel

## Where to Get 360° Images

### Free Sources:
1. Google Street View static API (limited)
2. Public domain 360° photos
3. Create your own with 360° camera apps

### DIY Options:
1. Use Google Street View app to create 360° photos
2. Use Ricoh Theta or Insta360 cameras
3. Use phone camera with panorama apps
4. Use drone with 360° capability

### For Demo/Testing:
- Use sample equirectangular images from:
  - https://www.flickr.com/groups/equirectangular/
  - https://polyhaven.com/hdris (free HDRI images)

## Next Steps

1. Decide on implementation approach (A, B, or C)
2. Install required dependencies
3. Update database schema
4. Create MapScreen with basic functionality
5. Test with sample 360° images
6. Implement panorama viewer
7. Add navigation system
8. Integrate everything

---

**Ready to start implementation?** Let me know which approach you prefer, and I'll create the code for you! 🚀
