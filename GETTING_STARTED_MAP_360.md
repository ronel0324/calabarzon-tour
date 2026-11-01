# 🚀 Getting Started - Map & 360° Virtual Tour

## Quick Start in 3 Steps

### Step 1: Run the App (2 minutes)
```bash
cd VirtualTourCalabarzon
npm start
```

Press `a` for Android or `i` for iOS, or scan QR code with Expo Go app.

---

### Step 2: Add Google Maps API Key (5 minutes)

**Why needed?** Without this, the map won't load.

1. **Get API Key**
   - Visit: https://console.cloud.google.com/
   - Create new project (or use existing)
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy your key

2. **Enable Required APIs**
   - Go to **APIs & Services** → **Library**
   - Search and enable:
     - ✅ Maps SDK for Android
     - ✅ Maps SDK for iOS (if using iOS)

3. **Add to app.json**
   
   Open `app.json` and find this section:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
       }
     }
   }
   ```
   
   Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key.

4. **Restart App**
   ```bash
   npm start --clear
   ```

---

### Step 3: Enable Sample Panorama Data (1 minute)

**Why needed?** To test the 360° virtual tour feature.

1. **Open App.js**
   
   Find this line (around line 25):
   ```javascript
   // seedPanoramaData();
   ```

2. **Uncomment it** (remove the `//`):
   ```javascript
   seedPanoramaData();
   ```

3. **Save and Restart**
   - The app will reload automatically
   - Sample panorama data will be created
   - Check console for success message

4. **Test It**
   - Open app
   - Tap "Map View"
   - Tap any pin
   - Tap "Enter Virtual Tour"
   - You should see a 360° view!

---

## ✅ Verification Checklist

### Map View Working?
- [ ] Map loads (not blank gray)
- [ ] Colored pins appear on map
- [ ] Can tap pins to see info modal
- [ ] "My Location" button shows your position
- [ ] Category legend appears at bottom

### Virtual Tour Working?
- [ ] "Enter Virtual Tour" button appears in modal
- [ ] 360° panorama loads (not black screen)
- [ ] Can drag to look around
- [ ] Red hotspot markers are visible
- [ ] Can tap hotspots to navigate
- [ ] Mini-map shows in top right

### Optional (Physical Device Only)
- [ ] Gyroscope works (tilt device to look around)
- [ ] Device sensors permission granted

---

## 🎯 What to Test

### Test Flow 1: Browse Map
1. ✅ Open app
2. ✅ Tap "Map View"
3. ✅ See 5 destination pins
4. ✅ Tap each pin
5. ✅ Read destination info
6. ✅ Zoom in/out
7. ✅ Use "Center" button

### Test Flow 2: Virtual Tour
1. ✅ Tap a pin on map
2. ✅ Tap "Enter Virtual Tour"
3. ✅ Drag finger left/right/up/down
4. ✅ Look for red hotspot markers
5. ✅ Tap a hotspot
6. ✅ Watch transition to new viewpoint
7. ✅ Tap "Back to Map"

### Test Flow 3: Navigation
1. ✅ Enter virtual tour
2. ✅ Tap "🧭 Navigate" button
3. ✅ See list of viewpoints
4. ✅ Select a viewpoint
5. ✅ Jump to that location
6. ✅ Toggle mini-map on/off

---

## 🚨 Common Issues & Quick Fixes

### Issue: Map is blank/gray
**Fix:**
```bash
1. Check you added Google Maps API key
2. Run: npm start --clear
3. Check internet connection
4. Enable Maps SDK in Google Cloud Console
```

### Issue: No pins on map
**Fix:**
```bash
1. Check console for errors
2. Destinations need latitude/longitude
3. Sample data should have coordinates
4. Try restarting: npm start --clear
```

### Issue: "No Virtual Tour Available"
**Fix:**
```bash
1. Open App.js
2. Uncomment: seedPanoramaData();
3. Save and restart app
4. Check console for "Panorama data seeded"
```

### Issue: Black screen in 360° view
**Fix:**
```bash
1. Check panorama image URL is accessible
2. Try opening URL in browser
3. Check console for errors
4. Image must be equirectangular (2:1 ratio)
```

### Issue: Gyroscope not working
**Fix:**
```bash
1. Test on PHYSICAL device (not emulator)
2. Grant sensor permissions when prompted
3. Some devices don't have gyroscope
4. Touch controls still work without it
```

---

## 📱 Testing Tips

### Best Experience
- ✅ Test on **physical device** (not emulator)
- ✅ Use **good internet connection**
- ✅ Grant **location permissions**
- ✅ Grant **sensor permissions**
- ✅ Test in **landscape mode** too

### Device Requirements
- Android 5.0+ or iOS 10+
- GPS/Location services
- Internet connection
- Gyroscope (optional, for tilt controls)

---

## 🎨 See It In Action

### Expected Results

**Map View:**
```
┌─────────────────────────────────┐
│  [Back]    Destination Map      │
├─────────────────────────────────┤
│                                 │
│    📍 Taal Volcano              │
│         (Natural Wonder)        │
│                                 │
│  📍 Pagsanjan Falls             │
│      (Waterfall)                │
│                                 │
│    📍 Rizal Shrine              │
│        (Historical)             │
│                                 │
│  [🎯 Center] [📍 My Location]  │
│                                 │
│ [Legend: Natural Wonder 🟢]    │
│ [Historical Site 🟠 ...]       │
└─────────────────────────────────┘
```

**Info Modal (After Tapping Pin):**
```
┌─────────────────────────────────┐
│  [Image of Destination]         │
├─────────────────────────────────┤
│  Taal Volcano                   │
│  [Natural Wonder]               │
│                                 │
│  📍 Talisay, Batangas          │
│  ℹ️ An active volcano...       │
│                                 │
│  [🌐 Enter Virtual Tour]       │
│  [📖 View Full Details]        │
│  [✕ Close]                     │
└─────────────────────────────────┘
```

**360° View:**
```
┌─────────────────────────────────┐
│ ← Back    Taal Volcano          │
│           Main Entrance         │
├─────────────────────────────────┤
│                                 │
│     [360° Panorama Image]      │
│                                 │
│     👉 Red hotspots visible    │
│        (tap to navigate)        │
│                                 │
│  [Tour Map    📍📍]           │
│   in corner                     │
│                                 │
│ [🗺️ Map] [🧭 Navigate] [ℹ️]  │
│                                 │
│ 👆 Drag to look around         │
└─────────────────────────────────┘
```

---

## 📋 Sample Data Included

### 5 CALABARZON Destinations
1. **Taal Volcano** - Batangas (Natural Wonder)
2. **Pagsanjan Falls** - Laguna (Waterfall)
3. **Rizal Shrine** - Calamba, Laguna (Historical Site)
4. **Villa Escudero** - Tiaong, Quezon (Cultural Heritage)
5. **Mount Makiling** - Los Baños, Laguna (Natural Wonder)

Each destination includes:
- ✅ Coordinates (latitude/longitude)
- ✅ 2-3 panorama viewpoints
- ✅ Bidirectional connections
- ✅ Sample 360° images (placeholders)

---

## 🎯 Your First Virtual Tour

Let's test **Taal Volcano**:

1. **Open Map View**
   - Tap "Map View" on home screen
   - Map centers on CALABARZON

2. **Find Taal Volcano**
   - Look for pin in Batangas area
   - Or use search if implemented
   - Pin should be GREEN (Natural Wonder)

3. **View Info**
   - Tap the Taal Volcano pin
   - Modal shows image and details
   - See "Enter Virtual Tour" button

4. **Start Tour**
   - Tap "Enter Virtual Tour"
   - Wait for panorama to load (few seconds)
   - See 360° view of volcano

5. **Explore**
   - Drag around to look in all directions
   - Tilt device to use gyroscope
   - Look for RED hotspot markers

6. **Navigate**
   - Tap a red hotspot marker
   - Watch smooth transition
   - Arrive at new viewpoint
   - Repeat!

7. **Return**
   - Tap "← Back to Map"
   - Or tap "ℹ️ Info" for details
   - Or continue exploring

---

## 📊 Performance Check

### Good Performance Indicators
- ✅ Map loads in < 3 seconds
- ✅ Pins appear immediately
- ✅ Smooth zooming/panning
- ✅ Panorama loads in < 5 seconds
- ✅ 60 FPS rotation (no lag)
- ✅ Smooth hotspot animations

### If Performance is Slow
- Check internet speed
- Close other apps
- Test on newer device
- Reduce image quality (future)

---

## 🎓 Learn More

### Documentation
- `MAP_360_SETUP_GUIDE.md` - Detailed setup
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `WHATS_NEW.md` - Feature details
- `README.md` - Complete documentation

### Next Steps
1. ✅ Test all features
2. ✅ Read setup guide
3. ✅ Capture real 360° photos
4. ✅ Replace sample data
5. ✅ Share with users!

---

## ✅ Ready to Go?

If you've completed all steps above, you should have:
- ✅ App running
- ✅ Map loading with pins
- ✅ Virtual tour accessible
- ✅ Sample data working

**Now tap "Map View" and start exploring!** 🗺️🌐

---

## 🆘 Still Need Help?

### Quick Debugging
```bash
# Clear everything and start fresh
npm start --clear

# Check for errors in console
# Look for red error messages

# Verify files exist
ls screens/MapScreen.js
ls components/PanoramaViewer.js
```

### Where to Look
1. **Console logs** - Check terminal for errors
2. **Device console** - Check phone/emulator logs
3. **Network tab** - Verify images load
4. **Troubleshooting guide** - Read MAP_360_SETUP_GUIDE.md

---

**Excited to explore?** Open the app and tap **"Map View"**! 🚀

Questions? Check the documentation or review console errors.

**Happy exploring!** 🎉
