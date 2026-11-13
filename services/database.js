import { supabase, IMAGE_BUCKET } from './supabase';

// Pareho pa rin ang pangalan ng mga function kaya hindi na kailangang galawin ang mga screen.

// Hindi na kailangan ng local db; ang mga table ay ginawa na sa Supabase (setup.sql)
export const getDb = () => supabase;
export const initDatabase = async () => {
  console.log('Using Supabase (cloud database)');
};

// ---------- Image upload ----------

const isLocalUri = (uri) =>
  typeof uri === 'string' &&
  (uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('blob:') ||
    uri.startsWith('data:') ||
    uri.startsWith('ph:') ||
    uri.startsWith('assets-library:'));

const guessType = (uri, headerType) => {
  if (headerType && headerType.startsWith('image/')) return headerType;
  const lower = (uri || '').split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
};

// Nag-uupload ng larawan sa Supabase Storage at nagbabalik ng public URL
export const uploadImage = async (uri) => {
  const res = await fetch(uri);
  const arrayBuffer = await res.arrayBuffer();
  const contentType = guessType(uri, res.headers.get('content-type'));
  const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// Kung local ang larawan (galing sa image picker), i-upload muna. Kung URL na, ibalik lang.
const ensureRemoteImage = async (image) => {
  if (!image) return image;
  if (isLocalUri(image)) return await uploadImage(image);
  return image;
};

// ---------- Destinations ----------

export const addDestination = async (destination) => {
  try {
    const image = await ensureRemoteImage(destination.image);
    const { data, error } = await supabase
      .from('destinations')
      .insert({
        name: destination.name,
        description: destination.description,
        address: destination.address,
        category: destination.category,
        image,
        historical_info: destination.historical_info || '',
        cultural_significance: destination.cultural_significance || '',
        latitude: destination.latitude || null,
        longitude: destination.longitude || null
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding destination:', error);
    throw error;
  }
};

export const getAllDestinations = async () => {
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting destinations:', error);
    return [];
  }
};

export const getDestinationById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting destination:', error);
    return null;
  }
};

export const updateDestination = async (id, destination) => {
  try {
    const image = await ensureRemoteImage(destination.image);
    const { error } = await supabase
      .from('destinations')
      .update({
        name: destination.name,
        description: destination.description,
        address: destination.address,
        category: destination.category,
        image,
        historical_info: destination.historical_info || '',
        cultural_significance: destination.cultural_significance || '',
        latitude: destination.latitude || null,
        longitude: destination.longitude || null
      })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating destination:', error);
    throw error;
  }
};

export const deleteDestination = async (id) => {
  try {
    const { error } = await supabase.from('destinations').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting destination:', error);
    throw error;
  }
};

export const searchDestinations = async (query) => {
  try {
    // Tanggalin ang mga karakter na sumisira sa filter syntax
    const q = query.trim().replace(/[,()%*]/g, ' ');
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching destinations:', error);
    return [];
  }
};

// Gumagana sa multi-category (hal. "Beach, Mountain")
export const filterDestinationsByCategory = async (category) => {
  try {
    const all = await getAllDestinations();
    return all.filter((d) =>
      (d.category || '')
        .split(',')
        .map((c) => c.trim())
        .includes(category)
    );
  } catch (error) {
    console.error('Error filtering destinations:', error);
    return [];
  }
};

// ---------- Quiz ----------

export const addQuizQuestion = async (question) => {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        destination_id: question.destination_id,
        question: question.question,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding quiz question:', error);
    throw error;
  }
};

export const getQuizQuestionsByDestination = async (destinationId) => {
  try {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('destination_id', destinationId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting quiz questions:', error);
    return [];
  }
};

export const saveQuizAnswers = async (answers) => {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const rows = answers.map((a) => ({ user_id: userId, ...a }));
  const { error } = await supabase
    .from('quiz_answers')
    .upsert(rows, { onConflict: 'user_id,question_id', ignoreDuplicates: true });
  if (error) throw error;
  return true;
};

// Mga sagot ng kasalukuyang user para sa listahan ng tanong
export const getQuizAnswersForQuestions = async (questionIds) => {
  if (!questionIds.length) return [];
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('quiz_answers')
    .select('question_id, selected_answer, is_correct')
    .eq('user_id', userId)
    .in('question_id', questionIds);
  if (error) throw error;
  return data || [];
};


// ---------- Sample data ----------

export const seedSampleData = async () => {
  try {
    const { count, error: countError } = await supabase
      .from('destinations')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;
    if (count && count > 0) {
      console.log('Sample data already exists');
      return;
    }

    const sampleDestinations = [
      {
        name: 'Taal Volcano',
        description: 'An active volcano located on an island in the middle of Taal Lake.',
        address: 'Talisay, Batangas',
        category: 'Natural Wonder',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Taal_Volcano_aerial.jpg/800px-Taal_Volcano_aerial.jpg',
        historical_info: 'Taal Volcano has erupted several times throughout history, with the most devastating eruption occurring in 1911.',
        cultural_significance: 'Considered one of the most iconic landmarks in the Philippines and a symbol of natural beauty and power.',
        latitude: 14.0091,
        longitude: 120.9931
      },
      {
        name: 'Pagsanjan Falls',
        description: 'A stunning waterfall accessed by a thrilling boat ride through rapids.',
        address: 'Cavinti, Laguna',
        category: 'Waterfall',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Pagsanjan_Falls.jpg/800px-Pagsanjan_Falls.jpg',
        historical_info: 'The falls were featured in the 1979 film "Apocalypse Now" and have been a popular tourist destination for decades.',
        cultural_significance: 'A testament to the natural beauty of Laguna province and an important eco-tourism site.',
        latitude: 14.2655556,
        longitude: 121.4886111
      },
      {
        name: 'Rizal Shrine',
        description: 'The ancestral home of Philippine national hero Dr. Jose Rizal.',
        address: 'Calamba, Laguna',
        category: 'Historical Site',
        image: 'https://via.placeholder.com/800x600?text=Rizal+Shrine',
        historical_info: 'Built in 1950, this shrine preserves the memory and artifacts of Jose Rizal, who was born here in 1861.',
        cultural_significance: 'A pilgrimage site for Filipinos honoring the national hero and his contributions to Philippine independence.',
        latitude: 14.2136474,
        longitude: 121.1667211
      },
      {
        name: 'Villa Escudero',
        description: 'A working coconut plantation offering cultural shows and unique dining experiences.',
        address: 'Tiaong, Quezon',
        category: 'Cultural Heritage',
        image: 'https://via.placeholder.com/800x600?text=Villa+Escudero',
        historical_info: 'Established in the 1880s by the Escudero family as a coconut plantation.',
        cultural_significance: 'Showcases traditional Filipino culture, crafts, and rural lifestyle.',
        latitude: 13.995773,
        longitude: 121.3418705
      },
      {
        name: 'Mount Makiling',
        description: 'A dormant volcano and popular hiking destination with rich biodiversity.',
        address: 'Los Baños, Laguna',
        category: 'Natural Wonder',
        image: 'https://via.placeholder.com/800x600?text=Mount+Makiling',
        historical_info: 'Named after the legendary Maria Makiling, a mountain diwata (fairy) in Filipino folklore.',
        cultural_significance: 'Sacred to locals and an important conservation area for endemic species.',
        latitude: 14.1364,
        longitude: 121.1956
      }
    ];

    for (const dest of sampleDestinations) {
      const destId = await addDestination(dest);

      const sampleQuestions = [
        {
          destination_id: destId,
          question: `What is the main category of ${dest.name}?`,
          option_a: dest.category,
          option_b: 'Museum',
          option_c: 'Restaurant',
          option_d: 'Shopping Mall',
          correct_answer: 'A'
        },
        {
          destination_id: destId,
          question: `Where is ${dest.name} located?`,
          option_a: 'Manila',
          option_b: dest.address,
          option_c: 'Cebu',
          option_d: 'Davao',
          correct_answer: 'B'
        }
      ];

      for (const q of sampleQuestions) {
        await addQuizQuestion(q);
      }
    }

    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
};

// ---------- Panorama points ----------

export const addPanoramaPoint = async (point) => {
  try {
    const panorama_image = await ensureRemoteImage(point.panorama_image);
    const { data, error } = await supabase
      .from('panorama_points')
      .insert({
        destination_id: point.destination_id,
        name: point.name,
        panorama_image,
        latitude: point.latitude || null,
        longitude: point.longitude || null,
        rotation: point.rotation || 0,
        is_entry_point: point.is_entry_point ? 1 : 0
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding panorama point:', error);
    throw error;
  }
};

export const getPanoramaPointsByDestination = async (destinationId) => {
  try {
    const { data, error } = await supabase
      .from('panorama_points')
      .select('*')
      .eq('destination_id', destinationId)
      .order('is_entry_point', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting panorama points:', error);
    return [];
  }
};

export const getEntryPanoramaPoint = async (destinationId) => {
  try {
    const { data, error } = await supabase
      .from('panorama_points')
      .select('*')
      .eq('destination_id', destinationId)
      .eq('is_entry_point', 1)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting entry panorama point:', error);
    return null;
  }
};

export const getPanoramaPointById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('panorama_points')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting panorama point:', error);
    return null;
  }
};

// ---------- Panorama connections ----------

export const addPanoramaConnection = async (connection) => {
  try {
    const { data, error } = await supabase
      .from('panorama_connections')
      .insert({
        from_point_id: connection.from_point_id,
        to_point_id: connection.to_point_id,
        hotspot_x: connection.hotspot_x,
        hotspot_y: connection.hotspot_y,
        direction_angle: connection.direction_angle || 0,
        label: connection.label || ''
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding panorama connection:', error);
    throw error;
  }
};

export const getPanoramaConnections = async (fromPointId) => {
  try {
    const { data, error } = await supabase
      .from('panorama_connections')
      .select('*, to_point:panorama_points!to_point_id(name, panorama_image)')
      .eq('from_point_id', fromPointId);
    if (error) throw error;
    return (data || []).map(({ to_point, ...conn }) => ({
      ...conn,
      to_point_name: to_point?.name,
      to_point_image: to_point?.panorama_image
    }));
  } catch (error) {
    console.error('Error getting panorama connections:', error);
    return [];
  }
};

export const deletePanoramaConnection = async (id) => {
  try {
    const { error } = await supabase
      .from('panorama_connections')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting panorama connection:', error);
    throw error;
  }
};

// ---------- Panorama seeding ----------

const countPanoramaPoints = async (destinationId) => {
  const { count, error } = await supabase
    .from('panorama_points')
    .select('id', { count: 'exact', head: true })
    .eq('destination_id', destinationId);
  if (error) throw error;
  return count || 0;
};

const seedSinglePanorama = async (destName, imageKey, pointName) => {
  const { data: dest, error } = await supabase
    .from('destinations')
    .select('id')
    .ilike('name', `%${destName}%`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!dest) {
    console.log(destName + ' destination not found');
    return;
  }
  if ((await countPanoramaPoints(dest.id)) > 0) return;

  await addPanoramaPoint({
    destination_id: dest.id,
    name: pointName,
    panorama_image: imageKey,
    rotation: 0,
    is_entry_point: true
  });
};

export const seedPanoramaData = async () => {
  try {
    // --- Rizal Shrine (2 points at may hotspots) ---
    const { data: rizal, error } = await supabase
      .from('destinations')
      .select('id')
      .eq('name', 'Rizal Shrine')
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    if (rizal && (await countPanoramaPoints(rizal.id)) === 0) {
      const entranceId = await addPanoramaPoint({
        destination_id: rizal.id,
        name: 'Shrine Entrance',
        panorama_image: 'RIZALSHRINE',
        rotation: 0,
        is_entry_point: true
      });
      const streetId = await addPanoramaPoint({
        destination_id: rizal.id,
        name: 'Across the Street',
        panorama_image: 'RIZALSHRINE',
        rotation: 180,
        is_entry_point: false
      });
      await addPanoramaConnection({
        from_point_id: entranceId,
        to_point_id: streetId,
        hotspot_x: 0.5,
        hotspot_y: 0.55,
        label: 'Go to street'
      });
      await addPanoramaConnection({
        from_point_id: streetId,
        to_point_id: entranceId,
        hotspot_x: 0.0,
        hotspot_y: 0.55,
        label: 'Back to entrance'
      });
    }

    await seedSinglePanorama('Malagonlong', 'MALAGONLONG', 'Main View'); // <-- palitan ang pangalan
    await seedSinglePanorama('Taal', 'TAAL', 'Main View');
    await seedSinglePanorama('Makiling', 'MAKILINGPK2', 'Main View');
    await seedSinglePanorama('Pagsanjan falls', 'PAGSANJANFALLS', 'Main View');

    console.log('Panorama data seeded successfully');
  } catch (error) {
    console.error('Error seeding panorama data:', error);
  }
};

// I-paste sa dulo ng services/database.js
// Ipinapalagay na may `supabase` client ka nang naka-import sa file na iyon.
// Kung iba ang pangalan (hal. `supabaseClient`), palitan lang.

export const getInfoHotspotsByPoint = async (pointId) => {
  const { data, error } = await supabase
    .from('panorama_hotspots')
    .select('*')
    .eq('panorama_point_id', pointId)
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addInfoHotspot = async ({
  panorama_point_id,
  yaw,
  pitch,
  title,
  description,
  image_url,
}) => {
  const { data, error } = await supabase
    .from('panorama_hotspots')
    .insert([{ panorama_point_id, yaw, pitch, title, description, image_url }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateInfoHotspot = async (id, fields) => {
  const { data, error } = await supabase
    .from('panorama_hotspots')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteInfoHotspot = async (id) => {
  const { error } = await supabase
    .from('panorama_hotspots')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updatePanoramaPointImage = async (id, image) => {
  try {
    const panorama_image = await ensureRemoteImage(image);
    const { error } = await supabase
      .from('panorama_points')
      .update({ panorama_image })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating panorama point:', error);
    throw error;
  }
};

export default getDb;