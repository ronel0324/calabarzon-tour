import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const COLORS = {
  taal: '#0E3B43',
  paper: '#F5F6F1',
  white: '#FFFFFF',
  gold: '#D9A441',
  goldDeep: '#A87A1C',
  leaf: '#3F7D4E',
  leafSoft: '#E3EEE5',
  ink: '#1D2A2E',
  muted: '#5C6A6D',
  line: '#E1E3DA'
};

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif'
});

// Ayusin kung iba ang spelling ng province sa destinations.province mo
const PROVINCES = [
  { key: 'Cavite', icon: '🏛️', tagline: 'Cradle of Philippine independence' },
  { key: 'Laguna', icon: '♨️', tagline: 'Hot springs, lakes, and Rizal\'s Calamba' },
  { key: 'Batangas', icon: '🌋', tagline: 'Taal volcano and coastal heritage' },
  { key: 'Rizal', icon: '⛰️', tagline: 'Art, mountains, and Angono' },
  { key: 'Quezon', icon: '🌴', tagline: 'Pahiyas, beaches, and forests' }
];

const norm = (s) => String(s || '').trim().toLowerCase();

export default function QuizProvincesScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    const [qRes, aRes] = await Promise.all([
      supabase.from('quiz_questions').select('id, destinations!inner(province)'),
      supabase.from('quiz_answers').select('question_id, is_correct').eq('user_id', user.id)
    ]);

    if (qRes.error || aRes.error) {
      setError((qRes.error || aRes.error).message);
      setLoading(false);
      return;
    }

    const answerMap = new Map(aRes.data.map((a) => [a.question_id, a.is_correct]));
    const next = {};
    PROVINCES.forEach((p) => (next[norm(p.key)] = { total: 0, answered: 0, correct: 0 }));

    qRes.data.forEach((q) => {
      const d = Array.isArray(q.destinations) ? q.destinations[0] : q.destinations;
      const bucket = next[norm(d?.province)];
      if (!bucket) return;
      bucket.total += 1;
      if (answerMap.has(q.id)) {
        bucket.answered += 1;
        if (answerMap.get(q.id)) bucket.correct += 1;
      }
    });

    setStats(next);
    setLoading(false);
  }, [user?.id]);

  // Mag-refresh tuwing babalik sa screen (pagkatapos mag-quiz)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Choose a province</Text>
        <Text style={styles.sub}>
          Your answers are saved as you go. Leave anytime and continue where you stopped.
        </Text>

        {loading ? (
          <ActivityIndicator color={COLORS.taal} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          PROVINCES.map((p) => {
            const s = stats[norm(p.key)] || { total: 0, answered: 0, correct: 0 };
            const pct = s.total ? s.answered / s.total : 0;
            const done = s.total > 0 && s.answered === s.total;
            const started = s.answered > 0 && !done;
            const empty = s.total === 0;

            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.card, empty && { opacity: 0.55 }]}
                activeOpacity={0.85}
                disabled={empty}
                onPress={() => navigation.navigate('QuizPlay', { province: p.key })}
                accessibilityRole="button"
                accessibilityLabel={`${p.key} quiz`}
              >
                <View style={styles.medallion}>
                  <Text style={styles.icon}>{p.icon}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{p.key}</Text>
                  <Text style={styles.cardTagline}>{p.tagline}</Text>

                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                  </View>
                  <Text style={styles.cardMeta}>
                    {empty
                      ? 'No questions yet'
                      : `${s.answered} / ${s.total} answered · ${s.correct} correct`}
                  </Text>
                </View>
                {!empty && (
                  <Text style={styles.action}>{done ? 'Done' : started ? 'Resume' : 'Start'}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontFamily: SERIF, fontSize: 26, fontWeight: '700', color: COLORS.ink },
  sub: { fontSize: 14, lineHeight: 20, color: COLORS.muted, marginTop: 6, marginBottom: 20 },
  error: { color: '#B8372F', marginTop: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 12
  },
  medallion: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  icon: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', color: COLORS.ink },
  cardTagline: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.line,
    marginTop: 10,
    overflow: 'hidden'
  },
  barFill: { height: '100%', backgroundColor: COLORS.leaf },
  cardMeta: { fontSize: 12, color: COLORS.muted, marginTop: 6 },
  action: { fontSize: 13, fontWeight: '700', color: COLORS.goldDeep, marginLeft: 8 }
});
