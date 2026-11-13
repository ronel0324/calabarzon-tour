import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SERIF } from '../theme';
// Ayusin ang path na ito kung nasaan ang Supabase client mo
import { supabase } from '../services/supabase';

const TOP = 20;
const MEDALS = ['🥇', '🥈', '🥉'];

const nameOf = (r) => (r.username?.trim() ? `@${r.username.trim()}` : r.full_name?.trim() || 'Player');

const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '–');

function Row({ rank, row, isMe }) {
  const name = nameOf(row);
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={styles.rank}>{rank <= 3 ? MEDALS[rank - 1] : rank}</Text>
      <View style={styles.avatar}>
        {row.avatar_url ? (
          <Image source={{ uri: row.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarInitial}>{name.replace('@', '').charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
          {isMe ? '  (you)' : ''}
        </Text>
        <Text style={styles.breakdown}>
          {row.game_points} game + {row.quiz_correct} quiz = {row.points} pts
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          Game {row.wins}/{row.plays} ({pct(row.wins, row.plays)}) · Quiz {row.quiz_correct}/
          {row.quiz_answered} ({pct(row.quiz_correct, row.quiz_answered)})
        </Text>
      </View>
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{row.points}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: err } = await supabase.rpc('get_leaderboard', { lim: 500 });
    if (err) setError(err.message);
    else setRows(data || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const myIndex = rows.findIndex((r) => r.user_id === user?.id);
  const top = rows.slice(0, TOP);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.caption}>
          Points come from your best round on each place (5 for a first-try win, down to 1), plus 1
          point for every correct quiz answer.
        </Text>
        <View style={styles.goldRule} />

        {loading ? (
          <ActivityIndicator color={COLORS.taal} style={{ marginTop: 30 }} />
        ) : error ? (
          <Text style={styles.empty}>Could not load the leaderboard. {error}</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>No scores yet. Play a round or answer a quiz to be the first on the board.</Text>
        ) : (
          <View style={styles.list}>
            {top.map((r, i) => (
              <View key={r.user_id} style={i > 0 && styles.divider}>
                <Row rank={i + 1} row={r} isMe={r.user_id === user?.id} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ranggo mo, kung wala ka sa top 20 */}
      {!loading && !error && rows.length > 0 && (
        <View style={styles.footer}>
          {myIndex >= TOP ? (
            <Row rank={myIndex + 1} row={rows[myIndex]} isMe />
          ) : myIndex === -1 ? (
            <Text style={styles.footerText}>Play a round or answer a quiz to get a rank.</Text>
          ) : (
            <Text style={styles.footerText}>You are #{myIndex + 1} of {rows.length}.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 20, paddingBottom: 30, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { fontFamily: SERIF, fontSize: 26, fontWeight: '700', color: COLORS.ink },
  caption: { fontSize: 13, lineHeight: 19, color: COLORS.muted, marginTop: 6 },
  goldRule: { width: 48, height: 3, backgroundColor: COLORS.gold, marginTop: 12, marginBottom: 16 },
  empty: { fontSize: 14, lineHeight: 21, color: COLORS.muted, textAlign: 'center', marginTop: 30 },

  list: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden'
  },
  divider: { borderTopWidth: 1, borderTopColor: COLORS.line },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  rowMe: { backgroundColor: COLORS.leafSoft },
  rank: { width: 34, fontSize: 18, fontWeight: '700', color: COLORS.taal, textAlign: 'center' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: 10
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { color: COLORS.taal, fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  sub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  breakdown: { fontSize: 12, fontWeight: '700', color: COLORS.goldDeep, marginTop: 2 },
  pointsBadge: { alignItems: 'center', marginLeft: 10, minWidth: 44 },
  pointsText: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: COLORS.taal },
  pointsLabel: { fontSize: 11, color: COLORS.muted },

  footer: {
    borderTopWidth: 2,
    borderTopColor: COLORS.gold,
    backgroundColor: COLORS.white
  },
  footerText: { textAlign: 'center', paddingVertical: 16, fontSize: 14, color: COLORS.muted }
});