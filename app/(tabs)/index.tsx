import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, Gift, Sparkles, RefreshCw, AlertCircle } from 'lucide-react-native';
import { CalendarEventItem } from '@/types';
import { scanCalendarEvents, getSampleEvents } from '@/services/calendar';

export default function UpcomingEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'birthday' | 'anniversary'>('all');

  const loadEvents = useCallback(async () => {
    try {
      const result = await scanCalendarEvents(90);
      setEvents(result.events);
      setPermissionGranted(result.permissionGranted);
    } catch (e) {
      console.warn('Failed to load events:', e);
      setEvents(getSampleEvents());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.eventType === filter;
  });

  const getUrgencyBadge = (days: number) => {
    if (days === 0) {
      return { text: 'Today! 🎉', bg: '#FEE2E2', textCol: '#DC2626' };
    }
    if (days === 1) {
      return { text: 'Tomorrow!', bg: '#FFEDD5', textCol: '#EA580C' };
    }
    if (days <= 3) {
      return { text: `In ${days} days`, bg: '#FEF3C7', textCol: '#D97706' };
    }
    if (days <= 7) {
      return { text: `In ${days} days`, bg: '#EEF2FF', textCol: '#4F46E5' };
    }
    return { text: `In ${days} days`, bg: '#F3F4F6', textCol: '#4B5563' };
  };

  const renderEventCard = ({ item }: { item: CalendarEventItem }) => {
    const badge = getUrgencyBadge(item.daysUntil);
    const initials = (item.contactName || item.title)
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '🎁'}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.contactName || item.title}
            </Text>
            <Text style={styles.eventTitle}>{item.title}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.textCol }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <CalendarIcon size={14} color="#6B7280" />
            <Text style={styles.dateText}>{item.eventDate}</Text>
          </View>

          <TouchableOpacity
            style={styles.giftButton}
            onPress={() =>
              router.push({
                pathname: '/event/[id]',
                params: {
                  id: item.id,
                  title: item.title,
                  name: item.contactName || item.title,
                  type: item.eventType,
                  daysUntil: item.daysUntil.toString(),
                  date: item.eventDate,
                  phone: item.contactPhone || '',
                  email: item.contactEmail || '',
                },
              })
            }
          >
            <Gift size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.giftButtonText}>Send Gift</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner if using sample data */}
      {!permissionGranted && (
        <View style={styles.permissionBanner}>
          <AlertCircle size={18} color="#D97706" style={{ marginRight: 8 }} />
          <Text style={styles.permissionText}>
            Showing sample events. Tap sync to connect your real device calendar!
          </Text>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({events.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'birthday' && styles.filterChipActive]}
          onPress={() => setFilter('birthday')}
        >
          <Text style={[styles.filterText, filter === 'birthday' && styles.filterTextActive]}>
            Birthdays 🎂
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'anniversary' && styles.filterChipActive]}
          onPress={() => setFilter('anniversary')}
        >
          <Text style={[styles.filterText, filter === 'anniversary' && styles.filterTextActive]}>
            Anniversaries 💍
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.syncIconButton} onPress={onRefresh}>
          <RefreshCw size={16} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Scanning calendars...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Sparkles size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Upcoming Events Found</Text>
              <Text style={styles.emptySub}>
                Add birthdays or anniversaries to your calendar and tap refresh.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
  },
  permissionText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  syncIconButton: {
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  headerInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  eventTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  giftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  giftButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
});
