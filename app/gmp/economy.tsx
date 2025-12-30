import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { Transaction } from '../../src/types/database';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/constants/theme';

interface EconomyStats {
  totalDucats: number;
  totalPlayers: number;
  avgBalance: number;
  totalTransactions: number;
  listedCards: number;
  marketplaceVolume: number;
}

const TRANSACTION_ICONS: Record<string, string> = {
  mint: '⚡',
  grant_ducats: '💰',
  purchase: '🛒',
  reward: '🎁',
  trade: '🔄',
};

export default function EconomyScreen() {
  const [stats, setStats] = useState<EconomyStats>({
    totalDucats: 0,
    totalPlayers: 0,
    avgBalance: 0,
    totalTransactions: 0,
    listedCards: 0,
    marketplaceVolume: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch stats
      const [
        { data: playersData },
        { count: transactionsCount },
        { count: listedCount },
        { data: purchaseData },
        { data: recentTransactions },
      ] = await Promise.all([
        supabase.from('players').select('ducats'),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('card_instances').select('*', { count: 'exact', head: true }).eq('is_listed', true),
        supabase.from('transactions').select('ducats_amount').eq('type', 'purchase'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      const totalDucats = playersData?.reduce((sum, p) => sum + (p.ducats || 0), 0) || 0;
      const playerCount = playersData?.length || 0;
      const marketVolume = purchaseData?.reduce((sum, t) => sum + (t.ducats_amount || 0), 0) || 0;

      setStats({
        totalDucats,
        totalPlayers: playerCount,
        avgBalance: playerCount > 0 ? Math.round(totalDucats / playerCount) : 0,
        totalTransactions: transactionsCount || 0,
        listedCards: listedCount || 0,
        marketplaceVolume: marketVolume,
      });

      setTransactions(recentTransactions || []);
    } catch (error) {
      console.error('Error fetching economy data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💰 Economy Overview</Text>
        <Text style={styles.subtitle}>Monitor ducats flow and marketplace activity</Text>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStatsGrid}>
        <View style={[styles.mainStatCard, styles.mainStatPrimary]}>
          <Text style={styles.mainStatEmoji}>💎</Text>
          <Text style={styles.mainStatValue}>{formatNumber(stats.totalDucats)}</Text>
          <Text style={styles.mainStatLabel}>Total Ducats in Circulation</Text>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={styles.statValue}>{stats.totalPlayers}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statValue}>{formatNumber(stats.avgBalance)}</Text>
          <Text style={styles.statLabel}>Avg Balance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🏪</Text>
          <Text style={styles.statValue}>{stats.listedCards}</Text>
          <Text style={styles.statLabel}>Listed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📜</Text>
          <Text style={styles.statValue}>{stats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {/* Marketplace Volume */}
      <View style={styles.volumeCard}>
        <View style={styles.volumeHeader}>
          <Text style={styles.volumeTitle}>Marketplace Volume</Text>
          <Text style={styles.volumeValue}>🛒 {formatNumber(stats.marketplaceVolume)} ducats</Text>
        </View>
        <View style={styles.volumeBar}>
          <View style={[styles.volumeProgress, { width: '35%' }]} />
        </View>
        <Text style={styles.volumeNote}>Total value of all marketplace purchases</Text>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionIconText}>
                    {TRANSACTION_ICONS[tx.type] || '📝'}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {tx.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.transactionDesc} numberOfLines={1}>
                    {tx.description || 'Transaction'}
                  </Text>
                </View>
                <View style={styles.transactionMeta}>
                  {tx.ducats_amount && (
                    <Text style={styles.transactionAmount}>
                      +{tx.ducats_amount.toLocaleString()}
                    </Text>
                  )}
                  <Text style={styles.transactionTime}>
                    {formatDate(tx.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Economy Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Economy Health</Text>
        <View style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View style={styles.healthIndicator} />
            <Text style={styles.healthText}>Ducat distribution: Balanced</Text>
          </View>
          <View style={styles.healthRow}>
            <View style={styles.healthIndicator} />
            <Text style={styles.healthText}>Marketplace: Active</Text>
          </View>
          <View style={styles.healthRow}>
            <View style={[styles.healthIndicator, styles.healthWarning]} />
            <Text style={styles.healthText}>Card supply: Monitoring</Text>
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

  // Header
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Main Stats
  mainStatsGrid: {
    marginBottom: spacing.lg,
  },
  mainStatCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    ...shadows.lg,
  },
  mainStatPrimary: {
    borderColor: colors.legendary,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  mainStatEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  mainStatValue: {
    ...typography.h1,
    color: colors.legendary,
    fontSize: 48,
  },
  mainStatLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  // Secondary Stats
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  // Volume Card
  volumeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  volumeTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  volumeValue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  volumeBar: {
    height: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  volumeProgress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  volumeNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
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

  // Transactions
  emptyTransactions: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  transactionsList: {
    gap: spacing.sm,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionType: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 10,
  },
  transactionDesc: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginTop: 2,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },
  transactionTime: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  // Health Card
  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  healthWarning: {
    backgroundColor: colors.warning,
  },
  healthText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

