# Setup Guide - Virtual Tour CALABARZON App

## Quick Start

### For Windows Users

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Choose LTS version (recommended)
   - Verify installation:
     ```powershell
     node --version
     npm --version
     ```

2. **Install Dependencies**
   ```powershell
   cd VirtualTourCalabarzon
   npm install
   ```

3. **Run the Application**
   ```powershell
   npm start
   ```

4. **Test the App**
   - **On Phone (Recommended for mobile app):**
     1. Install "Expo Go" app from Play Store (Android) or App Store (iOS)
     2. Scan the QR code shown in terminal or browser
     3. App will load on your device
   
   - **On Computer:**
     - Press `w` in terminal to open in web browser
     - Press `a` for Android emulator (requires Android Studio)
     - Press `i` for iOS simulator (macOS only)

## Detailed Setup Instructions

### Prerequisites

#### 1. Node.js and npm
- **Required:** Node.js v14 or higher
- **Download:** https://nodejs.org/
- **Verify:**
  ```powershell
  node --version  # Should show v14.x.x or higher
  npm --version   # Should show 6.x.x or higher
  ```

#### 2. Mobile Device Setup (Recommended)

**For Android:**
1. Install "Expo Go" from Google Play Store
2. Enable "Stay awake" in Developer Options (optional but helpful)
3. Connect to same WiFi network as your computer

**For iOS:**
1. Install "Expo Go" from App Store
2. Connect to same WiFi network as your computer

#### 3. Emulator Setup (Optional)

**Android Emulator:**
1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio > More Actions > Virtual Device Manager
3. Create a new virtual device (Pixel 5 recommended)
4. Start emulator before running `npm start`

**iOS Simulator (macOS only):**
1. Install Xcode from Mac App Store
2. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```

### Installation Steps

1. **Navigate to Project Directory**
   ```powershell
   cd "C:\Users\weji\Desktop\Virtual Tour & Cultural Mapping App\VirtualTourCalabarzon"
   ```

2. **Install Dependencies**
   ```powershell
   npm install
   ```
   
   This will install:
   - React Native and Expo
   - React Navigation
   - SQLite database
   - Image Picker
   - All required dependencies

3. **Start Development Server**
   ```powershell
   npm start
   ```
   
   Or alternatively:
   ```powershell
   npx expo start
   ```

4. **Choose Platform**
   - Press `a` for Android
   - Press `i` for iOS (macOS only)
   - Press `w` for web
   - Scan QR code with Expo Go app

## Testing the Application

### Initial Launch
When you first run the app, it will:
1. Create the SQLite database
2. Set up tables (destinations, quiz_questions, user_progress)
3. Load 5 sample destinations from CALABARZON
4. Create sample quiz questions

### Features to Test

#### 1. Browse Destinations
- Go to "Browse Destinations" from home
- View pre-loaded sample destinations
- Try the search bar
- Filter by different categories

#### 2. Add New Destination
- Click "Add Destination" from home
- Fill in required fields (name, description, address)
- Select a category
- Add an image (upload or URL)
- Add optional historical info
- Submit and verify it appears in the list

#### 3. View Details
- Click on any destination card
- View full information
- See historical and cultural significance

#### 4. Take Quiz
- From destination details, click "Take Quiz"
- Answer all questions
- View your score
- Check progress tracking

#### 5. Edit/Delete
- Edit a destination and save changes
- Delete a destination (with confirmation)

#### 6. Progress Tracking
- Go to "My Progress" from home
- View statistics
- Toggle between all progress and completed
- Click progress items to revisit destinations

## Troubleshooting

### Common Issues

#### Issue: "npm: command not found"
**Solution:** Node.js not installed or not in PATH
1. Reinstall Node.js
2. Restart terminal/PowerShell
3. Verify: `node --version`

#### Issue: "Cannot find module"
**Solution:** Dependencies not installed
```powershell
npm install
```

#### Issue: "Metro bundler failed to start"
**Solution:** Clear cache and restart
```powershell
npx expo start --clear
```

#### Issue: "Unable to connect to Expo Go"
**Solution:** Network connectivity
1. Ensure phone and computer on same WiFi
2. Try tunnel mode: `npx expo start --tunnel`
3. Check firewall settings

#### Issue: Database not initializing
**Solution:** 
1. Close and restart the app
2. Check console for errors
3. In Expo Go, clear app data:
   - Android: Long press app icon > App info > Clear data
   - iOS: Delete and reinstall Expo Go

#### Issue: Images not displaying
**Solution:**
1. Check internet connection for URL images
2. Use placeholder URLs (already provided in sample data)
3. Try uploading local images using image picker

### Performance Tips

1. **Development Mode:**
   - Dev mode is slower than production build
   - Use physical device for best performance
   - Emulators are slower

2. **Database:**
   - SQLite is initialized on first run
   - Data persists between app restarts
   - Clear app data to reset database

3. **Hot Reloading:**
   - Save files to see changes instantly
   - Shake device to open developer menu
   - Press `r` in terminal to reload

## Development Workflow

### Making Changes

1. **Edit Screen Components**
   - Files in `screens/` directory
   - Save to see hot reload

2. **Modify Database**
   - Edit `services/database.js`
   - May need to clear app data to see schema changes

3. **Add New Screens**
   - Create new file in `screens/`
   - Import in `App.js`
   - Add to Stack Navigator

4. **Styling**
   - Each screen has its own StyleSheet
   - Modify styles at bottom of screen files

### Testing Changes

1. Save file
2. Wait for hot reload (or press `r` in terminal)
3. Test functionality on device
4. Check console for errors

## Building for Production

### Android APK

```powershell
npx expo build:android
```

Or use EAS Build (recommended):
```powershell
npm install -g eas-cli
eas build --platform android
```

### iOS Build (macOS required)

```powershell
npx expo build:ios
```

Or:
```powershell
eas build --platform ios
```

## Project Structure Reference

```
VirtualTourCalabarzon/
├── App.js                          # Main entry point
├── services/
│   └── database.js                 # Database operations
├── screens/
│   ├── HomeScreen.js              # Landing page
│   ├── DestinationListScreen.js   # Browse destinations
│   ├── DestinationDetailScreen.js # View details & quiz
│   ├── AddDestinationScreen.js    # Add new destination
│   ├── EditDestinationScreen.js   # Edit destination
│   └── ProgressScreen.js          # Progress tracking
├── assets/                         # Images and fonts
├── node_modules/                   # Dependencies
├── package.json                    # Project config
└── README.md                       # Documentation
```

## Useful Commands

```powershell
# Start development server
npm start

# Clear cache and start
npx expo start --clear

# Run on specific platform
npm run android
npm run ios
npm run web

# Install new package
npm install package-name

# Check for updates
npx expo-cli upgrade

# View logs
# (Just look at terminal output)
```

## Environment

- **Operating System:** Windows
- **Shell:** PowerShell
- **Node Version:** Check with `node --version`
- **Expo SDK:** 58

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Docs](https://reactnative.dev/)
- [SQLite Reference](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## Getting Help

If you encounter issues:
1. Check this guide first
2. Read error messages in console
3. Search [Expo Forums](https://forums.expo.dev/)
4. Check [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

## Next Steps

After setup is complete:
1. Explore the app on your device
2. Test all features
3. Add your own destinations
4. Customize UI/styling
5. Add more quiz questions
6. Extend functionality

---

**Happy Coding! 🚀**
