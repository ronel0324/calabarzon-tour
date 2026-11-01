# Virtual Tour & Cultural Mapping App - CALABARZON

A React Native mobile application for exploring local tourist destinations and cultural heritage sites in Region IV-A (CALABARZON), Philippines.

## Features

### Phase 1 Features
✅ **Destination Management (CRUD)**
- Add, view, edit, and delete destination records
- Full CRUD operations with SQLite database

✅ **Destination Information**
- Display destination name, description, address, category, and image
- Support for both local images and image URLs

✅ **Search and Filtering**
- Search destinations by name, description, or address
- Filter destinations by category (Natural Wonder, Historical Site, Cultural Heritage, etc.)

✅ **Navigation**
- Navigate between home screen, destination list, and destination details
- React Navigation with stack navigator

✅ **Database Integration**
- SQLite database using expo-sqlite
- Store and retrieve destination records persistently

### Phase 2 Features
✅ **Virtual Tour**
- Display destination photos, historical information, and cultural significance
- Rich detail view with comprehensive information

✅ **Educational Quiz**
- Multiple-choice quizzes related to each destination
- Automatic score calculation and display
- Interactive quiz interface

✅ **Progress Tracking**
- Record quiz scores and completed destinations
- View statistics (total attempts, completed destinations, average score)
- Filter progress by all or completed only

### Phase 3 Features (NEW!)
✅ **Interactive Map View**
- View all destinations on an interactive map
- Color-coded pins by category
- Tap pins to see destination information
- Zoom to user location
- Center on CALABARZON region

✅ **360° Virtual Tour**
- Immersive 360° panorama viewing
- Touch controls for panning and looking around
- Gyroscope support for device rotation
- Navigate between connected viewpoints
- "Walk" through destinations like Google Street View

✅ **Navigation System**
- Hot spots on panoramas for navigation
- Click to move between different viewpoints
- Mini-map showing current position
- Animated transitions between panoramas
- Return to map functionality

## Tech Stack

- **React Native** (via Expo)
- **React Navigation** (Native Stack Navigator)
- **Expo SQLite** (Database)
- **Expo Image Picker** (Image selection)
- **React Native Maps** (Interactive map with pins)
- **Expo Location** (GPS and location services)
- **Expo GL + Three.js** (3D rendering for 360° panoramas)
- **Expo Sensors** (Gyroscope support)
- **React Native Reanimated** (Smooth animations)

## Project Structure

```
VirtualTourCalabarzon/
├── App.js                          # Main app with navigation setup
├── services/
│   ├── database.js                 # Database service with all CRUD operations
│   └── seedPanoramaData.js        # Panorama data seeding utility
├── screens/
│   ├── HomeScreen.js              # Home/landing screen
│   ├── DestinationListScreen.js   # List all destinations with search/filter
│   ├── DestinationDetailScreen.js # View destination details and take quiz
│   ├── AddDestinationScreen.js    # Add new destination
│   ├── EditDestinationScreen.js   # Edit existing destination
│   ├── ProgressScreen.js          # View progress and statistics
│   ├── MapScreen.js               # NEW: Interactive map with pins
│   └── PanoramaViewScreen.js      # NEW: 360° panorama viewer
├── components/
│   └── PanoramaViewer.js          # NEW: 360° rendering component
├── package.json
├── README.md
└── MAP_360_SETUP_GUIDE.md         # NEW: Setup guide for map & 360° features
```

## Installation

1. **Prerequisites**
   - Node.js (v14 or higher)
   - npm or yarn
   - Expo CLI (optional)
   - Expo Go app on your mobile device (for testing)

2. **Install Dependencies**
   ```bash
   cd VirtualTourCalabarzon
   npm install
   ```

3. **Run the App**
   ```bash
   npm start
   ```

   This will start the Expo development server. You can then:
   - Scan the QR code with Expo Go app (Android)
   - Scan the QR code with Camera app (iOS)
   - Press `a` to open on Android emulator
   - Press `i` to open on iOS simulator (macOS only)
   - Press `w` to open in web browser

## Usage Guide

### Home Screen
- **Map View**: See all destinations on an interactive map (NEW!)
- Browse Destinations: View all destinations
- Add Destination: Contribute a new location
- My Progress: View your quiz scores and completed destinations

### Destination Management
1. **Add Destination**
   - Enter destination name, description, and address (required)
   - Select a category
   - Add optional historical information and cultural significance
   - Upload an image or enter an image URL

2. **View Destinations**
   - Browse all destinations in a card layout
   - Use the search bar to find specific destinations
   - Filter by category using the category buttons

3. **View Destination Details**
   - See full information including historical and cultural details
   - View your progress if you've taken the quiz

4. **Edit/Delete Destinations**
   - Edit button on destination cards or detail page
   - Delete button on destination cards with confirmation

### Educational Quizzes
1. Navigate to a destination's detail page
2. Tap "Take Quiz" button
3. Answer multiple-choice questions
4. Get instant results with score and percentage
5. Progress is automatically saved
6. Destinations are marked as "Completed" when you achieve 60% or higher

### Progress Tracking
- View statistics dashboard (attempts, completed, average score)
- Toggle between all progress and completed only
- Tap on any progress item to revisit the destination

### Interactive Map (NEW!)
1. Open Map View from home screen
2. See all destinations as colored pins on the map
3. Tap any pin to view destination information
4. Tap "Enter Virtual Tour" to start 360° experience
5. Use map controls to zoom and navigate

### 360° Virtual Tour (NEW!)
1. From map, tap a pin and select "Enter Virtual Tour"
2. View immersive 360° panorama
3. Drag to look around or tilt your device (gyroscope)
4. Look for red hotspot markers
5. Tap hotspots to "walk" to different viewpoints
6. Use mini-map to see your position
7. Navigate back to map or view full destination details

## Database Schema

### Destinations Table
```sql
id, name, description, address, category, image, 
historical_info, cultural_significance, latitude, longitude, created_at
```

### Quiz Questions Table
```sql
id, destination_id, question, option_a, option_b, 
option_c, option_d, correct_answer
```

### User Progress Table
```sql
id, destination_id, quiz_score, completed, completed_at
```

### Panorama Points Table (NEW!)
```sql
id, destination_id, name, panorama_image, latitude, longitude, 
rotation, is_entry_point, created_at
```

### Panorama Connections Table (NEW!)
```sql
id, from_point_id, to_point_id, hotspot_x, hotspot_y, 
direction_angle, label
```

## Sample Data

The app comes pre-loaded with 5 sample destinations from CALABARZON:
1. **Taal Volcano** (Batangas) - Natural Wonder
2. **Pagsanjan Falls** (Laguna) - Waterfall
3. **Rizal Shrine** (Calamba, Laguna) - Historical Site
4. **Villa Escudero** (Tiaong, Quezon) - Cultural Heritage
5. **Mount Makiling** (Los Baños, Laguna) - Natural Wonder

Each destination includes sample quiz questions for testing.

## Categories

- Natural Wonder
- Historical Site
- Cultural Heritage
- Waterfall
- Beach
- Mountain
- Museum
- Other

## Future Enhancements (Potential Phase 4)

- AR features with 3D models
- Social sharing capabilities
- User accounts and cloud sync
- Photo galleries for destinations
- Comments and ratings system
- Offline map and panorama caching
- Push notifications for new destinations
- Admin panel for content moderation
- Audio guides for destinations
- Multi-language support
- Route planning between destinations
- Achievement badges and gamification

## Troubleshooting

**Database not initializing?**
- Check console for error messages
- Try clearing app data and restarting

**Images not showing?**
- Ensure image URLs are valid and accessible
- Check network permissions for loading external images

**Navigation not working?**
- Verify React Navigation packages are installed correctly
- Check console for navigation errors

**Map not loading?**
- Add your Google Maps API key in `app.json`
- Enable Maps SDK in Google Cloud Console
- Restart expo with `npm start --clear`

**360° view not working?**
- Ensure panorama image is equirectangular format (2:1 ratio)
- Check that image URL is accessible
- Test on physical device for gyroscope support

**For detailed setup instructions, see `MAP_360_SETUP_GUIDE.md`**

## Credits

Developed for educational purposes as part of the Virtual Tour & Cultural Mapping App project focusing on Region IV-A (CALABARZON), Philippines.

Reference: [National Museum of Fine Arts](https://nmfa.nationalmuseum.gov.ph/)

## License

This project is created for educational purposes.

---

**Note:** This app is designed as an alternative to traditional educational field trips, allowing students and tourists to explore CALABARZON's cultural heritage digitally.
