import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Feather } from '@expo/vector-icons';

export function VideoPlayer({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return <VideoView player={player} style={style} nativeControls contentFit="contain" />;
}

const confirmDelete = (onYes) => {
  if (Platform.OS === 'web') {
    if (window.confirm('Delete this media?')) onYes();
    return;
  }
  Alert.alert('Delete media', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onYes }
  ]);
};

export default function MediaViewer({ item, onClose, canDelete, onDelete }) {
  const { width, height } = useWindowDimensions();
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const mediaStyle = { width, height: height * 0.7 };
  const caption = item.destinations?.name;
  const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

  const handleDelete = () =>
    confirmDelete(async () => {
      setBusy(true);
      try {
        await onDelete(item);
      } finally {
        setBusy(false);
      }
    });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.top}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Feather name="x" size={26} color="#fff" />
            </TouchableOpacity>
            {canDelete ? (
              busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <TouchableOpacity onPress={handleDelete} hitSlop={12}>
                  <Feather name="trash-2" size={22} color="#fff" />
                </TouchableOpacity>
              )
            ) : (
              <View />
            )}
          </View>

          <View style={styles.center}>
            {item.media_type === 'video' ? (
              <VideoPlayer key={item.id} uri={item.url} style={mediaStyle} />
            ) : (
              <Image source={{ uri: item.url }} style={mediaStyle} resizeMode="contain" />
            )}
          </View>

          <View style={styles.bottom}>
            {!!caption && <Text style={styles.caption}>{caption}</Text>}
            {!!date && <Text style={styles.date}>{date}</Text>}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  caption: { color: '#fff', fontSize: 16, fontWeight: '700' },
  date: { color: '#9FB3B6', fontSize: 12, marginTop: 2 }
});