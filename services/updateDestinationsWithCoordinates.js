import { getAllDestinations, updateDestination } from './database';

/**
 * Update existing destinations with coordinates
 * Run this once if your destinations don't have coordinates
 */
export const updateDestinationsWithCoordinates = async () => {
  try {
    const destinations = await getAllDestinations();
    console.log('🔄 Updating destinations with coordinates...');
    
    // Coordinates for CALABARZON destinations
    const coordinates = {
      'Taal Volcano': { latitude: 14.0091, longitude: 120.9931 },
      'Pagsanjan Falls': { latitude: 14.2655556, longitude: 121.4886111 },
      'Rizal Shrine': { latitude: 14.2136474, longitude: 121.1667211 },
      'Villa Escudero': { latitude: 13.995773, longitude: 121.3418705 },
      'Mount Makiling': { latitude: 14.1364, longitude: 121.1956 }
    };

    let updated = 0;
    for (const dest of destinations) {
      const coords = coordinates[dest.name];
      if (coords) {
        // Update coordinates (force update to fix incorrect ones)
        const needsUpdate = !dest.latitude || !dest.longitude || 
                           (dest.name === 'Villa Escudero' && dest.latitude !== 13.995773) ||
                           (dest.name === 'Pagsanjan Falls' && dest.latitude !== 14.2655556) ||
                           (dest.name === 'Rizal Shrine' && dest.latitude !== 14.2136474);
        
        if (needsUpdate) {
          await updateDestination(dest.id, {
            ...dest,
            address: dest.name === 'Pagsanjan Falls' ? 'Cavinti, Laguna' : dest.address,
            latitude: coords.latitude,
            longitude: coords.longitude
          });
          console.log(`✅ Updated ${dest.name}: (${coords.latitude}, ${coords.longitude})`);
          updated++;
        } else {
          console.log(`✓ ${dest.name} coordinates OK: (${dest.latitude}, ${dest.longitude})`);
        }
      } else {
        console.log(`⚠️ No coordinates found for ${dest.name}`);
      }
    }

    console.log(`\n✅ Updated ${updated} destinations with coordinates`);
    return updated;
  } catch (error) {
    console.error('Error updating destinations:', error);
    return 0;
  }
};
