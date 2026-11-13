import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SERIF } from '../theme';
// Ayusin ang path na ito kung nasaan ang Supabase client mo
import { supabase } from '../services/supabase';
import MediaGrid from '../components/MediaGrid';
import MediaViewer from '../components/MediaViewer';
import { fetchUserMedia, deleteMedia } from '../services/media';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

// Dapat tugma sa PROVINCES ng QuizProvincesScreen at sa destinations.province
const PROVINCES = ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'];
const norm = (s) => String(s || '').trim().toLowerCase();

const BOARD_TOP = 20;
const MEDALS = ['🥇', '🥈', '🥉'];
const boardName = (r) =>
  r.username?.trim() ? `@${r.username.trim()}` : r.full_name?.trim() || 'Player';
const pctOf = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '–');

// Alert.alert ay hindi gumagana sa web, kaya gumamit ng window.alert doon
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function ProfileScreen() {
  const { user, isAdmin } = useAuth();

  const [profile, setProfile] = useState(null);
  const [provinceStats, setProvinceStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const viewerSize = Math.min(screenWidth - 32, 420);
  const [form, setForm] = useState({ full_name: '', username: '', bio: '', address: '' });
  const [editMode, setEditMode] = useState('all'); // 'all' | 'bio'
  const [myMedia, setMyMedia] = useState([]);
  const [tab, setTab] = useState('quiz'); // 'quiz' | 'media' | 'board'
  const [board, setBoard] = useState([]);
  const [mediaViewer, setMediaViewer] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;

    const [p, qRes, aRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, username, bio, avatar_url, address, banner_url')
        .eq('id', user.id)
        .single(),
      supabase.from('quiz_questions').select('id, destinations!inner(province)'),
      supabase.from('quiz_answers').select('question_id, is_correct').eq('user_id', user.id)
    ]);

    if (p.error) console.log('Profile load error:', p.error.message);
    if (qRes.error) console.log('Quiz questions load error:', qRes.error.message);
    if (aRes.error) console.log('Quiz answers load error:', aRes.error.message);
    if (!p.error && p.data) setProfile(p.data);

    if (!qRes.error && !aRes.error) {
      const answerMap = new Map(aRes.data.map((a) => [a.question_id, a.is_correct]));
      const buckets = {};
      PROVINCES.forEach((name) => (buckets[norm(name)] = { name, total: 0, answered: 0, correct: 0 }));

      qRes.data.forEach((q) => {
        const d = Array.isArray(q.destinations) ? q.destinations[0] : q.destinations;
        const b = buckets[norm(d?.province)];
        if (!b) return;
        b.total += 1;
        if (answerMap.has(q.id)) {
          b.answered += 1;
          if (answerMap.get(q.id)) b.correct += 1;
        }
      });
      setProvinceStats(PROVINCES.map((name) => buckets[norm(name)]));
    }
    try {
      setMyMedia(await fetchUserMedia(user.id));
    } catch (e) {
      console.log('Media load error:', e.message);
    }
    try {
      const { data: lb, error: lbError } = await supabase.rpc('get_leaderboard', { lim: 500 });
      if (lbError) console.log('Leaderboard load error:', lbError.message);
      else setBoard(lb || []);
    } catch (e) {
      console.log('Leaderboard load error:', e.message);
    }
    setLoading(false);
  }, [user?.id]);

  // I-refresh tuwing mapupunta ang screen na ito (halimbawa pagkatapos mag-quiz)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const fallbackName = user?.email?.split('@')[0] || 'User';
  const fullName = profile?.full_name?.trim();
  const username = profile?.username?.trim();
  const mainName = fullName || (username ? `@${username}` : fallbackName);
  const initial = mainName.replace('@', '').charAt(0).toUpperCase();

  // Stats mula sa quiz_answers
  const totalQuestions = provinceStats.reduce((n, s) => n + s.total, 0);
  const totalAnswered = provinceStats.reduce((n, s) => n + s.answered, 0);
  const totalCorrect = provinceStats.reduce((n, s) => n + s.correct, 0);
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  const openEdit = (mode = 'all') => {
    setForm({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
      address: profile?.address || ''
    });
    setEditMode(mode);
    setEditVisible(true);
  };

  const saveProfile = async () => {
    let next;

    if (editMode === 'bio') {
      next = { bio: form.bio.trim() || null };
    } else {
      const cleanUsername = form.username.trim().replace(/^@/, '').toLowerCase();
      if (cleanUsername && !/^[a-z0-9_.]{3,20}$/.test(cleanUsername)) {
        notify(
          'Invalid username',
          'Use 3 to 20 characters: letters, numbers, underscore, or period.'
        );
        return;
      }
      next = {
        full_name: form.full_name.trim() || null,
        username: cleanUsername || null,
        bio: form.bio.trim() || null,
        address: form.address.trim() || null
      };
    }

    setSaving(true);
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update(next)
      .eq('id', user.id)
      .select('id');
    setSaving(false);
    const error =
      updateError ||
      (!updated || updated.length === 0
        ? { message: 'Nothing was saved. Check the update permission on the profiles table.' }
        : null);

    if (error) {
      if (error.code === '23505') {
        notify('Username taken', 'Pick a different username.');
      } else {
        notify('Could not save', error.message);
      }
      return;
    }

    setProfile((p) => ({ ...(p || {}), ...next }));
    setEditVisible(false);
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow photo access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      const buffer = decode(b64);

      // Bagong filename bawat upload para hindi ma-cache ang lumang larawan
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, buffer, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { data: updated, error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)
        .select('id');
      if (dbError) throw dbError;
      if (!updated || updated.length === 0) {
        throw new Error(
          'The photo uploaded, but your profile was not updated. Check the update permission on the profiles table.'
        );
      }

      // Burahin ang lumang larawan (hindi mahalaga kung mabigo)
      const oldUrl = profile?.avatar_url;
      if (oldUrl && oldUrl.includes('/avatars/')) {
        const oldPath = oldUrl.split('/avatars/')[1];
        if (oldPath) supabase.storage.from('avatars').remove([oldPath]);
      }

      setProfile((p) => ({ ...(p || {}), avatar_url: data.publicUrl }));
    } catch (e) {
      notify('Could not update avatar', e.message || 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickBanner = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow photo access to change your banner.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 1],
      quality: 0.7
    });
    if (result.canceled) return;

    setBannerUploading(true);
    try {
      const asset = result.assets[0];
      const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      const buffer = decode(b64);

      const path = `${user.id}/banner-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, buffer, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { data: updated, error: dbError } = await supabase
        .from('profiles')
        .update({ banner_url: data.publicUrl })
        .eq('id', user.id)
        .select('id');
      if (dbError) throw dbError;
      if (!updated || updated.length === 0) {
        throw new Error('The banner uploaded, but your profile was not updated.');
      }

      // Burahin ang lumang banner (hindi mahalaga kung mabigo)
      const oldUrl = profile?.banner_url;
      if (oldUrl && oldUrl.includes('/avatars/')) {
        const oldPath = oldUrl.split('/avatars/')[1];
        if (oldPath) supabase.storage.from('avatars').remove([oldPath]);
      }

      setProfile((p) => ({ ...(p || {}), banner_url: data.publicUrl }));
    } catch (e) {
      notify('Could not update banner', e.message || 'Try again.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleDeleteMedia = async (item) => {
    try {
      await deleteMedia(item);
      setMyMedia((prev) => prev.filter((m) => m.id !== item.id));
      setMediaViewer(null);
    } catch (e) {
      notify('Could not delete', e.message || 'Try again.');
    }
  };

  const myBoardIndex = board.findIndex((r) => r.user_id === user?.id);

  const renderBoardRow = (r, rank, divider) => {
    const name = boardName(r);
    const isMe = r.user_id === user?.id;
    return (
      <View
        key={r.user_id}
        style={[styles.listRow, divider && styles.listRowDivider, isMe && styles.boardRowMe]}
      >
        <Text style={styles.boardRank}>{rank <= 3 ? MEDALS[rank - 1] : rank}</Text>
        <View style={styles.boardAvatar}>
          {r.avatar_url ? (
            <Image source={{ uri: r.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.boardAvatarInitial}>
              {name.replace('@', '').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {name}
            {isMe ? '  (you)' : ''}
          </Text>
          <Text style={styles.boardBreakdown}>
            {r.game_points} game + {r.quiz_correct} quiz = {r.points} pts
          </Text>
          <Text style={styles.boardSub} numberOfLines={2}>
            Game {r.wins}/{r.plays} ({pctOf(r.wins, r.plays)}) · Quiz {r.quiz_correct}/{r.quiz_answered} ({pctOf(r.quiz_correct, r.quiz_answered)})
          </Text>
        </View>
        <View style={styles.boardPoints}>
          <Text style={styles.boardPointsValue}>{r.points}</Text>
          <Text style={styles.boardPointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={
              profile?.banner_url
                ? { uri: profile.banner_url }
                : require('../assets/calabarzon.png')
            }
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerTint} />

          {bannerUploading && (
            <View style={styles.bannerLoading}>
              <ActivityIndicator color={COLORS.white} />
            </View>
          )}

          {/* Kanang ibaba: camera (palitan ang banner) */}
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={styles.bannerIconBtn}
              onPress={pickBanner}
              disabled={bannerUploading}
              accessibilityRole="button"
              accessibilityLabel="Change banner"
            >
              <Feather name="camera" size={16} color={COLORS.taal} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarHolder}>
            {/* Pindutin ang avatar para tingnan */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => (profile?.avatar_url ? setViewerVisible(true) : pickAvatar())}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="View profile picture"
            >
              <View style={styles.avatar}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
                {uploading && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color={COLORS.white} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Maliit na camera button para magpalit */}
            <TouchableOpacity
              style={styles.avatarBadge}
              onPress={pickAvatar}
              disabled={uploading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
            >
              <Feather name="camera" size={16} color={COLORS.taal} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Name, username, address, bio */}
        <View style={styles.identity}>
          <Text style={styles.name}>{mainName}</Text>
          {fullName && username ? <Text style={styles.username}>@{username}</Text> : null}
          <Text style={styles.email}>
            {user?.email} · {isAdmin ? 'Admin' : 'Viewer'}
          </Text>

          {profile?.address ? (
            <View style={styles.addressRow}>
              <Feather name="map-pin" size={13} color={COLORS.muted} />
              <Text style={styles.address}>{profile.address}</Text>
            </View>
          ) : null}

          {profile?.bio ? (
            <TouchableOpacity onPress={() => openEdit('bio')}>
              <Text style={styles.bio}>{profile.bio}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => openEdit('bio')}>
              <Text style={styles.bioEmpty}>Add a short bio about yourself</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => openEdit('all')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Feather name="edit-2" size={15} color={COLORS.taal} />
            <Text style={styles.editProfileText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goldRule} />

        {/* Tabs: Quiz progress | Media */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'quiz' && styles.tabBtnActive]}
            onPress={() => setTab('quiz')}
            accessibilityRole="button"
            accessibilityLabel="Quiz progress"
          >
            <Feather name="award" size={24} color={tab === 'quiz' ? COLORS.taal : COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'media' && styles.tabBtnActive]}
            onPress={() => setTab('media')}
            accessibilityRole="button"
            accessibilityLabel="My media"
          >
            <Feather name="grid" size={24} color={tab === 'media' ? COLORS.taal : COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'board' && styles.tabBtnActive]}
            onPress={() => setTab('board')}
            accessibilityRole="button"
            accessibilityLabel="Leaderboard"
          >
            <Feather
              name="bar-chart-2"
              size={24}
              color={tab === 'board' ? COLORS.taal : COLORS.muted}
            />
          </TouchableOpacity>
        </View>

        {tab === 'quiz' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz progress</Text>

            {loading ? (
              <ActivityIndicator color={COLORS.taal} style={{ marginTop: 20 }} />
            ) : (
              <>
                <View style={styles.statRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {totalAnswered}/{totalQuestions}
                    </Text>
                    <Text style={styles.statLabel}>Answered</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalCorrect}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {accuracy !== null ? `${accuracy}%` : '–'}
                    </Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                  </View>
                </View>

                {totalAnswered === 0 && (
                  <Text style={styles.empty}>
                    No answers yet. Open Quiz from the home screen and answer a question to see
                    your progress here.
                  </Text>
                )}

                <View style={styles.list}>
                  {provinceStats.map((s, i) => {
                    const pct = s.total ? s.answered / s.total : 0;
                    return (
                      <View key={s.name} style={[styles.listRow, i > 0 && styles.listRowDivider]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listTitle} numberOfLines={1}>
                            {s.name}
                          </Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                          </View>
                          <Text style={styles.listDate}>
                            {s.total === 0
                              ? 'No questions yet'
                              : `${s.answered} / ${s.total} answered · ${s.correct} correct`}
                          </Text>
                        </View>
                        {s.total > 0 && (
                          <View style={styles.pctBadge}>
                            <Text style={styles.pctText}>{Math.round(pct * 100)}%</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ) : tab === 'media' ? (
          <View style={styles.mediaSection}>
            {myMedia.length === 0 ? (
              <Text style={styles.empty}>
                No photos or videos yet. Open a destination on the map, tap Media, and capture one.
              </Text>
            ) : (
              <MediaGrid items={myMedia} onPressItem={setMediaViewer} padding={2} />
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <Text style={styles.boardCaption}>
              Points from your best round on each place in Play Game (5 for a first-try win, down to 1), plus 1 point for every correct quiz answer.
            </Text>

            {loading ? (
              <ActivityIndicator color={COLORS.taal} style={{ marginTop: 20 }} />
            ) : board.length === 0 ? (
              <Text style={styles.empty}>
                No scores yet. Play a game or answer a quiz to get on the board. on the board.
              </Text>
            ) : (
              <>
                <View style={styles.list}>
                  {board.slice(0, BOARD_TOP).map((r, i) => renderBoardRow(r, i + 1, i > 0))}
                </View>

                {myBoardIndex >= BOARD_TOP && (
                  <View style={[styles.list, { marginTop: 12 }]}>
                    {renderBoardRow(board[myBoardIndex], myBoardIndex + 1, false)}
                  </View>
                )}
                {myBoardIndex === -1 && (
                  <Text style={styles.empty}>Play a round or answer a quiz to get a rank.</Text>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* View avatar */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerVisible(false)}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: viewerSize, height: viewerSize, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : null}
          <Text style={styles.viewerName}>{mainName}</Text>
          <Text style={styles.viewerHint}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>

      {/* Edit profile */}
      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editMode === 'bio' ? 'Add bio' : 'Edit profile'}
            </Text>

            {editMode === 'all' && (
              <>
                <Text style={styles.modalLabel}>Full name</Text>
                <TextInput
                  style={styles.input}
                  value={form.full_name}
                  onChangeText={(t) => setForm((f) => ({ ...f, full_name: t }))}
                  maxLength={60}
                  placeholder="Your name"
                />

                <Text style={styles.modalLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={form.username}
                  onChangeText={(t) => setForm((f) => ({ ...f, username: t }))}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="username"
                />

                <Text style={styles.modalLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={form.address}
                  onChangeText={(t) => setForm((f) => ({ ...f, address: t }))}
                  maxLength={100}
                  placeholder="City / Province"
                />
              </>
            )}

            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              value={form.bio}
              onChangeText={(t) => setForm((f) => ({ ...f, bio: t }))}
              multiline
              maxLength={160}
              placeholder="A short line about you"
            />
            <Text style={styles.counter}>{form.bio.length}/160</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalBtn}>
                <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveProfile}
                disabled={saving}
                style={[styles.modalBtn, styles.modalBtnPrimary, saving && { opacity: 0.6 }]}
              >
                <Text style={{ color: COLORS.white, fontWeight: '700' }}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <MediaViewer
        item={mediaViewer}
        onClose={() => setMediaViewer(null)}
        canDelete
        onDelete={handleDeleteMedia}
      />
    </View>
  );
}

const AVATAR = 104;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.paper
  },
  scroll: {
    paddingBottom: 40
  },

  // Banner
  banner: {
    height: 160,
    backgroundColor: COLORS.taal,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  bannerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 59, 67, 0.45)'
  },
  bannerLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 59, 67, 0.55)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row'
  },
  bannerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },

  // Avatar
  avatarWrap: {
    alignItems: 'center',
    marginTop: -(AVATAR / 2),
    // Para hindi harangan ng wrapper ang camera button sa banner (web)
    pointerEvents: 'box-none'
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: COLORS.gold,
    borderWidth: 4,
    borderColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarInitial: {
    fontFamily: SERIF,
    fontSize: 44,
    fontWeight: '700',
    color: COLORS.taal
  },

  avatarHolder: {
    width: AVATAR,
    height: AVATAR
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 59, 67, 0.55)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gold,
    borderWidth: 3,
    borderColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center'
  },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  viewerName: {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 18
  },
  viewerHint: {
    fontSize: 12,
    color: '#9FB3B6',
    marginTop: 6
  },

  // Identity
  identity: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 12
  },
  name: {
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center'
  },
  username: {
    fontSize: 15,
    color: COLORS.goldDeep,
    fontWeight: '600',
    marginTop: 2
  },
  email: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  address: {
    fontSize: 13,
    color: COLORS.muted,
    marginLeft: 4
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16
  },
  editProfileText: {
    color: COLORS.taal,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8
  },
  bio: {
    fontFamily: SERIF,
    fontSize: 15,
    lineHeight: 24,
    color: '#3B484B',
    textAlign: 'center',
    marginTop: 14
  },
  bioEmpty: {
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'underline',
    marginTop: 14
  },

  goldRule: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.gold,
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 8
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginTop: 8
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: COLORS.taal
  },
  mediaSection: {
    paddingTop: 2
  },

  // Quiz progress
  section: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 12
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 14
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: COLORS.gold,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4
  },
  statValue: {
    fontFamily: SERIF,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.taal
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2
  },
  empty: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    paddingVertical: 12
  },
  list: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden'
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  listRowDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink
  },
  listDate: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.line,
    marginTop: 8,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.leaf
  },
  pctBadge: {
    backgroundColor: COLORS.leafSoft,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 12
  },
  pctText: {
    color: COLORS.leaf,
    fontWeight: '700',
    fontSize: 13
  },

  // Leaderboard
  boardCaption: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
    marginTop: -6,
    marginBottom: 14
  },
  boardRowMe: {
    backgroundColor: COLORS.leafSoft
  },
  boardRank: {
    width: 32,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.taal,
    textAlign: 'center'
  },
  boardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: 10
  },
  boardAvatarInitial: {
    color: COLORS.taal,
    fontWeight: '700',
    fontSize: 16
  },
  boardSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2
  },
    boardSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2
  },
  boardBreakdown: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.goldDeep,
    marginTop: 2
  },
  boardPoints: {
    alignItems: 'center',
    minWidth: 44,
    marginLeft: 10
  },
  boardPointsValue: {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.taal
  },
  boardPointsLabel: {
    fontSize: 11,
    color: COLORS.muted
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20
  },
  modalTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 12
  },
  modalLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 10,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.ink
  },
  counter: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 4
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.taal
  }
});