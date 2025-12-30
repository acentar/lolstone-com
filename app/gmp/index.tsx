import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { adminColors, adminSpacing, adminRadius } from '../../src/constants/adminTheme';

interface DashboardStats {
  totalCardDesigns: number;
  totalMintedCards: number;
  totalPlayers: number;
  totalDucatsCirculating: number;
  listedCards: number;
  recentTransactions: number;
}

function StatCard({ title, value, subtitle, icon, color, onPress }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Card style={styles.statCard} onPress={onPress} mode="elevated">
      <Card.Content style={styles.statCardContent}>
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </Card.Content>
    </Card>
  );
}

function QuickAction({ icon, label, description, onPress }: {
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Card style={styles.actionCard} onPress={onPress} mode="outlined">
      <Card.Content style={styles.actionContent}>
        <Text style={styles.actionIcon}>{icon}</Text>
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionDesc}>{description}</Text>
        </View>
        <Text style={styles.actionArrow}>→</Text>
      </Card.Content>
    </Card>
  );
}

export default function GMPDashboard() {
  const router = useRouter();
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
    return num.toLocaleString();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={adminColors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <Button 
            mode="contained" 
            onPress={() => router.push('/gmp/cards')}
            style={styles.headerButton}
          >
            + New Card
          </Button>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="🎨"
          title="Card Designs"
          value={formatNumber(stats.totalCardDesigns)}
          color={adminColors.accent}
          onPress={() => router.push('/gmp/cards')}
        />
        <StatCard
          icon="🃏"
          title="Minted Cards"
          value={formatNumber(stats.totalMintedCards)}
          color={adminColors.epic}
          onPress={() => router.push('/gmp/mint')}
        />
        <StatCard
          icon="👥"
          title="Players"
          value={formatNumber(stats.totalPlayers)}
          color={adminColors.success}
          onPress={() => router.push('/gmp/players')}
        />
        <StatCard
          icon="💰"
          title="Total Ducats"
          value={formatNumber(stats.totalDucatsCirculating)}
          color={adminColors.legendary}
          onPress={() => router.push('/gmp/economy')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="✨"
            label="Design New Card"
            description="Create a new card template"
            onPress={() => router.push('/gmp/cards')}
          />
          <QuickAction
            icon="⚡"
            label="Mint Cards"
            description="Create card instances"
            onPress={() => router.push('/gmp/mint')}
          />
          <QuickAction
            icon="💎"
            label="Grant Ducats"
            description="Reward players with currency"
            onPress={() => router.push('/gmp/players')}
          />
          <QuickAction
            icon="📊"
            label="View Economy"
            description="Monitor marketplace & flow"
            onPress={() => router.push('/gmp/economy')}
          />
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <Card style={styles.statusCard} mode="outlined">
          <Card.Content>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: adminColors.success }]} />
                <Text style={styles.statusLabel}>Database Connected</Text>
              </View>
              <Text style={styles.statusValue}>Healthy</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: adminColors.success }]} />
                <Text style={styles.statusLabel}>Authentication</Text>
              </View>
              <Text style={styles.statusValue}>Active</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: adminColors.warning }]} />
                <Text style={styles.statusLabel}>Marketplace</Text>
              </View>
              <Text style={styles.statusValue}>{stats.listedCards} listings</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: adminSpacing.xl,
  },
  greeting: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: adminColors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  headerButton: {
    borderRadius: adminRadius.md,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    marginLeft: adminSpacing.md,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: adminColors.textPrimary,
  },
  statTitle: {
    fontSize: 13,
    color: adminColors.textSecondary,
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: adminColors.textMuted,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: adminSpacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: adminColors.textPrimary,
    marginBottom: adminSpacing.md,
  },

  // Actions Grid
  actionsGrid: {
    gap: adminSpacing.sm,
  },
  actionCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.md,
    borderColor: adminColors.border,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.sm,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: adminSpacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: adminColors.textPrimary,
  },
  actionDesc: {
    fontSize: 13,
    color: adminColors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    color: adminColors.textMuted,
  },

  // Status Card
  statusCard: {
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.lg,
    borderColor: adminColors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.borderLight,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: adminSpacing.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: adminColors.textPrimary,
  },
  statusValue: {
    fontSize: 13,
    color: adminColors.textSecondary,
  },
});
