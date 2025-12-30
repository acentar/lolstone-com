import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/constants/theme';

interface DashboardStats {
  totalCardDesigns: number;
  totalMintedCards: number;
  totalPlayers: number;
  totalDucatsCirculating: number;
  listedCards: number;
  recentTransactions: number;
}

function StatCard({ emoji, label, value, color }: { 
  emoji: string; 
  label: string; 
  value: number | string;
  color?: string;
}) {
  return (
    <View style={[styles.statCard, color && { borderColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function GMPDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCardDesigns: 0,
    totalMintedCards: 0,
    totalPlayers: 0,
    totalDucatsCirculating: 0,
    listedCards: 0,
    recentTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        { count: designsCount },
        { count: instancesCount },
        { count: playersCount },
        { data: ducatsData },
        { count: listedCount },
        { count: transactionsCount },
      ] = await Promise.all([
        supabase.from('card_designs').select('*', { count: 'exact', head: true }),
        supabase.from('card_instances').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('players').select('ducats'),
        supabase.from('card_instances').select('*', { count: 'exact', head: true }).eq('is_listed', true),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
      ]);

      const totalDucats = ducatsData?.reduce((sum, p) => sum + (p.ducats || 0), 0) || 0;

      setStats({
        totalCardDesigns: designsCount || 0,
        totalMintedCards: instancesCount || 0,
        totalPlayers: playersCount || 0,
        totalDucatsCirculating: totalDucats,
        listedCards: listedCount || 0,
        recentTransactions: transactionsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Control Center</Text>
        <Text style={styles.welcomeSubtitle}>
          Manage your chaotic card game empire
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard 
          emoji="🎨" 
          label="Card Designs" 
          value={formatNumber(stats.totalCardDesigns)}
          color={colors.primary}
        />
        <StatCard 
          emoji="🃏" 
          label="Minted Cards" 
          value={formatNumber(stats.totalMintedCards)}
          color={colors.secondary}
        />
        <StatCard 
          emoji="👥" 
          label="Players" 
          value={formatNumber(stats.totalPlayers)}
          color={colors.info}
        />
        <StatCard 
          emoji="💰" 
          label="Ducats Total" 
          value={formatNumber(stats.totalDucatsCirculating)}
          color={colors.legendary}
        />
        <StatCard 
          emoji="🏪" 
          label="Listed Cards" 
          value={formatNumber(stats.listedCards)}
          color={colors.rare}
        />
        <StatCard 
          emoji="📜" 
          label="Transactions" 
          value={formatNumber(stats.recentTransactions)}
          color={colors.epic}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={[styles.actionCard, styles.actionDesign]}>
            <Text style={styles.actionEmoji}>✨</Text>
            <Text style={styles.actionText}>Design New Card</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, styles.actionMint]}>
            <Text style={styles.actionEmoji}>⚡</Text>
            <Text style={styles.actionText}>Mint Cards</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, styles.actionGrant]}>
            <Text style={styles.actionEmoji}>💎</Text>
            <Text style={styles.actionText}>Grant Ducats</Text>
          </Pressable>
          <Pressable style={[styles.actionCard, styles.actionPlayer]}>
            <Text style={styles.actionEmoji}>👤</Text>
            <Text style={styles.actionText}>Add Player</Text>
          </Pressable>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Supabase Connected</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Game Master Authenticated</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, styles.statusPending]} />
            <Text style={styles.statusText}>Marketplace: Ready</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  
  // Welcome
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: 10,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionDesign: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
  },
  actionMint: {
    borderColor: colors.secondary,
    backgroundColor: 'rgba(255, 0, 110, 0.05)',
  },
  actionGrant: {
    borderColor: colors.legendary,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  actionPlayer: {
    borderColor: colors.info,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // Status
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusPending: {
    backgroundColor: colors.warning,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

