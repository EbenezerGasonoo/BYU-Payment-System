import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../api/api';
import { colors, WEST_AFRICA_COUNTRIES } from '../theme/colors';
import VirtualCard from '../components/VirtualCard';
import StatusTimeline from '../components/StatusTimeline';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!user?.byuId) return;
    try {
      const res = await studentAPI.getDashboard(user.byuId);
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const studentCountry = WEST_AFRICA_COUNTRIES[user?.countryCode] || WEST_AFRICA_COUNTRIES.GH;
  const requests = dashboardData?.requests || [];
  const latestRequest = requests[0] || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPurple} />}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Student'} 👋</Text>
          <View style={styles.countryTag}>
            <Text style={styles.countryFlag}>{studentCountry.flag}</Text>
            <Text style={styles.countryTagText}>{studentCountry.name} Student Account</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Feather name="user" size={20} color={colors.textMain} />
        </TouchableOpacity>
      </View>

      {/* Main Virtual Card Visualizer */}
      <VirtualCard
        cardData={latestRequest}
        studentName={user?.name}
        byuId={user?.byuId}
      />

      {/* Quick Action Button */}
      <TouchableOpacity
        style={styles.requestBanner}
        onPress={() => navigation.navigate('RequestTab')}
      >
        <View style={styles.requestBannerLeft}>
          <View style={styles.bannerIcon}>
            <Feather name="plus-circle" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Request New Virtual Card</Text>
            <Text style={styles.bannerSub}>Pay tuition, books &amp; BYU Pathway fees</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Status Lifecycle Timeline */}
      {latestRequest && (
        <StatusTimeline status={latestRequest.status} />
      )}

      {/* Recent Requests Feed */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Virtual Cards</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CardStatus')}>
          <Text style={styles.seeAllText}>See All ({requests.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accentPurple} style={{ marginVertical: 20 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="credit-card" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Virtual Cards Requested Yet</Text>
          <Text style={styles.emptySub}>Tap below to create your first USD card for BYU Pathway.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('RequestTab')}
          >
            <Text style={styles.emptyBtnText}>+ Request USD Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        requests.slice(0, 3).map((req) => (
          <TouchableOpacity
            key={req._id || req.id}
            style={styles.requestItem}
            onPress={() => navigation.navigate('CardStatus', { requestToken: req.requestToken })}
          >
            <View style={styles.requestItemLeft}>
              <View style={styles.requestIcon}>
                <Feather name="credit-card" size={18} color={colors.accentPurple} />
              </View>
              <View>
                <Text style={styles.requestAmount}>${req.amount} USD Card</Text>
                <Text style={styles.requestToken}>Token: {req.requestToken?.slice(0, 12)}...</Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.requestGhs}>
                {studentCountry.currency} {Number(req.totalPaidGHS || 0).toFixed(2)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: req.status === 'assigned' || req.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: req.status === 'assigned' || req.status === 'paid' ? colors.accentGreen : colors.accentYellow },
                  ]}
                >
                  {(req.status || 'pending').toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 46,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  countryFlag: {
    fontSize: 14,
  },
  countryTagText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  requestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentIndigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.accentPurple,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: colors.accentIndigo,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  requestItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  requestToken: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  requestGhs: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accentGreen,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

export default HomeScreen;
