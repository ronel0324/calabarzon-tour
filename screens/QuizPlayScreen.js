import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const COLORS = {
  taal: '#0E3B43',
  paper: '#F5F6F1',
  white: '#FFFFFF',
  gold: '#D9A441',
  goldDeep: '#A87A1C',
  vermilion: '#B8372F',
  vermilionSoft: '#F6E2E0',
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

const norm = (s) => String(s || '').trim().toLowerCase();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const KEYS = ['A', 'B', 'C', 'D'];

const optionText = (q, key) => q[`option_${key.toLowerCase()}`];

// Sinusuportahan ang correct_answer na letter ("B") o mismong text ng sagot
const correctKeyOf = (q) => {
  const ca = String(q.correct_answer || '').trim();
  if (/^[a-d]$/i.test(ca)) return ca.toUpperCase();
  return KEYS.find((k) => norm(optionText(q, k)) === norm(ca)) || null;
};

const EMPTY_FORM = {
  id: null,
  destination_id: null,
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A'
};

export default function QuizPlayScreen({ route, navigation }) {
  const { province } = route.params;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]); // lahat ng tanong ng province, nakaayos ayon sa id
  const [answers, setAnswers] = useState(new Map()); // question_id -> { selected_answer, is_correct }
  const [pos, setPos] = useState(0); // kasalukuyang tanong; kapag = questions.length, tapos na
  const [saving, setSaving] = useState(false);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: `${province} Quiz` });
  }, [navigation, province]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'));
    supabase
      .from('destinations')
      .select('id, name, province')
      .ilike('province', province)
      .then(({ data }) => setDestinations(data || []));
  }, [user?.id, province]);

  const load = useCallback(async () => {
    const [qRes, aRes] = await Promise.all([
      supabase
        .from('quiz_questions')
        .select(
          'id, destination_id, question, option_a, option_b, option_c, option_d, correct_answer, destinations!inner(province)'
        )
        .order('id', { ascending: true }),
      supabase
        .from('quiz_answers')
        .select('question_id, selected_answer, is_correct')
        .eq('user_id', user.id)
    ]);

    if (qRes.error || aRes.error) {
      Alert.alert('Error', (qRes.error || aRes.error).message);
      setLoading(false);
      return;
    }

    const inProvince = qRes.data.filter((q) => {
      const d = Array.isArray(q.destinations) ? q.destinations[0] : q.destinations;
      return norm(d?.province) === norm(province);
    });
    const answerMap = new Map(
      aRes.data.map((a) => [a.question_id, { selected_answer: a.selected_answer, is_correct: a.is_correct }])
    );

    // Nasagutan na muna (para sa review), tapos ang hindi pa nasasagutan na naka-shuffle
    const answered = inProvince.filter((q) => answerMap.has(q.id));
    const unanswered = shuffle(inProvince.filter((q) => !answerMap.has(q.id)));
    const ordered = [...answered, ...unanswered];

    setQuestions(ordered);
    setAnswers(answerMap);
    setPos(answered.length); // simula sa unang hindi pa nasasagutan
    setLoading(false);
  }, [province, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const total = questions.length;
  const finished = !loading && pos >= total;
  const current = !finished ? questions[pos] : null;
  const myAnswer = current ? answers.get(current.id) : null;
  const locked = !!myAnswer; // nasagutan na (kasama ang review)
  const correctKey = current ? correctKeyOf(current) : null;
  const myKey = myAnswer?.selected_answer || null;

  const choose = async (key) => {
    if (locked || saving || !current) return;
    const isCorrect = key === correctKey;
    setSaving(true);

    // Sine-save agad ang bawat sagot para tuloy ang resume kahit mag-exit
    const { error } = await supabase.from('quiz_answers').upsert(
      {
        user_id: user.id,
        question_id: current.id,
        selected_answer: key,
        is_correct: isCorrect
      },
      { onConflict: 'user_id,question_id' }
    );
    setSaving(false);

    if (error) {
      Alert.alert('Could not save answer', error.message);
      return;
    }
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(current.id, { selected_answer: key, is_correct: isCorrect });
      return next;
    });
    setSessionAnswered((n) => n + 1);
    if (isCorrect) setSessionCorrect((c) => c + 1);
  };

  const goPrevious = () => setPos((p) => Math.max(0, p - 1));
  const goNext = () => setPos((p) => p + 1);

  // ---------- ADMIN: Add / Edit / Delete ----------
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const countFor = (destId) => questions.filter((q) => q.destination_id === destId).length;

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, destination_id: destinations[0]?.id ?? null });
    setModalVisible(true);
  };

  const openEdit = () => {
    if (!current) return;
    setForm({
      id: current.id,
      destination_id: current.destination_id,
      question: current.question,
      option_a: current.option_a,
      option_b: current.option_b,
      option_c: current.option_c,
      option_d: current.option_d,
      correct_answer: correctKeyOf(current) || 'A'
    });
    setModalVisible(true);
  };

  const saveQuestion = async () => {
    const { id, destination_id, question, option_a, option_b, option_c, option_d, correct_answer } = form;
    if (!destination_id) return Alert.alert('Piliin muna ang destination');
    if (![question, option_a, option_b, option_c, option_d].every((v) => String(v).trim())) {
      return Alert.alert('Punuin lahat ng fields');
    }
    if (!id && countFor(destination_id) >= 5) {
      return Alert.alert('Puno na', 'May 5 questions na ang destination na ito.');
    }

    const payload = {
      destination_id,
      question: question.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      option_c: option_c.trim(),
      option_d: option_d.trim(),
      correct_answer
    };

    setAdminSaving(true);
    const query = id
      ? supabase.from('quiz_questions').update(payload).eq('id', id)
      : supabase.from('quiz_questions').insert(payload);
    const { data, error } = await query.select().single();
    setAdminSaving(false);

    if (error) return Alert.alert('Error', error.message);

    setQuestions((qs) => (id ? qs.map((q) => (q.id === id ? { ...q, ...data } : q)) : [...qs, data]));
    setModalVisible(false);
  };

  const confirmDelete = () => {
    if (!current) return;
    const target = current;
    Alert.alert('Delete question?', target.question, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('quiz_questions').delete().eq('id', target.id);
          if (error) return Alert.alert('Error', error.message);
          setQuestions((qs) => qs.filter((q) => q.id !== target.id));
          setAnswers((prev) => {
            const next = new Map(prev);
            next.delete(target.id);
            return next;
          });
        }
      }
    ]);
  };

  const adminModal = isAdmin ? (
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.formHeading}>{form.id ? 'Edit Question' : 'Add Question'}</Text>

          <Text style={styles.label}>Destination</Text>
          <View style={styles.chips}>
            {destinations.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, form.destination_id === d.id && styles.chipActive]}
                onPress={() => setField('destination_id', d.id)}
              >
                <Text style={[styles.chipText, form.destination_id === d.id && { color: COLORS.white }]}>
                  {d.name} ({countFor(d.id)}/5)
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Question</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={form.question}
            onChangeText={(v) => setField('question', v)}
          />

          {['a', 'b', 'c', 'd'].map((l) => (
            <View key={l}>
              <Text style={styles.label}>Option {l.toUpperCase()}</Text>
              <TextInput
                style={styles.input}
                value={form[`option_${l}`]}
                onChangeText={(v) => setField(`option_${l}`, v)}
              />
            </View>
          ))}

          <Text style={styles.label}>Tamang sagot</Text>
          <View style={styles.chips}>
            {KEYS.map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.chip, form.correct_answer === k && styles.chipCorrect]}
                onPress={() => setField('correct_answer', k)}
              >
                <Text style={[styles.chipText, form.correct_answer === k && { color: COLORS.white }]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.navRow, { marginTop: 24 }]}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginRight: 10, paddingVertical: 14 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={saveQuestion} disabled={adminSaving}>
              <Text style={styles.primaryBtnText}>{adminSaving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  ) : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ActivityIndicator color={COLORS.taal} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (finished) {
    const noQuestions = total === 0;
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>{noQuestions ? '📭' : '🎉'}</Text>
          <Text style={styles.doneTitle}>
            {noQuestions
              ? 'No questions yet'
              : sessionAnswered === 0
              ? 'You have answered everything'
              : `${province} quiz complete`}
          </Text>
          {!noQuestions && (
            <Text style={styles.doneText}>
              {sessionAnswered === 0
                ? `All ${total} questions in ${province} are done. New questions will show up here when the admin adds them.`
                : `This round: ${sessionCorrect} / ${sessionAnswered} correct.`}
            </Text>
          )}

          {!noQuestions && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPos(total - 1)}>
              <Text style={styles.primaryBtnText}>Review my answers</Text>
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity style={styles.adminAddBtn} onPress={openAdd}>
              <Text style={styles.primaryBtnText}>+ Add Question</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={noQuestions && !isAdmin ? styles.primaryBtn : styles.secondaryBtnWide}
            onPress={() => navigation.goBack()}
          >
            <Text style={noQuestions && !isAdmin ? styles.primaryBtnText : styles.secondaryBtnText}>
              Back to provinces
            </Text>
          </TouchableOpacity>
        </View>
        {adminModal}
      </SafeAreaView>
    );
  }

  const progress = total ? answers.size / total : 0;
  const isLast = pos === total - 1;
  const gotItRight = locked && myKey === correctKey;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.counter}>
          Question {pos + 1} of {total}
        </Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>

        {isAdmin && (
          <View style={styles.adminBar}>
            <TouchableOpacity style={[styles.adminBtn, { backgroundColor: COLORS.leaf }]} onPress={openAdd}>
              <Text style={styles.adminBtnText}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adminBtn, { backgroundColor: COLORS.taal }]} onPress={openEdit}>
              <Text style={styles.adminBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminBtn, { backgroundColor: COLORS.vermilion }]}
              onPress={confirmDelete}
            >
              <Text style={styles.adminBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.question}>{current.question}</Text>

        {KEYS.map((key) => {
          const text = optionText(current, key);
          if (!text) return null;
          const isPicked = myKey === key;
          const isRight = locked && key === correctKey;
          const isWrongPick = locked && isPicked && key !== correctKey;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              disabled={locked || saving}
              onPress={() => choose(key)}
              style={[
                styles.option,
                isRight && styles.optionRight,
                isWrongPick && styles.optionWrong
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Option ${key}: ${text}`}
            >
              <View
                style={[
                  styles.optionBadge,
                  isRight && { backgroundColor: COLORS.leaf },
                  isWrongPick && { backgroundColor: COLORS.vermilion }
                ]}
              >
                <Text style={[styles.optionBadgeText, (isRight || isWrongPick) && { color: COLORS.white }]}>
                  {key}
                </Text>
              </View>
              <Text style={styles.optionText}>{text}</Text>
              {locked && isPicked && <Text style={styles.youTag}>Your answer</Text>}
              {locked && isRight && !isPicked && <Text style={[styles.youTag, { color: COLORS.leaf }]}>Correct</Text>}
            </TouchableOpacity>
          );
        })}

        {locked && (
          <Text style={[styles.feedback, { color: gotItRight ? COLORS.leaf : COLORS.vermilion }]}>
            {gotItRight
              ? 'Correct!'
              : correctKey
              ? `Not quite. You chose ${myKey}. The answer is ${correctKey}.`
              : 'Not quite.'}
          </Text>
        )}

        <View style={styles.navRow}>
          {pos > 0 && (
            <TouchableOpacity
              style={[styles.secondaryBtn, locked && { marginRight: 10 }]}
              onPress={goPrevious}
              accessibilityRole="button"
              accessibilityLabel="Previous question"
            >
              <Text style={[styles.secondaryBtnText, { fontSize: 13 }]}>‹ Previous</Text>
            </TouchableOpacity>
          )}
          {locked && (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Finish' : 'Next question'}
            >
              <Text style={styles.primaryBtnText}>{isLast ? 'Finish' : 'Next ›'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {adminModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  counter: { fontSize: 13, fontWeight: '700', color: COLORS.goldDeep, marginBottom: 8 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.line, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.leaf },
  question: {
    fontFamily: SERIF,
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 22,
    marginBottom: 20
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  optionRight: { borderColor: COLORS.leaf, backgroundColor: COLORS.leafSoft },
  optionWrong: { borderColor: COLORS.vermilion, backgroundColor: COLORS.vermilionSoft },
  optionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  optionBadgeText: { fontWeight: '700', color: COLORS.taal },
  optionText: { flex: 1, fontSize: 15, lineHeight: 21, color: COLORS.ink },
  youTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    marginLeft: 8
  },
  feedback: { fontSize: 16, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  nextBtn: {
    flex: 1,
    backgroundColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.taal,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center'
  },
  secondaryBtnWide: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.taal,
    paddingVertical: 12.5,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12
  },
  secondaryBtnText: { color: COLORS.taal, fontWeight: '700', fontSize: 15 },
  primaryBtn: {
    backgroundColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  doneEmoji: { fontSize: 54 },
  doneTitle: {
    fontFamily: SERIF,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 12,
    textAlign: 'center'
  },
  doneText: { fontSize: 14, lineHeight: 21, color: COLORS.muted, marginTop: 8, textAlign: 'center' },

  // Admin
  adminBar: { flexDirection: 'row', gap: 8, marginTop: 16 },
  adminBtn: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  adminBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  adminAddBtn: {
    backgroundColor: COLORS.leaf,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12
  },
  formHeading: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: COLORS.ink, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 10,
    color: COLORS.ink,
    textAlignVertical: 'top'
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white
  },
  chipActive: { backgroundColor: COLORS.taal, borderColor: COLORS.taal },
  chipCorrect: { backgroundColor: COLORS.leaf, borderColor: COLORS.leaf },
  chipText: { color: COLORS.ink, fontSize: 13 }
});