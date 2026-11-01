import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, ScrollView, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SERIF } from '../theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // Alert.alert ay hindi gumagana sa web, kaya ipakita ang mensahe sa mismong form
  const notify = (title, text) => {
    if (Platform.OS === 'web') setMessage(`${title}: ${text}`);
    else Alert.alert(title, text);
  };

  const isRegister = mode === 'register';

  const submit = async () => {
    setMessage(null);
    if (!email.trim() || !password) {
      return notify('Oops', 'Fill in your email and password.');
    }
    if (isRegister) {
      if (password.length < 6) return notify('Oops', 'Password must be at least 6 characters.');
      if (password !== confirm) return notify('Oops', 'Passwords do not match.');
    }

    setBusy(true);
    const { data, error } = isRegister ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);

    if (error) {
      return notify(isRegister ? 'Register failed' : 'Login failed', error.message);
    }
    if (isRegister && !data.session) {
      notify('Check your email', 'We sent a confirmation link. Confirm it, then log in.');
      setMode('login');
    }
    // Kapag may session na, AuthContext na ang bahala -> Home
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>CALABARZON</Text>
          <Text style={styles.tagline}>Virtual Tour</Text>
          <View style={styles.goldRule} />

          <View style={styles.card}>
            <Text style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={styles.sub}>
              {isRegister ? 'New accounts are view-only.' : 'Log in to continue.'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {isRegister && (
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={COLORS.muted}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
            )}

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, busy && { opacity: 0.6 }]}
              onPress={submit}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.btnText}>{isRegister ? 'Register' : 'Login'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setMessage(null); setMode(isRegister ? 'login' : 'register'); }}>
              <Text style={styles.link}>
                {isRegister ? 'Already have an account? Login' : 'No account yet? Register'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.taal },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { fontFamily: SERIF, fontSize: 38, fontWeight: '700', color: COLORS.white, textAlign: 'center' },
  tagline: { fontSize: 15, color: '#E8D9AE', textAlign: 'center', marginTop: 2 },
  goldRule: { width: 48, height: 3, backgroundColor: COLORS.gold, alignSelf: 'center', marginVertical: 18 },
  card: { backgroundColor: COLORS.paper, borderRadius: 16, padding: 22, borderWidth: 1.5, borderColor: COLORS.gold },
  title: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', color: COLORS.ink },
  sub: { color: COLORS.muted, marginTop: 4, marginBottom: 18 },
  input: {
    borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white,
    borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16, color: COLORS.ink
  },
  message: { color: COLORS.vermilion || '#B8372F', marginBottom: 12, lineHeight: 20 },
  btn: { backgroundColor: COLORS.taal, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  link: { color: COLORS.goldDeep || COLORS.gold, textAlign: 'center', marginTop: 18, fontWeight: '600' }
});