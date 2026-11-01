import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import { supabase } from '../services/supabase';

const LETTERS = ['a', 'b', 'c', 'd'];

// Binubuksan mula sa DestinationListScreen:
// navigation.navigate('AddQuiz', { destinationId: item.id, destinationName: item.name })
export default function AddQuizScreen({ route }) {
  const destinationId = route?.params?.destinationId;
  const destinationName = route?.params?.destinationName;

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const setOption = (i, value) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));

  const save = async () => {
    if (!destinationId) return Alert.alert('Walang napiling destination');
    if (!question.trim()) return Alert.alert('Isulat ang tanong');
    if (options.some((o) => !o.trim())) return Alert.alert('Kumpletuhin ang 4 na choices');

    setSaving(true);
    const { error } = await supabase.from('quiz_questions').insert({
      destination_id: destinationId,
      question: question.trim(),
      option_a: options[0].trim(),
      option_b: options[1].trim(),
      option_c: options[2].trim(),
      option_d: options[3].trim(),
      correct_answer: LETTERS[correctIndex] // 'a' | 'b' | 'c' | 'd'
    });
    setSaving(false);

    if (error) return Alert.alert('Hindi na-save', error.message);
    Alert.alert('Na-save na ang tanong');
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Destination</Text>
      <View style={styles.destBox}>
        <Text style={styles.destText}>{destinationName || `ID: ${destinationId}`}</Text>
      </View>

      <Text style={styles.label}>Tanong</Text>
      <TextInput style={styles.input} value={question} onChangeText={setQuestion} multiline />

      <Text style={styles.label}>Mga Choices (pindutin ang bilog para sa tamang sagot)</Text>
      {options.map((opt, i) => (
        <View key={i} style={styles.optionRow}>
          <TouchableOpacity onPress={() => setCorrectIndex(i)} style={styles.radio}>
            {correctIndex === i && <View style={styles.radioDot} />}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={opt}
            onChangeText={(v) => setOption(i, v)}
            placeholder={`Choice ${LETTERS[i].toUpperCase()}`}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Sine-save...' : 'I-save ang Tanong'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F5F6F1' },
  label: { fontWeight: '700', color: '#1D2A2E', marginTop: 16, marginBottom: 8 },
  destBox: {
    backgroundColor: '#E3EEE5',
    borderRadius: 10,
    padding: 12
  },
  destText: { fontWeight: '700', color: '#0E3B43' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E1E3DA',
    borderRadius: 10,
    padding: 12
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D9A441',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D9A441' },
  saveBtn: {
    backgroundColor: '#0E3B43',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  saveText: { color: '#fff', fontWeight: '700' }
});