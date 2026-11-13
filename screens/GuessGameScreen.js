import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SERIF } from '../theme';
// Ayusin ang path na ito kung nasaan ang Supabase client mo
import { supabase } from '../services/supabase';

const MAX_ATTEMPTS = 5;

const GREEN = COLORS.leaf;
const YELLOW = COLORS.gold;
const GRAY = '#8A9497';
const STATUS_COLOR = { correct: GREEN, present: YELLOW, absent: GRAY };

const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

// Mga salitang hindi tatakpan sa hint (para may clue pa rin ang player)
const COMMON_WORDS = new Set([
  'mount', 'lake', 'falls', 'fall', 'river', 'church', 'cathedral', 'basilica', 'shrine',
  'national', 'park', 'museum', 'beach', 'resort', 'parish', 'island', 'cave', 'caves',
  'garden', 'gardens', 'heritage', 'site', 'town', 'plaza', 'house', 'ancestral'
]);

const normalize = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Palitan ng ____ ang sagot at ang mga pangalang salita sa description
function maskHint(description, name, answer) {
  let text = String(description || '').replace(/\s+/g, ' ').trim();
  const words = new Set([answer.toLowerCase()]);
  String(name || '')
    .split(/[^A-Za-zñÑ]+/)
    .forEach((w) => {
      const lw = w.toLowerCase();
      if (lw.length >= 4 && !COMMON_WORDS.has(lw)) words.add(lw);
    });
  words.forEach((w) => {
    text = text.replace(new RegExp(escapeRegex(w), 'gi'), '____');
  });
  // Maikli lang ang hint: hanggang mga 260 letra, putol sa dulo ng pangungusap
  if (text.length > 260) {
    const cut = text.slice(0, 260);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    text = lastStop > 100 ? cut.slice(0, lastStop + 1) : cut.trim() + '…';
  }
  return text;
}

// Wordle rules: green muna, tapos yellow ayon sa natitirang bilang ng letra
function evaluate(guess, answer) {
  const n = answer.length;
  const result = Array(n).fill('absent');
  const left = {};
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue;
    const c = guess[i];
    if (left[c] > 0) {
      result[i] = 'present';
      left[c] -= 1;
    }
  }
  return result;
}

export default function GuessGameScreen({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [round, setRound] = useState(null);
  const [guesses, setGuesses] = useState([]); // { word, result }
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [earned, setEarned] = useState(0);
  const [saving, setSaving] = useState(false);

  const playedRef = useRef(new Set());

  const startRound = useCallback((list) => {
    if (!list || list.length === 0) return;
    let fresh = list.filter((d) => !playedRef.current.has(d.id));
    if (fresh.length === 0) {
      playedRef.current = new Set(); // naubos na ang lahat, ulitin
      fresh = list;
    }
    const next = fresh[Math.floor(Math.random() * fresh.length)];
    playedRef.current.add(next.id);
    setRound(next);
    setGuesses([]);
    setCurrent('');
    setStatus('playing');
    setEarned(0);
  }, []);

  const loadPool = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase
      .from('destinations')
      .select('id, name, description, image, province, game_answer')
      .not('game_answer', 'is', null);
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    const clean = (data || [])
      .map((d) => ({ ...d, answer: normalize(d.game_answer) }))
      .filter((d) => d.answer.length >= 3 && d.image && /^https?:\/\//i.test(String(d.image)));
    setPool(clean);
    setLoading(false);
    startRound(clean);
  }, [startRound]);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Leaderboard')}
          style={{ marginRight: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Leaderboard"
        >
          <Feather name="award" size={22} color={COLORS.gold} />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  const saveScore = async (dest, won, attempts) => {
    const points = won ? MAX_ATTEMPTS + 1 - attempts : 0;
    setEarned(points);
    setSaving(true);
    const { error } = await supabase.from('game_scores').insert({
      user_id: user.id,
      destination_id: dest.id,
      won,
      attempts,
      points
    });
    if (error) console.log('Save score error:', error.message);
    setSaving(false);
  };

  const submit = useCallback(() => {
    if (!round || status !== 'playing') return;
    if (current.length !== round.answer.length) return;

    const entry = { word: current, result: evaluate(current, round.answer) };
    const next = [...guesses, entry];
    setGuesses(next);
    setCurrent('');

    if (current === round.answer) {
      setStatus('won');
      saveScore(round, true, next.length);
    } else if (next.length >= MAX_ATTEMPTS) {
      setStatus('lost');
      saveScore(round, false, next.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, status, current, guesses]);

  const onKey = useCallback(
    (key) => {
      if (!round || status !== 'playing') return;
      if (key === 'ENTER') return submit();
      if (key === 'BACK') return setCurrent((c) => c.slice(0, -1));
      setCurrent((c) => (c.length < round.answer.length ? c + key : c));
    },
    [round, status, submit]
  );

  // Pisikal na keyboard sa web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') onKey('ENTER');
      else if (e.key === 'Backspace') onKey('BACK');
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.taal} size="large" />
      </View>
    );
  }

  if (loadError || !round) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No game available yet</Text>
        <Text style={styles.emptyText}>
          {loadError ||
            'No destination has both a game_answer and an image URL (starting with http). Add some in Supabase, then try again.'}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={loadPool}>
          <Text style={styles.primaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const len = round.answer.length;
  const finished = status !== 'playing';
  const hint = maskHint(round.description, round.name, round.answer);

  const gap = 6;
  const boardWidth = Math.min(width, 520) - 40;
  const box = Math.max(24, Math.min(52, Math.floor((boardWidth - gap * (len - 1)) / len)));

  const keyWidth = Math.floor((Math.min(width, 520) - 16 - 3 * 10) / 10);

  // Kulay ng bawat key ayon sa pinakamagandang resulta
  const keyState = {};
  const rank = { absent: 1, present: 2, correct: 3 };
  guesses.forEach((g) => {
    g.word.split('').forEach((ch, i) => {
      const st = g.result[i];
      if (!keyState[ch] || rank[st] > rank[keyState[ch]]) keyState[ch] = st;
    });
  });

  const renderRow = (r) => {
    const g = guesses[r];
    const isActive = !g && r === guesses.length && status === 'playing';
    return (
      <View key={r} style={[styles.row, { marginBottom: gap }]}>
        {Array.from({ length: len }).map((_, i) => {
          let letter = '';
          let bg = COLORS.white;
          let border = COLORS.line;
          let color = COLORS.ink;
          if (g) {
            letter = g.word[i];
            bg = STATUS_COLOR[g.result[i]];
            border = bg;
            color = COLORS.white;
          } else if (isActive) {
            letter = current[i] || '';
            if (letter) border = COLORS.taal;
          }
          return (
            <View
              key={i}
              style={[
                styles.box,
                { width: box, height: box, marginRight: i < len - 1 ? gap : 0, backgroundColor: bg, borderColor: border }
              ]}
            >
              <Text style={[styles.boxText, { color, fontSize: Math.round(box * 0.5) }]}>{letter}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderKey = (label, onPress, wide) => {
    const st = keyState[label];
    const bg = st ? STATUS_COLOR[st] : '#DDE2DA';
    const fg = st ? COLORS.white : COLORS.ink;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.key, { width: wide ? keyWidth * 1.6 : keyWidth, backgroundColor: bg }]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {label === 'BACK' ? (
          <Feather name="delete" size={18} color={fg} />
        ) : (
          <Text style={[styles.keyText, { color: fg, fontSize: label === 'ENTER' ? 11 : 15 }]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        {/* Larawan */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: round.image }} style={styles.image} resizeMode="cover" />
          <View style={styles.attemptBadge}>
            <Text style={styles.attemptText}>
              {Math.min(guesses.length + (finished ? 0 : 1), MAX_ATTEMPTS)}/{MAX_ATTEMPTS}
            </Text>
          </View>
        </View>

        {/* Hint */}
        <View style={styles.hintCard}>
          <Text style={styles.hintLabel}>Hint</Text>
          <Text style={styles.hintText}>{hint || 'No hint available for this place.'}</Text>
        </View>

        {/* Boxes */}
        <View style={styles.board}>{Array.from({ length: MAX_ATTEMPTS }).map((_, r) => renderRow(r))}</View>

        {/* Resulta */}
        {finished && (
          <View style={[styles.resultCard, { borderColor: status === 'won' ? GREEN : '#B8372F' }]}>
            <Text style={styles.resultTitle}>{status === 'won' ? 'You got it!' : 'Not this time'}</Text>
            <Text style={styles.resultName}>{round.name}</Text>
            {round.province ? <Text style={styles.resultSub}>{round.province}</Text> : null}
            <Text style={styles.resultPoints}>
              {status === 'won' ? `+${earned} point${earned === 1 ? '' : 's'}` : '0 points'}
              {saving ? '  (saving...)' : ''}
            </Text>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => startRound(pool)}>
                <Text style={styles.primaryBtnText}>Play again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Leaderboard')}>
                <Text style={styles.ghostBtnText}>Leaderboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Keyboard */}
        {!finished && (
          <View style={styles.keyboard}>
            <View style={styles.keyRow}>{KEY_ROWS[0].split('').map((k) => renderKey(k, () => onKey(k)))}</View>
            <View style={styles.keyRow}>{KEY_ROWS[1].split('').map((k) => renderKey(k, () => onKey(k)))}</View>
            <View style={styles.keyRow}>
              {renderKey('ENTER', () => onKey('ENTER'), true)}
              {KEY_ROWS[2].split('').map((k) => renderKey(k, () => onKey(k)))}
              {renderKey('BACK', () => onKey('BACK'), true)}
            </View>
            <Text style={styles.lengthNote}>{len} letters</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paper },
  content: { paddingBottom: 30, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 520, paddingHorizontal: 20, paddingTop: 16 },
  center: {
    flex: 1,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  emptyTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  emptyText: { fontSize: 14, lineHeight: 21, color: COLORS.muted, textAlign: 'center', marginBottom: 18 },

  imageWrap: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.taal,
    borderWidth: 1.5,
    borderColor: COLORS.gold
  },
  image: { width: '100%', height: '100%' },
  attemptBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(14, 59, 67, 0.85)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  attemptText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  hintCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    padding: 14,
    marginTop: 14,
    marginBottom: 18
  },
  hintLabel: { fontSize: 12, fontWeight: '700', color: COLORS.goldDeep, marginBottom: 4 },
  hintText: { fontFamily: SERIF, fontSize: 14, lineHeight: 22, color: '#3B484B' },

  board: { alignItems: 'center', marginBottom: 10 },
  row: { flexDirection: 'row' },
  box: { borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  boxText: { fontWeight: '800' },

  keyboard: { alignItems: 'center', marginTop: 8 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  key: {
    height: 46,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyText: { fontWeight: '700' },
  lengthNote: { fontSize: 12, color: COLORS.muted, marginTop: 4 },

  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 2,
    padding: 18,
    alignItems: 'center',
    marginTop: 8
  },
  resultTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: COLORS.ink },
  resultName: { fontSize: 17, fontWeight: '700', color: COLORS.taal, marginTop: 8, textAlign: 'center' },
  resultSub: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  resultPoints: { fontSize: 16, fontWeight: '700', color: COLORS.goldDeep, marginTop: 10 },
  resultActions: { flexDirection: 'row', marginTop: 16 },

  primaryBtn: {
    backgroundColor: COLORS.taal,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginLeft: 10
  },
  ghostBtnText: { color: COLORS.goldDeep, fontWeight: '700', fontSize: 15 }
});