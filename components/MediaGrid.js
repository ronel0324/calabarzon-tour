import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const COLS = 3;
const GAP = 3;

export default function MediaGrid({ items, onPressItem, padding = 0 }) {
  const { width } = useWindowDimensions();
  const size = Math.floor((width - padding * 2 - GAP * (COLS - 1)) / COLS);

  return (
    <View style={styles.wrap}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.85}
          onPress={() => onPressItem(item)}
          style={{
            width: size,
            height: size,
            marginRight: (i + 1) % COLS === 0 ? 0 : GAP,
            marginBottom: GAP
          }}
        >
          {item.media_type === 'photo' ? (
            <Image source={{ uri: item.url }} style={styles.fill} resizeMode="cover" />
          ) : (
            <View style={[styles.fill, styles.videoTile]}>
              <Feather name="play-circle" size={32} color="#fff" />
            </View>
          )}
          {item.media_type === 'video' && (
            <View style={styles.badge}>
              <Feather name="video" size={11} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  fill: { width: '100%', height: '100%', backgroundColor: '#E1E3DA' },
  videoTile: { backgroundColor: '#1D2A2E', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    padding: 4
  }
});