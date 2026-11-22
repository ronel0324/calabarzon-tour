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
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
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

// Gumagana sa web at sa phone
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

const confirmAsync = (title, message) =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title))
    : new Promise((resolve) =>
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
          ],
          { cancelable: true, onDismiss: () => resolve(false) }
        )
      );

const errText = (error) => `${error.message}\n${error.details || ''}\n${error.code || ''}`;

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

// Binabasa ang rows mula sa Excel: A=Question, B-E=Options A-D, F=Answer key
const parseRows = (rows) => {
  const valid = [];
  const errors = [];

  rows.forEach((r, i) => {
    const cells = [0, 1, 2, 3, 4, 5].map((c) => String(r?.[c] ?? '').trim());
    if (cells.every((c) => !c)) return; // blangkong row
    if (i === 0 && /^question/i.test(cells[0])) return; // header row

    const [question, a, b, c, d, ans] = cells;
    const rowNo = i + 1;

    if (!question || !a || !b || !c || !d || !ans) {
      errors.push(`Row ${rowNo}: kulang ang laman`);
      return;
    }

    const opts = [a, b, c, d];
    let key = null;
    if (/^[a-d]$/i.test(ans)) key = ans.toUpperCase();
    else {
      const idx = opts.findIndex((o) => norm(o) === norm(ans));
      if (idx >= 0) key = KEYS[idx];
    }
    if (!key) {
      errors.push(`Row ${rowNo}: hindi tugma ang answer key ("${ans}")`);
      return;
    }

    valid.push({
      question,
      option_a: a,
      option_b: b,
      option_c: c,
      option_d: d,
      correct_answer: key
    });
  });

  return { valid, errors };
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

  // Bulk upload states
  const [bulkVisible, setBulkVisible] = useState(false);
  const [bulkDest, setBulkDest] = useState(null);
  const [bulkPickerOpen, setBulkPickerOpen] = useState(false);
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkFile, setBulkFile] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: `Manage ${province}` });
  }, [navigation, province]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const { data: dests, error: dErr } = await supabase
        .from('destinations')
        .select('id, name, province')
        .ilike('province', province)
        .order('name');
      if (dErr) {
        showAlert('Error', dErr.message);
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
      if (qErr) showAlert('Error', qErr.message);
      setQuestions(qs || []);
      setLoading(false);
    },
    [province]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Realtime: mag-a-update agad kapag may insert/update/delete (may debounce)
  useEffect(() => {
    let timer;
    const channel = supabase
      .channel(`quiz_questions_${province}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_questions' },
        () => {
          clearTimeout(timer);
          timer = setTimeout(() => load(true), 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [province, load]);

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
    if (!destination_id) return showAlert('Piliin muna ang destination');
    if (![question, option_a, option_b, option_c, option_d].every((v) => String(v).trim())) {
      return showAlert('Punuin lahat ng fields');
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

    if (error) return showAlert('Error', errText(error));
    if (!data || data.length === 0) {
      return showAlert('Hindi na-save', 'Na-block ng database (RLS). I-check ang admin policies sa quiz_questions.');
    }
    setModalVisible(false);
    load(true);
  };

  const confirmDelete = async (q) => {
    const ok = await confirmAsync('Delete question?', q.question);
    if (!ok) return;

    const { data, error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', q.id)
      .select();

    if (error) return showAlert('Error', errText(error));
    if (!data || data.length === 0) {
      return showAlert('Hindi na-delete', 'Na-block ng database (RLS). I-check ang admin policies.');
    }
    load(true);
  };

  // ---------- BULK UPLOAD ----------
  const openBulk = () => {
    setBulkDest(filterDest ?? destinations[0]?.id ?? null);
    setBulkPickerOpen(false);
    setBulkSearch('');
    setBulkFile('');
    setBulkRows([]);
    setBulkErrors([]);
    setBulkVisible(true);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv',
          'text/comma-separated-values'
        ],
        copyToCacheDirectory: true
      });
      if (res.canceled || !res.assets?.length) return;

      const asset = res.assets[0];
      setReading(true);
      setBulkFile(asset.name || 'file');

      const response = await fetch(asset.uri);
      const buffer = await response.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      const { valid, errors } = parseRows(rows);
      setBulkRows(valid);
      setBulkErrors(errors);
    } catch (e) {
      setBulkRows([]);
      setBulkErrors([]);
      showAlert('Hindi mabasa ang file', e?.message || 'Subukan ulit.');
    } finally {
      setReading(false);
    }
  };

  const importRows = async () => {
    if (!bulkDest) return showAlert('Piliin muna ang destination');
    if (bulkRows.length === 0) return showAlert('Walang valid na rows na i-import');

    setImporting(true);
    const payload = bulkRows.map((r) => ({ ...r, destination_id: bulkDest }));

    // Hatiin sa 100 bawat insert
    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      const { data, error } = await supabase.from('quiz_questions').insert(chunk).select();
      if (error || !data || data.length === 0) {
        setImporting(false);
        load(true);
        return showAlert(
          'Hindi natapos ang import',
          error ? errText(error) : 'Na-block ng database (RLS). I-check ang admin policies sa quiz_questions.'
        );
      }
    }
    setImporting(false);
    setBulkVisible(false);
    showAlert('Tapos na', `${payload.length} questions ang naidagdag sa ${destName(bulkDest)}.`);
    load(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{province} Questions</Text>
        <Text style={styles.sub}>
          {questions.length} question{questions.length === 1 ? '' : 's'} sa {destinations.length} destination
          {destinations.length === 1 ? '' : 's'}
        </Text>

        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.addBtn, { flex: 1 }, !destinations.length && { opacity: 0.5 }]}
            onPress={openAdd}
            disabled={!destinations.length}
          >
            <Text style={styles.addText}>+ Add Question</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkBtn, { flex: 1 }, !destinations.length && { opacity: 0.5 }]}
            onPress={openBulk}
            disabled={!destinations.length}
          >
            <Text style={styles.bulkBtnText}>⬆ Bulk Upload</Text>
          </TouchableOpacity>
        </View>

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

      {/* ADD / EDIT MODAL */}
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

      {/* BULK UPLOAD MODAL */}
      <Modal visible={bulkVisible} animationType="slide" onRequestClose={() => setBulkVisible(false)}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>Bulk Upload (Excel)</Text>

            <View style={styles.formatBox}>
              <Text style={styles.formatTitle}>Excel Format</Text>
              <Text style={styles.formatText}>Column A: Question</Text>
              <Text style={styles.formatText}>Column B: Option A    Column C: Option B    Column D: Option C    Column E: Option D</Text>
              <Text style={styles.formatText}>Column F: Answer key (A, B, C, D or exact answer)</Text>
              <Text style={[styles.formatText, { marginTop: 6 }]}>
                One row = one question. A header in row 1 is allowed (starting with "Question").
              </Text>
            </View>

            <Text style={styles.label}>Destination (all questions will go here)</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setBulkPickerOpen((o) => !o)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {bulkDest ? `${destName(bulkDest)} (${countFor(bulkDest)})` : 'Pumili ng destination'}
              </Text>
              <Text style={styles.dropdownArrow}>{bulkPickerOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {bulkPickerOpen && (
              <View style={styles.dropdownList}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Maghanap ng destination..."
                  placeholderTextColor={COLORS.muted}
                  value={bulkSearch}
                  onChangeText={setBulkSearch}
                />
                {destinations
                  .filter((d) => norm(d.name).includes(norm(bulkSearch)))
                  .map((d) => {
                    const selected = bulkDest === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.dropdownItem, selected && styles.dropdownItemActive]}
                        onPress={() => {
                          setBulkDest(d.id);
                          setBulkPickerOpen(false);
                          setBulkSearch('');
                        }}
                      >
                        <Text
                          style={[styles.dropdownItemText, selected && { color: COLORS.white }]}
                          numberOfLines={1}
                        >
                          {d.name}
                        </Text>
                        <Text style={[styles.dropdownCount, selected && { color: COLORS.white }]}>
                          {countFor(d.id)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

            <Text style={styles.label}>Excel file</Text>
            <TouchableOpacity style={styles.pickFileBtn} onPress={pickFile} disabled={reading}>
              <Text style={styles.pickFileText}>
                {reading ? 'Binabasa...' : bulkFile ? `📄 ${bulkFile} (palitan)` : '📂 Pumili ng Excel file'}
              </Text>
            </TouchableOpacity>

            {bulkFile !== '' && !reading && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>
                  {bulkRows.length} valid na tanong
                  {bulkErrors.length > 0 ? ` · ${bulkErrors.length} may mali` : ''}
                </Text>

                {bulkRows.slice(0, 3).map((r, i) => (
                  <Text key={i} style={styles.previewRow} numberOfLines={2}>
                    {i + 1}. {r.question} ({r.correct_answer})
                  </Text>
                ))}
                {bulkRows.length > 3 && (
                  <Text style={styles.previewMore}>...at {bulkRows.length - 3} pa</Text>
                )}

                {bulkErrors.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.errTitle}>Hindi isasama (ayusin sa Excel kung gusto):</Text>
                    {bulkErrors.slice(0, 8).map((e, i) => (
                      <Text key={i} style={styles.errText}>• {e}</Text>
                    ))}
                    {bulkErrors.length > 8 && (
                      <Text style={styles.errText}>...at {bulkErrors.length - 8} pang error</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={[styles.row, { marginTop: 24 }]}>
              <TouchableOpacity
                style={[styles.delBtn, { backgroundColor: COLORS.muted }]}
                onPress={() => setBulkVisible(false)}
                disabled={importing}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, (!bulkRows.length || !bulkDest) && { opacity: 0.5 }]}
                onPress={importRows}
                disabled={importing || !bulkRows.length || !bulkDest}
              >
                <Text style={styles.btnText}>
                  {importing ? 'Ini-import...' : `Import ${bulkRows.length || ''}`}
                </Text>
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
  topRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  addBtn: {
    backgroundColor: COLORS.leaf,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  addText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  bulkBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  bulkBtnText: { color: COLORS.taal, fontWeight: '700', fontSize: 15 },
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
  dropdownCount: { color: COLORS.muted, fontSize: 12, fontWeight: '700', marginLeft: 8 },

  // Bulk upload
  formatBox: {
    backgroundColor: COLORS.leafSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 12
  },
  formatTitle: { fontSize: 13, fontWeight: '700', color: COLORS.taal, marginBottom: 6 },
  formatText: { fontSize: 13, lineHeight: 19, color: COLORS.ink },
  pickFileBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.taal,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  pickFileText: { color: COLORS.taal, fontWeight: '700', fontSize: 14 },
  previewBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    padding: 12,
    marginTop: 12
  },
  previewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  previewRow: { fontSize: 13, lineHeight: 19, color: COLORS.ink, paddingVertical: 2 },
  previewMore: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  errTitle: { fontSize: 13, fontWeight: '700', color: COLORS.vermilion, marginBottom: 4 },
  errText: { fontSize: 12, lineHeight: 18, color: COLORS.vermilion }
});