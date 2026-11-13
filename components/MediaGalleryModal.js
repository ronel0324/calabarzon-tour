import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme';
import MediaGrid from './MediaGrid';
import MediaViewer, { VideoPlayer } from './MediaViewer';
import { fetchDestinationMedia, uploadMedia, deleteMedia, notify } from '../services/media';

const PAD = 3;

export default function MediaGalleryModal({ visible, destination, onClose }) {
  const { user, isAdmin } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [preview, setPreview] = useState(null); // asset na kakakuha pa lang
  const [uploading, setUploading] = useState(false);
  const [viewerItem, setViewerItem] = useState(null);

  useEffect(() => {
    if (!visible || !destination?.id) return;
    let alive = true;
    setItems([]);
    setLoading(true);
    fetchDestinationMedia(destination.id)
      .then((data) => alive && setItems(data))
      .catch((e) => notify('Could not load media', e.message || 'Try again.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [visible, destination?.id]);

  const capture = async (kind) => {
    setSheetVisible(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow camera access to capture photos and videos.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: [kind === 'video' ? 'videos' : 'images'],
        quality: 0.7,
        videoMaxDuration: 30,
        base: kind === 'photo'
      });
      if (result.canceled) return;
      setPreview(result.assets[0]);
    } catch (e) {
      notify('Could not open camera', e.message || 'Try again.');
    }
  };

  const savePreview = async () => {
    if (!preview || uploading) return;
    setUploading(true);
    try {
      const row = await uploadMedia({
        asset: preview,
        destinationId: destination.id,
        userId: user.id
      });
      setItems((prev) => [row, ...prev]);
      setPreview(null);
    } catch (e) {
      notify('Could not save', e.message || 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteMedia(item);
      setItems((prev) => prev.filter((m) => m.id !== item.id));
      setViewerItem(null);
    } catch (e) {
      notify('Could not delete', e.message || 'Try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close media">
            <Feather name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {destination?.name || 'Media'}
            </Text>
            <Text style={styles.sub}>
              {items.length} {items.length === 1 ? 'photo/video' : 'photos & videos'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setSheetVisible(true)}
            disabled={uploading}
            accessibilityLabel="Capture photo or video"
          >
            <Feather name="camera" size={20} color={COLORS.taal} />
          </TouchableOpacity>
        </View>

        {/* Gallery */}
        <ScrollView style={styles.body} contentContainerStyle={{ padding: PAD }}>
          {loading ? (
            <ActivityIndicator color={COLORS.taal} style={{ marginTop: 40 }} />
          ) : items.length === 0 ? (
            <Text style={styles.empty}>
              No photos or videos yet. Tap the camera icon to be the first to add one.
            </Text>
          ) : (
            <MediaGrid items={items} onPressItem={setViewerItem} padding={PAD} />
          )}
        </ScrollView>

        {/* Pumili: photo o video */}
        {sheetVisible && (
          <View style={styles.overlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSheetVisible(false)}
            />
            <View style={styles.sheet}>
              <TouchableOpacity style={styles.sheetRow} onPress={() => capture('photo')}>
                <Feather name="camera" size={20} color={COLORS.taal} />
                <Text style={styles.sheetText}>Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetRow} onPress={() => capture('video')}>
                <Feather name="video" size={20} color={COLORS.taal} />
                <Text style={styles.sheetText}>Record video (max 30 sec)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetRow} onPress={() => setSheetVisible(false)}>
                <Feather name="x" size={20} color={COLORS.muted} />
                <Text style={[styles.sheetText, { color: COLORS.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preview: check = i-save, X = itapon */}
        {preview && (
          <View style={styles.previewWrap}>
            <View style={{ flex: 1 }}>
              {preview.type === 'video' ? (
                <VideoPlayer uri={preview.uri} style={{ flex: 1 }} />
              ) : (
                <Image source={{ uri: preview.uri }} style={{ flex: 1 }} resizeMode="contain" />
              )}
            </View>
            <View style={styles.previewBar}>
              <TouchableOpacity
                style={[styles.roundBtn, styles.discardBtn]}
                onPress={() => setPreview(null)}
                disabled={uploading}
                accessibilityLabel="Discard"
              >
                <Feather name="x" size={26} color="#fff" />
              </TouchableOpacity>
              {uploading && <ActivityIndicator color="#fff" />}
              <TouchableOpacity
                style={[styles.roundBtn, styles.saveBtn, uploading && { opacity: 0.5 }]}
                onPress={savePreview}
                disabled={uploading}
                accessibilityLabel="Save to gallery"
              >
                <Feather name="check" size={26} color={COLORS.taal} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>

      <MediaViewer
        item={viewerItem}
        onClose={() => setViewerItem(null)}
        canDelete={!!viewerItem && (viewerItem.user_id === user?.id || isAdmin)}
        onDelete={handleDelete}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.taal },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold
  },
  headerText: { flex: 1, marginHorizontal: 14 },
  title: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  sub: { color: '#CFE0E2', fontSize: 12, marginTop: 2 },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: { flex: 1, backgroundColor: COLORS.paper },
  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 40,
    paddingHorizontal: 30
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8
  },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 22 },
  sheetText: { fontSize: 16, color: COLORS.ink, marginLeft: 14, fontWeight: '600' },

  previewWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  previewBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 18
  },
  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  discardBtn: { backgroundColor: '#B8372F' },
  saveBtn: { backgroundColor: COLORS.gold }
});