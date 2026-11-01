# Map & 360° Virtual Tour Setup Guide

## 🚀 Quick Start

Your Virtual Tour app now includes:
- **Interactive Map View** with destination pins
- **360° Panorama Viewer** with gyroscope support
- **Navigation between panorama points** (walk-through experience)

## 📋 Prerequisites

All dependencies have been installed:
- ✅ react-native-maps
- ✅ expo-location
- ✅ expo-gl
- ✅ three.js (for 360° rendering)
- ✅ expo-sensors (gyroscope support)
- ✅ react-native-reanimated

## 🗺️ Google Maps API Key Setup

### Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Maps SDK for Android** and **Maps SDK for iOS**
4. Go to **Credentials** → Create **API Key**
5. Copy your API key

### Step 2: Configure API Key

**For Android:**
Update `app.json`:
```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
}
```

**For iOS:**
Add to `app.json`:
```json
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

### Step 3: Restrict Your API Key (Recommended)

In Google Cloud Console:
1. Click on your API key
2. Under **Application restrictions**, select Android/iOS apps
3. Add your app's package name: `com.calabarzon.virtualtour`

## 📸 Adding 360° Panorama Images

### Option 1: Using Google Street View App (FREE & EASY)

1. **Download Google Street View App**
   - Android: [Play Store](https://play.google.com/store/apps/details?id=com.google.android.street)
   - iOS: [App Store](https://apps.apple.com/app/google-street-view/id904418768)

2. **Create 360° Photo**
   - Open Street View app
   - Tap camera icon (🎥)
   - Select "Create Photo Sphere"
   - Follow on-screen instructions to capture 360°
   - Save to your device

3. **Upload to Hosting**
   - Upload to Imgur, Firebase Storage, or your server
   - Get the direct image URL
   - Use this URL in your panorama data

### Option 2: Using 360° Camera

**Recommended Cameras:**
- Ricoh Theta V/Z1 (~$300-400)
- Insta360 ONE X2 (~$400)
- GoPro MAX (~$500)

**Process:**
1. Capture 360° photo at your destination
2. Export as equirectangular image (2:1 ratio)
3. Upload to hosting service
4. Use URL in panorama data

### Option 3: Free Sample Images for Testing

```javascript
// Free 360° panorama sources:
const samplePanoramas = [
  // Flickr Equirectangular Group
  'https://www.flickr.com/groups/equirectangular/',
  
  // Poly Haven (High Quality HDRIs)
  'https://polyhaven.com/hdris',
  
  // Sample URLs (replace with your own)
  'https://cdn.example.com/panorama1.jpg'
];
```

## 🗄️ Adding Panorama Data to Database

### Method 1: Using Seed Script (Automatic)

1. **Import the seed function in App.js:**

```javascript
import { seedPanoramaData } from './services/seedPanoramaData';

useEffect(() => {
  initDatabase();
  seedSampleData();
  seedPanoramaData(); // Add this line
}, []);
```

2. **Run your app** - panorama data will be created automatically

### Method 2: Manual Entry (Recommended for Production)

**Add through code:**

```javascript
import { addPanoramaPoint, addPanoramaConnection } from './services/database';

// Add a panorama point
const point1 = addPanoramaPoint({
  destination_id: 1, // Taal Volcano
  name: 'Crater View',
  panorama_image: 'https://your-server.com/taal_crater_360.jpg',
  latitude: 14.0091,
  longitude: 120.9931,
  rotation: 0,
  is_entry_point: 1
});

const point2 = addPanoramaPoint({
  destination_id: 1,
  name: 'Lake View',
  panorama_image: 'https://your-server.com/taal_lake_360.jpg',
  latitude: 14.0095,
  longitude: 120.9935,
  rotation: 0,
  is_entry_point: 0
});

// Connect the points
addPanoramaConnection({
  from_point_id: point1,
  to_point_id: point2,
  hotspot_x: 0.7,  // 70% from left
  hotspot_y: 0.5,  // 50% from top (center vertically)
  direction_angle: 90,
  label: 'Walk to Lake View'
});

addPanoramaConnection({
  from_point_id: point2,
  to_point_id: point1,
  hotspot_x: 0.3,
  hotspot_y: 0.5,
  direction_angle: 270,
  label: 'Return to Crater View'
});
```

### Method 3: Create Admin Screen (Future Enhancement)

You can create an admin screen in your app to:
- Upload 360° images
- Set hotspot positions
- Create connections between points
- Test the virtual tour

## 📐 Hotspot Position Guide

Hotspots use normalized coordinates (0-1):

```
hotspot_x: 0.0 = far left, 1.0 = far right
hotspot_y: 0.0 = top, 1.0 = bottom

Common positions:
- Center: { x: 0.5, y: 0.5 }
- Left: { x: 0.2, y: 0.5 }
- Right: { x: 0.8, y: 0.5 }
- Top: { x: 0.5, y: 0.3 }
- Bottom: { x: 0.5, y: 0.7 }
```

## 🧪 Testing Your Virtual Tour

### 1. Start the App
```bash
cd VirtualTourCalabarzon
npm start
```

### 2. Test Map View
- Open app on device/emulator
- Tap "Map View" on home screen
- Verify destination pins appear
- Tap a pin to see info modal

### 3. Test Virtual Tour
- Tap "Enter Virtual Tour" on info modal
- Pan around with touch controls
- Look for red hotspot markers
- Tap hotspots to navigate between points

### 4. Test Gyroscope (Physical Device Only)
- Grant sensor permissions
- Tilt your phone to look around
- Gyroscope works best on physical devices

## 🎨 Customization Options

### Pin Colors by Category

Edit `MapScreen.js`:
```javascript
const categoryColors = {
  'Natural Wonder': '#4CAF50',
  'Historical Site': '#FF9800',
  'Cultural Heritage': '#9C27B0',
  'Waterfall': '#2196F3',
  // Add your own colors
};
```

### Hotspot Appearance

Edit `PanoramaViewer.js`:
```javascript
// Change hotspot color
const hotspotMaterial = new THREE.MeshBasicMaterial({
  color: 0xff4444,  // Red (change to any color)
  opacity: 0.8
});

// Change hotspot size
const hotspotGeometry = new THREE.SphereGeometry(10, 16, 16); // 10 = size
```

### Panorama Controls

Edit `PanoramaViewer.js`:
```javascript
// Touch sensitivity
const sensitivity = 0.003; // Lower = slower, Higher = faster

// Gyroscope sensitivity
const sensitivity = 0.05; // Adjust gyro response
```

## 🐛 Troubleshooting

### Map Not Showing
**Problem:** Map appears blank
**Solutions:**
1. Add Google Maps API Key to `app.json`
2. Enable Maps SDK in Google Cloud Console
3. Restart expo with `npm start --clear`

### No Pins on Map
**Problem:** Map loads but no destination pins
**Solutions:**
1. Check destinations have `latitude` and `longitude` values
2. Run `seedSampleData()` again
3. Check console for errors

### 360° View Not Loading
**Problem:** Black screen in panorama view
**Solutions:**
1. Verify panorama image URL is accessible
2. Check image is equirectangular (2:1 ratio)
3. Look at console for Three.js errors
4. Try a different panorama URL

### Gyroscope Not Working
**Problem:** Device tilt doesn't rotate view
**Solutions:**
1. Test on physical device (not emulator)
2. Grant sensor permissions
3. Check device has gyroscope sensor
4. Some Android devices may not have gyroscope

### Hotspots Not Visible
**Problem:** Can't see navigation hotspots
**Solutions:**
1. Verify connections exist in database
2. Check hotspot coordinates (0-1 range)
3. Pan around - hotspots may be behind you
4. Check console for rendering errors

### App Crashes on Virtual Tour
**Problem:** App crashes when entering panorama
**Solutions:**
1. Check image file size (very large images may cause memory issues)
2. Compress images to < 5MB
3. Use JPEG instead of PNG
4. Clear app cache and restart

## 📱 Performance Optimization

### Image Optimization
- Use JPEG format (smaller file size)
- Recommended resolution: 4096x2048px
- Compress to < 5MB per image
- Use CDN for faster loading

### Caching
Future enhancement: Implement image caching
```javascript
// Use expo-file-system to cache images locally
import * as FileSystem from 'expo-file-system';
```

### Memory Management
- Dispose Three.js objects when unmounting
- Limit number of hotspots per panorama (< 10)
- Preload adjacent panoramas in background

## 🚀 Next Steps

### Immediate:
1. ✅ Add Google Maps API Key
2. ✅ Test map view
3. ✅ Add sample panorama data
4. ✅ Test virtual tour

### Short-term:
- [ ] Capture real 360° photos of CALABARZON destinations
- [ ] Upload images to hosting service
- [ ] Replace sample data with real panorama data
- [ ] Test on physical devices

### Long-term:
- [ ] Create admin panel for panorama management
- [ ] Add audio guides
- [ ] Implement image caching
- [ ] Add compass overlay
- [ ] Add sharing functionality
- [ ] Analytics tracking

## 📚 Additional Resources

### Documentation
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Three.js Docs](https://threejs.org/docs/)
- [Expo GL](https://docs.expo.dev/versions/latest/sdk/gl-view/)

### Tutorials
- [Creating 360° Photos with Street View](https://support.google.com/maps/answer/7012050)
- [Three.js Panorama Tutorial](https://threejs.org/examples/#webgl_panorama_equirectangular)

### Tools
- [360° Image Converter](https://360toolkit.co/)
- [Image Compression](https://tinyjpg.com/)
- [Free HDRIs](https://polyhaven.com/)

## ⚠️ Important Notes

1. **Google Maps API Key**: Without this, maps won't load
2. **Real 360° Images**: Sample images are placeholders - replace with actual destination photos
3. **Testing on Device**: Gyroscope only works on physical devices
4. **Permissions**: Location and sensor permissions required
5. **Image Format**: Use equirectangular projection (2:1 ratio)

## 💡 Tips for Best Results

1. **Capture Quality 360° Photos**
   - Shoot during golden hour (better lighting)
   - Avoid moving objects in frame
   - Use tripod for stability
   - Take multiple shots at each location

2. **Plan Your Virtual Tour**
   - Create logical paths between viewpoints
   - Entry point should be main/iconic view
   - Limit to 3-5 points per destination
   - Test navigation flow

3. **User Experience**
   - Add clear labels to hotspots
   - Provide "Return to entrance" connections
   - Include mini-map for orientation
   - Test on various devices

## 🎯 Success Checklist

- [ ] Google Maps API key configured
- [ ] Map loads with destination pins
- [ ] Can tap pins to see destination info
- [ ] Can enter virtual tour from map
- [ ] 360° panorama loads and displays
- [ ] Can pan around with touch
- [ ] Gyroscope works (on device)
- [ ] Hotspots are visible
- [ ] Can navigate between points
- [ ] Mini-map shows current position
- [ ] Can return to map view

---

**Need Help?** Check the troubleshooting section or review the console logs for error messages.

**Ready for Production?** Replace all sample panorama URLs with real 360° images of your CALABARZON destinations!
