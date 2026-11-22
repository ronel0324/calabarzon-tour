import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';

const COLORS = {
  taal: '#0E3B43',
  paper: '#F5F6F1',
  white: '#FFFFFF',
  goldDeep: '#A87A1C',
  vermilion: '#B8372F',
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

const KEYS = ['A', 'B', 'C', 'D'];
const norm = (s) => String(s || '').trim().toLowerCase();
const optionText = (q, key) => q[`option_${key.toLowerCase()}`];

// Suportado ang correct_answer na letter ("B") o mismong text ng sagot
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

export default function QuizManageScreen({ route, navigation }) {
  const { province } = route.params;

  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [filterDest, setFilterDest] = useState(null); // null = lahat
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [destSearch, setDestSearch] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: `Manage ${province}` });
  }, [navigation, province]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: dests, error: dErr } = await supabase
      .from('destinations')
      .select('id, name, province')
      .ilike('province', province)
      .order('name');
    if (dErr) {
      Alert.alert('Error', dErr.message);
      setLoading(false);
      return;
    }
    setDestinations(dests || []);

    const ids = (dests || []).map((d) => d.id);
    if (ids.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const { data: qs, error: qErr } = await supabase
      .from('quiz_questions')
      .select('id, destination_id, question, option_a, option_b, option_c, option_d, correct_answer')
      .in('destination_id', ids)
      .order('id', { ascending: true });
    if (qErr) Alert.alert('Error', qErr.message);
    setQuestions(qs || []);
    setLoading(false);
  }, [province]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const destName = (id) => destinations.find((d) => d.id === id)?.name || 'Unknown';
  const countFor = (destId) => questions.filter((q) => q.destination_id === destId).length;
  const visible = filterDest ? questions.filter((q) => q.destination_id === filterDest) : questions;

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, destination_id: filterDest ?? destinations[0]?.id ?? null });
    setPickerOpen(false);
    setDestSearch('');
    setModalVisible(true);
  };

  const openEdit = (q) => {
    setForm({
      id: q.id,
      destination_id: q.destination_id,
      question: q.question || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: correctKeyOf(q) || 'A'
    });
    setPickerOpen(false);
    setDestSearch('');
    setModalVisible(true);
  };

  const save = async () => {
    const { id, destination_id, question, option_a, option_b, option_c, option_d, correct_answer } = form;
    if (!destination_id) return Alert.alert('Piliin muna ang destination');
    if (![question, option_a, option_b, option_c, option_d].every((v) => String(v).trim())) {
      return Alert.alert('Punuin lahat ng fields');
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

    setSaving(true);
    const { data, error } = id
      ? await supabase.from('quiz_questions').update(payload).eq('id', id).select()
      : await supabase.from('quiz_questions').insert(payload).select();
    setSaving(false);

    if (error) return Alert.alert('Error', error.message);
    if (!data || data.length === 0) {
      return Alert.alert('Hindi na-save', 'Na-block ng database (RLS). I-check ang admin policies sa quiz_questions.');
    }
    setModalVisible(false);
    load();
  };

  const confirmDelete = (q) => {
    Alert.alert('Delete question?', q.question, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { data, error } = await supabase
            .from('quiz_questions')
            .delete()
            .eq('id', q.id)
            .select();
          if (error) return Alert.alert('Error', error.message);
          if (!data || data.length === 0) {
            return Alert.alert('Hindi na-delete', 'Na-block ng database (RLS). I-check ang admin policies.');
          }
          load();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{province} Questions</Text>
        <Text style={styles.sub}>
          {questions.length} question{questions.length === 1 ? '' : 's'} sa {destinations.length} destination
          {destinations.length === 1 ? '' : 's'}
        </Text>

        <TouchableOpacity
          style={[styles.addBtn, !destinations.length && { opacity: 0.5 }]}
          onPress={openAdd}
          disabled={!destinations.length}
        >
          <Text style={styles.addText}>+ Add Question</Text>
        </TouchableOpacity>

        {destinations.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <TouchableOpacity
              style={[styles.chip, !filterDest && styles.chipActive, { marginRight: 8 }]}
              onPress={() => setFilterDest(null)}
            >
              <Text style={[styles.chipText, !filterDest && { color: COLORS.white }]}>
                All ({questions.length})
              </Text>
            </TouchableOpacity>
            {destinations.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.chip, filterDest === d.id && styles.chipActive, { marginRight: 8 }]}
                onPress={() => setFilterDest(d.id)}
              >
                <Text style={[styles.chipText, filterDest === d.id && { color: COLORS.white }]}>
                  {d.name} ({countFor(d.id)})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.taal} style={{ marginTop: 40 }} />
        ) : destinations.length === 0 ? (
          <Text style={styles.empty}>Walang destinations sa {province}. Magdagdag muna ng destination.</Text>
        ) : visible.length === 0 ? (
          <Text style={styles.empty}>Wala pang questions.</Text>
        ) : (
          visible.map((q) => {
            const ck = correctKeyOf(q);
            return (
              <View key={q.id} style={styles.card}>
                <Text style={styles.dest}>{destName(q.destination_id)}</Text>
                <Text style={styles.question}>{q.question}</Text>
                {KEYS.map((k) => (
                  <Text key={k} style={[styles.option, ck === k && styles.optionCorrect]}>
                    {k}. {optionText(q, k)}
                    {ck === k ? '  ✓' : ''}
                  </Text>
                ))}
                <View style={styles.row}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(q)}>
                    <Text style={styles.btnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.delBtn} onPress={() => confirmDelete(q)}>
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{form.id ? 'Edit Question' : 'Add Question'}</Text>

            <Text style={styles.label}>Destination</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setPickerOpen((o) => !o)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {form.destination_id
                  ? `${destName(form.destination_id)} (${countFor(form.destination_id)})`
                  : 'Pumili ng destination'}
              </Text>
              <Text style={styles.dropdownArrow}>{pickerOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {pickerOpen && (
              <View style={styles.dropdownList}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Maghanap ng destination..."
                  placeholderTextColor={COLORS.muted}
                  value={destSearch}
                  onChangeText={setDestSearch}
                />
                {destinations
                  .filter((d) => norm(d.name).includes(norm(destSearch)))
                  .map((d) => {
                    const count = countFor(d.id);
                    const selected = form.destination_id === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.dropdownItem, selected && styles.dropdownItemActive]}
                        onPress={() => {
                          setField('destination_id', d.id);
                          setPickerOpen(false);
                          setDestSearch('');
                        }}
                      >
                        <Text
                          style={[styles.dropdownItemText, selected && { color: COLORS.white }]}
                          numberOfLines={1}
                        >
                          {d.name}
                        </Text>
                        <Text style={[styles.dropdownCount, selected && { color: COLORS.white }]}>
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

            <Text style={styles.label}>Question</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
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

            <View style={[styles.row, { marginTop: 24 }]}>
              <TouchableOpacity
                style={[styles.delBtn, { backgroundColor: COLORS.muted }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={save} disabled={saving}>
                <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.paper },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: COLORS.ink },
  sub: { fontSize: 13, color: COLORS.muted, marginTop: 4, marginBottom: 14 },
  addBtn: {
    backgroundColor: COLORS.leaf,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14
  },
  addText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  empty: { color: COLORS.muted, marginTop: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 12
  },
  dest: { fontSize: 12, fontWeight: '700', color: COLORS.goldDeep, marginBottom: 4 },
  question: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  option: { fontSize: 14, lineHeight: 20, color: COLORS.ink, paddingVertical: 2 },
  optionCorrect: { color: COLORS.leaf, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: COLORS.taal, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  delBtn: { flex: 1, backgroundColor: COLORS.vermilion, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '700' },
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
  chipText: { color: COLORS.ink, fontSize: 13 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  dropdownText: { flex: 1, color: COLORS.ink, fontSize: 14 },
  dropdownArrow: { color: COLORS.muted, fontSize: 12, marginLeft: 8 },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden'
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: COLORS.ink
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line
  },
  dropdownItemActive: { backgroundColor: COLORS.taal },
  dropdownItemText: { flex: 1, color: COLORS.ink, fontSize: 14 },
  dropdownCount: { color: COLORS.muted, fontSize: 12, fontWeight: '700', marginLeft: 8 }
});