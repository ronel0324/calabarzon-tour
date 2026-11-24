import {
  getAllDestinations,
  addPanoramaPoint,
  addPanoramaConnection,
  getPanoramaPointsByDestination
} from './database';

export const seedPanoramaData = () => {
  try {
    const destinations = getAllDestinations();

    const samplePanoramaUrls = [
      'https://cdn.pixabay.com/photo/2019/11/03/20/11/philippines-4599306_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/12/15/13/51/polynesia-3021072_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/08/22/11/56/cinque-terre-2668442_1280.jpg',
      'https://cdn.pixabay.com/photo/2018/04/25/09/26/eiffel-tower-3349075_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/02/08/17/24/fantasy-2049567_1280.jpg',
    ];

    destinations.forEach((dest, index) => {
      const existingPoints = getPanoramaPointsByDestination(dest.id);
      if (existingPoints.length > 0) {
        console.log(`Panorama points already exist for ${dest.name}`);
        return;
      }

      const pointsCount = 2 + Math.floor(Math.random() * 2);
      const createdPointIds = [];

      for (let i = 0; i < pointsCount; i++) {
        const point = {
          destination_id: dest.id,
          name: i === 0 ? 'Main Entrance' : `Viewpoint ${i}`,
          panorama_image: samplePanoramaUrls[index % samplePanoramaUrls.length],
          latitude: dest.latitude + (Math.random() - 0.5) * 0.001, // Slight offset
          longitude: dest.longitude + (Math.random() - 0.5) * 0.001,
          rotation: 0,
          is_entry_point: i === 0 ? 1 : 0
        };

        const pointId = addPanoramaPoint(point);
        createdPointIds.push(pointId);
        console.log(`Created panorama point: ${point.name} for ${dest.name}`);
      }

      for (let i = 0; i < createdPointIds.length - 1; i++) {
        const connection = {
          from_point_id: createdPointIds[i],
          to_point_id: createdPointIds[i + 1],
          hotspot_x: 0.5 + (Math.random() - 0.5) * 0.3,
          hotspot_y: 0.5,
          direction_angle: 90,
          label: `Walk to ${i === 0 ? 'Viewpoint 1' : `Viewpoint ${i + 1}`}`
        };
        addPanoramaConnection(connection);

        const backConnection = {
          from_point_id: createdPointIds[i + 1],
          to_point_id: createdPointIds[i],
          hotspot_x: 0.5 + (Math.random() - 0.5) * 0.3,
          hotspot_y: 0.5,
          direction_angle: 270,
          label: i === 0 ? 'Return to Entrance' : `Return to Viewpoint ${i}`
        };
        addPanoramaConnection(backConnection);

        console.log(`Created connections for ${dest.name}`);
      }
    });

    console.log('✅ Panorama data seeded successfully!');
    console.log('📝 NOTE: Sample panorama images are placeholders.');
    console.log('   For production, replace with real 360° equirectangular images.');
  } catch (error) {
    console.error('Error seeding panorama data:', error);
  }
};
