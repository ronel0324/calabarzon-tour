import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Modal,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
// Ayusin ang path na ito kung nasaan ang Supabase client mo
import { supabase } from '../services/supabase';

// Palette: hango sa Taal Lake, sa ginto ng araw sa watawat, at sa kulay ng Pahiyas
const COLORS = {
  taal: '#0E3B43', // malalim na teal ng lawa
  taalSoft: '#1D5963',
  paper: '#F5F6F1',
  white: '#FFFFFF',
  gold: '#D9A441',
  goldDeep: '#A87A1C',
  vermilion: '#B8372F',
  leaf: '#3F7D4E',
  leafSoft: '#E3EEE5',
  ink: '#1D2A2E',
  muted: '#5C6A6D',
  line: '#E1E3DA'
};

// Serif para sa mga pamagat (heritage na dating), system font para sa maliliit na teksto
const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif'
});

const BANNER_KEY = 'home_banner';
const DEFAULT_BANNER = {
  title: 'CALABARZON Virtual Tour',
  subtitle: 'Five provinces of heritage, history, and landscape'
};

// Alert.alert ay hindi gumagana sa web, kaya gumamit ng window.alert doon
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Confirm bago magbura (Alert.alert ay hindi gumagana sa web)
const confirmAction = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: onConfirm }
    ]);
  }
};

const MENU_ITEMS = [
  {
    key: 'list',
    icon: '📍',
    title: 'Browse Destinations',
    subtitle: 'Tourist spots and cultural sites',
    route: 'DestinationList'
  },
  {
    key: 'add',
    icon: '➕',
    title: 'Add Destination',
    subtitle: 'Contribute a new location',
    route: 'AddDestination',
    adminOnly: true
  },
  {
    key: 'quiz',
    icon: '📝',
    title: 'Quiz',
    subtitle: 'Test your knowledge, province by province',
    route: 'QuizProvinces'
  },
  {
    key: 'game',
    icon: '🎮',
    title: 'Play Game',
    subtitle: 'Guess the place from a photo',
    route: 'GuessGame'
  }
];

// Hinabing banig na border: hilera ng maliliit na diamond, ang tanging palamuti ng screen
const WeaveBand = () => {
  const { width } = useWindowDimensions();
  const cell = 14;
  const count = Math.ceil(width / cell);
  const palette = [COLORS.gold, COLORS.vermilion, COLORS.leaf, COLORS.gold, COLORS.taalSoft];

  return (
    <View style={styles.weaveBand}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.weaveCell}>
          <View
            style={[styles.weaveDiamond, { backgroundColor: palette[i % palette.length] }]}
          />
        </View>
      ))}
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isAdmin, user, signOut } = useAuth();
  const visibleMenu = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const [aboutExpanded, setAboutExpanded] = useState(false);

  // Banner (editable ng admin)
  const [banner, setBanner] = useState(DEFAULT_BANNER);
  const [editVisible, setEditVisible] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_BANNER);

  // Profile
  const [profile, setProfile] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // Settings (palitan ang password)
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  // I-load ang banner: cache muna, tapos pinakabago mula sa Supabase
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(BANNER_KEY);
        if (cached) setBanner(JSON.parse(cached));
      } catch (e) {}

      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', BANNER_KEY)
        .single();
      if (!error && data?.value) {
        setBanner(data.value);
        try {
          await AsyncStorage.setItem(BANNER_KEY, JSON.stringify(data.value));
        } catch (e) {}
      }
    })();
  }, []);

  // I-load ang profile ng user mula sa Supabase
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (!error && data) setProfile(data);
    };
    load();
    return navigation.addListener('focus', load);
  }, [navigation, user?.id]);

  const openEdit = () => {
    setDraft(banner);
    setEditVisible(true);
  };

  const saveBanner = async () => {
    const next = {
      title: draft.title.trim() || DEFAULT_BANNER.title,
      subtitle: draft.subtitle.trim()
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: BANNER_KEY, value: next, updated_at: new Date().toISOString() });

    if (error) {
      notify('Could not save banner', error.message);
      return;
    }

    setBanner(next);
    setEditVisible(false);
    try {
      await AsyncStorage.setItem(BANNER_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const openProfile = () => {
    setMenuVisible(false);
    navigation.navigate('Profile');
  };

  const openSettings = () => {
    setMenuVisible(false);
    setPw({ current: '', next: '', confirm: '' });
    setShowPw(false);
    setSettingsVisible(true);
  };

  const closeSettings = () => {
    setSettingsVisible(false);
    setPw({ current: '', next: '', confirm: '' });
  };

  const savePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      notify('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (pw.next.length < 6) {
      notify('Password too short', 'New password must be at least 6 characters.');
      return;
    }
    if (pw.next !== pw.confirm) {
      notify('Passwords do not match', 'New password and confirm password must be the same.');
      return;
    }
    if (pw.next === pw.current) {
      notify('Same password', 'New password must be different from your current password.');
      return;
    }

    setPwSaving(true);

    // I-verify muna ang current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: pw.current
    });
    if (verifyError) {
      setPwSaving(false);
      notify('Incorrect password', 'Your current password is wrong.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwSaving(false);

    if (error) {
      notify('Could not update password', error.message);
      return;
    }

    closeSettings();
    notify('Success', 'Your password has been updated.');
  };

  const resetProgress = (what) => {
    const label =
      what === 'quiz' ? 'quiz progress' : what === 'game' ? 'game scores' : 'quiz progress and game scores';
    confirmAction('Reset ' + label + '?', 'This cannot be undone. Your points will go back to 0.', async () => {
      const { error } = await supabase.rpc('reset_my_progress', { what });
      if (error) {
        notify('Could not reset', error.message);
        return;
      }
      notify('Done', 'Your ' + label + ' have been reset.');
    });
  };

  const saveProfile = async () => {
    const name = nameDraft.trim();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setProfile((p) => ({ ...(p || {}), full_name: name }));
    setProfileVisible(false);
  };

  // Header: title + edit icon (admin lang) sa gitna, avatar sa kanan
  useEffect(() => {
    navigation.setOptions({
      title: banner.title,
      headerTitle: () => (
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {banner.title}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={openEdit}
              style={styles.headerEditBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Edit banner"
            >
              <Feather name="edit" size={16} color={COLORS.gold} />
            </TouchableOpacity>
          )}
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open profile menu"
        >
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
        </TouchableOpacity>
      )
    });
  }, [navigation, banner, isAdmin, profile, initial]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/calabarzon.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroTint} />
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>{banner.title}</Text>
            <Text style={styles.heroSubtitle}>{banner.subtitle}</Text>
          </View>
        </View>
        <WeaveBand />

        <View style={styles.content}>
          <Text style={styles.intro}>
            Explore the rich cultural heritage and tourist destinations of Region IV-A.
          </Text>

          {/* Featured: Map */}
          <TouchableOpacity
            style={styles.featured}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Map')}
            accessibilityRole="button"
            accessibilityLabel="Open map view"
          >
            <View style={styles.featuredMedallion}>
              <Text style={styles.featuredIcon}>🗺️</Text>
            </View>
            <View style={styles.featuredText}>
              <Text style={styles.featuredTitle}>Map View</Text>
              <Text style={styles.featuredSubtitle}>
                See every destination, filter by province, and get directions
              </Text>
            </View>
          </TouchableOpacity>

          {/* Menu list */}
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.menuList}>
            {visibleMenu.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuRow, index > 0 && styles.menuRowDivider]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={styles.menuMedallion}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* About */}
          <View style={styles.about}>
            <Text style={styles.aboutTitle}>About CALABARZON</Text>
            <View style={styles.goldRule} />

            <Text
              style={styles.aboutText}
              numberOfLines={aboutExpanded ? undefined : 6}
            >
              Region IV-A (CALABARZON), officially designated as Region IV-A, stands as the most
              populous and economically dynamic administrative region in the Philippines. Situated
              immediately southeast of Metro Manila, this contiguous landmass derives its unique name
              from the acronym of its five constituent provinces: Cavite, Laguna, Batangas, Rizal, and
              Quezon. The region seamlessly bridges the gap between rapid urban modernization and
              preserved natural heritage, hosting massive industrial parks, high-tech manufacturing
              hubs, and vital shipping ports alongside lush agricultural fields and protected mountain
              ranges.
            </Text>

            {aboutExpanded && (
              <Text style={[styles.aboutText, styles.aboutSecondParagraph]}>
                Beyond its massive economic contribution as a manufacturing engine for the country,
                CALABARZON is steeped in profound cultural and historical significance. It is the
                birthplace of national heroes like Jose Rizal and Emilio Aguinaldo, the cradle of early
                Philippine independence, and a sanctuary for traditional arts. Its diverse
                landscape, characterized by calm inland lakes, rugged volcanic ridges like Tagaytay,
                and expansive coastlines, makes it a primary destination for ecotourism and a vital
                gateway to southern Luzon.
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setAboutExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={aboutExpanded ? 'Show less' : 'Read more'}
            >
              <Text style={styles.readMore}>{aboutExpanded ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <WeaveBand />
      </ScrollView>

      {/* Edit banner (admin) */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Banner</Text>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={draft.title}
              onChangeText={(t) => setDraft((d) => ({ ...d, title: t }))}
              maxLength={40}
            />

            <Text style={styles.modalLabel}>Subtitle</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={draft.subtitle}
              onChangeText={(t) => setDraft((d) => ({ ...d, subtitle: t }))}
              multiline
              maxLength={120}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalBtn}>
                <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveBanner} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                <Text style={{ color: COLORS.white, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown ng avatar */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.ddBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.ddCard, { top: insets.top + 56 }]}>
            <Text style={styles.ddName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.ddEmail} numberOfLines={1}>
              {user?.email} · {isAdmin ? 'Admin' : 'Viewer'}
            </Text>
            <View style={styles.ddDivider} />
            <TouchableOpacity style={styles.ddItem} onPress={openProfile}>
              <Text style={styles.ddItemText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ddItem} onPress={openSettings}>
              <Text style={styles.ddItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ddItem}
              onPress={() => {
                setMenuVisible(false);
                signOut();
              }}
            >
              <Text style={[styles.ddItemText, { color: COLORS.vermilion }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Edit profile */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>My Profile</Text>

            <Text style={styles.modalLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              maxLength={60}
              placeholder="Your name"
            />

            <Text style={styles.modalLabel}>Email</Text>
            <Text style={[styles.input, { color: COLORS.muted }]}>{user?.email}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setProfileVisible(false)} style={styles.modalBtn}>
                <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProfile} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                <Text style={{ color: COLORS.white, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings: change password */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSettings}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Settings</Text>
                        <View style={styles.resetSection}>
              <Text style={styles.settingsSection}>Reset progress</Text>
              <View style={styles.resetRow}>
                <TouchableOpacity style={styles.resetBtn} onPress={() => resetProgress('quiz')}>
                  <Text style={styles.resetBtnText}>Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetBtn} onPress={() => resetProgress('game')}>
                  <Text style={styles.resetBtnText}>Game</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetBtn} onPress={() => resetProgress('all')}>
                  <Text style={styles.resetBtnText}>Both</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.settingsSection}>Change password</Text>

            <Text style={styles.modalLabel}>Current password</Text>
            <TextInput
              style={styles.input}
              value={pw.current}
              onChangeText={(t) => setPw((p) => ({ ...p, current: t }))}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Current password"
            />

            <Text style={styles.modalLabel}>New password</Text>
            <TextInput
              style={styles.input}
              value={pw.next}
              onChangeText={(t) => setPw((p) => ({ ...p, next: t }))}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="At least 6 characters"
            />

            <Text style={styles.modalLabel}>Confirm password</Text>
            <TextInput
              style={styles.input}
              value={pw.confirm}
              onChangeText={(t) => setPw((p) => ({ ...p, confirm: t }))}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Re-enter new password"
            />

            <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.showPwBtn}>
              <Feather name={showPw ? 'eye-off' : 'eye'} size={14} color={COLORS.muted} />
              <Text style={styles.showPwText}>{showPw ? 'Hide passwords' : 'Show passwords'}</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeSettings} style={styles.modalBtn}>
                <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={savePassword}
                disabled={pwSaving}
                style={[styles.modalBtn, styles.modalBtnPrimary, pwSaving && { opacity: 0.6 }]}
              >
                <Text style={{ color: COLORS.white, fontWeight: '700' }}>
                  {pwSaving ? 'Updating...' : 'Update password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.taal // tugma sa hero at sa status bar
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.paper
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0
  },

  // Header
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitleText: {
    fontFamily: SERIF,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white
  },
  headerEditBtn: {
    marginLeft: 8,
    padding: 4
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarInitial: {
    color: COLORS.taal,
    fontWeight: '700',
    fontSize: 16
  },

  // Hero
  hero: {
    height: 280,
    backgroundColor: COLORS.taal
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 59, 67, 0.28)'
  },
  heroTextBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: 'rgba(14, 59, 67, 0.82)'
  },
  heroTitle: {
    fontFamily: SERIF,
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.4
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#E8D9AE',
    lineHeight: 20
  },

  // Weave band
  weaveBand: {
    flexDirection: 'row',
    height: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.taal,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gold
  },
  weaveCell: {
    width: 14,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  weaveDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }]
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 22
  },
  intro: {
    fontFamily: SERIF,
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.ink,
    marginBottom: 22
  },

  // Featured map card
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.taal,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 18,
    marginBottom: 28
  },
  featuredMedallion: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  featuredIcon: {
    fontSize: 30
  },
  featuredText: {
    flex: 1
  },
  featuredTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4
  },
  featuredSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#CFE0E2'
  },

  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 12
  },

  // Menu list
  menuList: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 30,
    overflow: 'hidden'
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  menuRowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  menuMedallion: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  menuIcon: {
    fontSize: 22
  },
  menuText: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2
  },
  menuChevron: {
    fontSize: 26,
    color: COLORS.goldDeep,
    marginLeft: 8
  },

  // About
  about: {
    marginTop: 18,
    marginBottom: 30
  },
  aboutTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink
  },
  goldRule: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.gold,
    marginTop: 8,
    marginBottom: 14
  },
  aboutText: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 25,
    color: '#3B484B'
  },
  aboutSecondParagraph: {
    marginTop: 12
  },
  readMore: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.goldDeep
  },

  // Dropdown ng avatar
  ddBackdrop: {
    flex: 1
  },
  ddCard: {
    position: 'absolute',
    right: 12,
    width: 230,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  ddName: {
    fontFamily: SERIF,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    paddingHorizontal: 14,
    paddingTop: 6
  },
  ddEmail: {
    fontSize: 12,
    color: COLORS.muted,
    paddingHorizontal: 14,
    marginTop: 2,
    marginBottom: 8
  },
  ddDivider: {
    height: 1,
    backgroundColor: COLORS.line
  },
  ddItem: {
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  ddItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20 },
  modalTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: COLORS.ink, marginBottom: 12 },
  modalLabel: { fontSize: 13, color: COLORS.muted, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.ink
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  modalBtnPrimary: { backgroundColor: COLORS.taal },

  // Settings
  settingsSection: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.goldDeep,
    marginBottom: 2
  },
  showPwBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  showPwText: {
    fontSize: 13,
    color: COLORS.muted,
    marginLeft: 6
  },
    resetSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  resetRow: { flexDirection: 'row', marginTop: 8 },
  resetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.vermilion,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginRight: 8
  },
  resetBtnText: { color: COLORS.vermilion, fontWeight: '700', fontSize: 13 }
});