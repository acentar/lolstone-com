import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthContext } from '../../src/context/AuthContext';
import { CardDesign, CardRarity } from '../../src/types/database';
import CardPreview from '../../src/components/CardPreview';
import { colors, spacing } from '../../src/constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

const RARITY_FILTERS: CardRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_COLORS: Record<CardRarity, { primary: string; glow: string }> = {
  common: { primary: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)' },
  uncommon: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
  rare: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  epic: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  legendary: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
};

interface TradeListing {
  id: string;
  card_instance_id: string;
  card_design: CardDesign;
  seller_id: string;
  seller_name: string;
  price_ducats: number;
  created_at: string;
}

export default function TradeScreen() {
  const router = useRouter();
  const { player } = useAuthContext();
  const { width: screenWidth } = useWindowDimensions();
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<CardRarity | null>(null);

  useEffect(() => {
    loadListings();
  }, [player?.id]);

  const loadListings = async () => {
    setLoading(true);
    try {
      // For now, show a placeholder - in the future this would query a trades/marketplace table
      // This is a placeholder implementation
      setListings([]);
    } catch (error) {
      console.error('Error loading trade listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = searchQuery === '' || 
      listing.card_design.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === null || 
      listing.card_design.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Trade Marketplace</Text>
            <Text style={styles.subtitle}>
              Buy and sell cards with other players
            </Text>
          </View>

          {/* Search & Filter */}
          <View style={styles.filterSection}>
            <Searchbar
              placeholder="Search cards..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              iconColor="#94a3b8"
              placeholderTextColor="#64748b"
            />
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterChips}
            >
              <Chip
                selected={rarityFilter === null}
                onPress={() => setRarityFilter(null)}
                style={styles.chip}
                textStyle={styles.chipText}
              >
                All
              </Chip>
              {RARITY_FILTERS.map((rarity) => (
                <Chip
                  key={rarity}
                  selected={rarityFilter === rarity}
                  onPress={() => setRarityFilter(rarityFilter === rarity ? null : rarity)}
                  style={[styles.chip, { borderColor: RARITY_COLORS[rarity].primary }]}
                  textStyle={styles.chipText}
                >
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Listings */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading marketplace...</Text>
            </View>
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔄</Text>
              <Text style={styles.emptyTitle}>
                {listings.length === 0 ? 'No Listings Yet' : 'No Matches'}
              </Text>
              <Text style={styles.emptyText}>
                {listings.length === 0 
                  ? 'The marketplace is empty. Be the first to list a card for trade!'
                  : 'Try adjusting your search or filters.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listingsGrid}>
              {filteredListings.map((listing) => (
                <Animated.View
                  key={listing.id}
                  entering={FadeIn.duration(300)}
                  style={styles.listingCard}
                >
                  <Pressable
                    style={styles.cardWrapper}
                    onPress={() => router.push(`/card/${listing.card_design.id}`)}
                  >
                    <CardPreview
                      name={listing.card_design.name}
                      manaCost={listing.card_design.mana_cost}
                      attack={listing.card_design.attack ?? undefined}
                      health={listing.card_design.health ?? undefined}
                      rarity={listing.card_design.rarity}
                      category={listing.card_design.category}
                      abilityText={listing.card_design.ability_text || ''}
                      flavorText={listing.card_design.flavor_text || ''}
                      imageUrl={listing.card_design.image_url}
                      scale={0.5}
                      showCollectibleInfo={false}
                    />
                    <View style={styles.listingInfo}>
                      <Text style={styles.priceText}>
                        {listing.price_ducats.toLocaleString()} ducats
                      </Text>
                      <Text style={styles.sellerText}>
                        by {listing.seller_name}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 82,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentWrapper: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchbar: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  searchInput: {
    color: colors.textPrimary,
  },
  filterChips: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listingCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  cardWrapper: {
    alignItems: 'center',
  },
  listingInfo: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sellerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
