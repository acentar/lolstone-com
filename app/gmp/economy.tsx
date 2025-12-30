import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, ProgressBar, DataTable, Divider } from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { Transaction } from '../../src/types/database';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

interface EconomyStats {
  totalDucats: number;
  totalPlayers: number;
  avgBalance: number;
  totalTransactions: number;
  listedCards: number;
  marketplaceVolume: number;
}

const TRANSACTION_LABELS: Record<string, { label: string; color: string }> = {
  mint: { label: 'Mint', color: adminColors.accent },
  grant_ducats: { label: 'Grant', color: adminColors.legendary },
  purchase: { label: 'Purchase', color: adminColors.success },
  reward: { label: 'Reward', color: adminColors.epic },
  trade: { label: 'Trade', color: adminColors.info },
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Economy Overview</Text>
        <Text style={styles.subtitle}>Monitor ducats flow and marketplace activity</Text>
      </View>

      {/* Main Stat */}
      <Card style={styles.mainStatCard} mode="elevated">
        <Card.Content style={styles.mainStatContent}>
          <Text style={styles.mainStatIcon}>💎</Text>
          <View style={styles.mainStatInfo}>
            <Text style={styles.mainStatValue}>{formatNumber(stats.totalDucats)}</Text>
            <Text style={styles.mainStatLabel}>Total Ducats in Circulation</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard} mode="elevated">
          <Card.Content style={styles.statContent}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statValue}>{stats.totalPlayers}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard} mode="elevated">
          <Card.Content style={styles.statContent}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{formatNumber(stats.avgBalance)}</Text>
            <Text style={styles.statLabel}>Avg Balance</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard} mode="elevated">
          <Card.Content style={styles.statContent}>
            <Text style={styles.statIcon}>🏪</Text>
            <Text style={styles.statValue}>{stats.listedCards}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard} mode="elevated">
          <Card.Content style={styles.statContent}>
            <Text style={styles.statIcon}>📜</Text>
            <Text style={styles.statValue}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Marketplace Volume */}
      <Card style={styles.volumeCard} mode="outlined">
        <Card.Content>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeTitle}>Marketplace Volume</Text>
            <Chip compact style={styles.volumeChip}>🛒 {formatNumber(stats.marketplaceVolume)}</Chip>
          </View>
          <ProgressBar 
            progress={0.35} 
            color={adminColors.accent}
            style={styles.volumeBar}
          />
          <Text style={styles.volumeNote}>Total value of marketplace transactions</Text>
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {transactions.length === 0 ? (
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.tableCard} mode="outlined">
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Type</DataTable.Title>
                <DataTable.Title>Description</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
                <DataTable.Title numeric>Time</DataTable.Title>
              </DataTable.Header>

              {transactions.map((tx) => {
                const txInfo = TRANSACTION_LABELS[tx.type] || { label: tx.type, color: adminColors.textMuted };
                return (
                  <DataTable.Row key={tx.id}>
                    <DataTable.Cell>
                      <Chip compact style={{ backgroundColor: txInfo.color + '20' }}>
                        <Text style={{ color: txInfo.color, fontSize: 11 }}>{txInfo.label}</Text>
                      </Chip>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description || '—'}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      {tx.ducats_amount ? (
                        <Text style={styles.txAmount}>+{tx.ducats_amount.toLocaleString()}</Text>
                      ) : '—'}
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text style={styles.txTime}>{formatDate(tx.created_at)}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </Card>
        )}
      </View>

      {/* System Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <Card style={styles.healthCard} mode="outlined">
          <Card.Content>
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <View style={[styles.healthDot, { backgroundColor: adminColors.success }]} />
                <Text style={styles.healthLabel}>Ducat Distribution</Text>
              </View>
              <Text style={styles.healthValue}>Balanced</Text>
            </View>
            <Divider style={styles.healthDivider} />
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <View style={[styles.healthDot, { backgroundColor: adminColors.success }]} />
                <Text style={styles.healthLabel}>Marketplace</Text>
              </View>
              <Text style={styles.healthValue}>Active</Text>
            </View>
            <Divider style={styles.healthDivider} />
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <View style={[styles.healthDot, { backgroundColor: adminColors.warning }]} />
                <Text style={styles.healthLabel}>Card Supply</Text>
              </View>
              <Text style={styles.healthValue}>Monitoring</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  content: {
    padding: adminSpacing.lg,
  },

  // Header
  header: {
    marginBottom: adminSpacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: adminColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginTop: 4,
  },

  // Main Stat
  mainStatCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    marginBottom: adminSpacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: adminColors.legendary,
  },
  mainStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
  },
  mainStatIcon: {
    fontSize: 40,
    marginRight: adminSpacing.md,
  },
  mainStatInfo: {
    flex: 1,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: adminColors.legendary,
  },
  mainStatLabel: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginTop: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
  },
  statContent: {
    alignItems: 'center',
    padding: adminSpacing.md,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: adminSpacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: adminColors.textSecondary,
    marginTop: 4,
  },

  // Volume Card
  volumeCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },
  volumeChip: {
    backgroundColor: adminColors.successLight,
  },
  volumeBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: adminSpacing.sm,
  },
  volumeNote: {
    fontSize: 12,
    color: adminColors.textMuted,
  },

  // Section
  section: {
    marginBottom: adminSpacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.md,
  },

  // Empty State
  emptyCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
  },
  emptyContent: {
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: adminSpacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: adminColors.textMuted,
  },

  // Table
  tableCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  txDesc: {
    fontSize: 13,
    color: adminColors.textPrimary,
  },
  txAmount: {
    fontSize: 13,
    color: adminColors.success,
    fontWeight: '600',
  },
  txTime: {
    fontSize: 12,
    color: adminColors.textMuted,
  },

  // Health Card
  healthCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: adminSpacing.sm,
  },
  healthLabel: {
    fontSize: 14,
    color: adminColors.textPrimary,
  },
  healthValue: {
    fontSize: 13,
    color: adminColors.textSecondary,
  },
  healthDivider: {
    backgroundColor: adminColors.borderLight,
  },
});
