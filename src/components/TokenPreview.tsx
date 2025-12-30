import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface TokenPreviewProps {
  name: string;
  attack: number;
  health: number;
  imageUrl?: string;
  scale?: number;
}

export default function TokenPreview({
  name,
  attack,
  health,
  imageUrl,
  scale = 1,
}: TokenPreviewProps) {
  const cardWidth = 120 * scale;
  const cardHeight = 160 * scale;

  return (
    <View style={[styles.container, { width: cardWidth, height: cardHeight }]}>
      {/* Token badge */}
      <View style={[styles.tokenBadge, { top: -8 * scale, right: -8 * scale }]}>
        <Text style={[styles.tokenBadgeText, { fontSize: 8 * scale }]}>TOKEN</Text>
      </View>

      <LinearGradient
        colors={['#374151', '#1f2937', '#111827']}
        style={styles.card}
      >
        {/* Token glow border */}
        <View style={styles.glowBorder} />

        {/* Image */}
        <View style={[styles.imageContainer, { height: cardHeight * 0.5 }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={[styles.placeholderEmoji, { fontSize: 24 * scale }]}>👻</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <View style={[styles.nameContainer, { paddingVertical: 4 * scale, paddingHorizontal: 6 * scale }]}>
          <Text 
            style={[styles.name, { fontSize: 10 * scale }]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name || 'Token'}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { padding: 6 * scale }]}>
          <View style={styles.stat}>
            <Text style={[styles.statIcon, { fontSize: 10 * scale }]}>⚔️</Text>
            <Text style={[styles.statValue, { fontSize: 14 * scale }]}>{attack}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statIcon, { fontSize: 10 * scale }]}>❤️</Text>
            <Text style={[styles.statValue, { fontSize: 14 * scale }]}>{health}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tokenBadge: {
    position: 'absolute',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  tokenBadgeText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    opacity: 0.6,
  },
  nameContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.3)',
  },
  name: {
    color: '#e9d5ff',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {},
  statValue: {
    color: '#fff',
    fontWeight: '700',
  },
});

