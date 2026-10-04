import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Gift, CheckCircle, Clock, ArrowUpRight } from 'lucide-react-native';
import { GiftRecord } from '@/types';
import { getGiftsHistory } from '@/services/db';

export default function GiftHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<GiftRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const records = await getGiftsHistory();
    setHistory(records);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.recordCard}>
            <View style={styles.topRow}>
              <View style={styles.badge}>
                <CheckCircle size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>Sent via {item.brandName}</Text>
              </View>
              <Text style={styles.amountText}>${item.amount}</Text>
            </View>

            <Text style={styles.recipientName}>To: {item.recipientName}</Text>

            <View style={styles.greetingBox}>
              <Text style={styles.greetingText} numberOfLines={2}>
                "{item.greetingSent}"
              </Text>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.timeRow}>
                <Clock size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                <Text style={styles.dateText}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Gift size={32} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No Gifts Sent Yet</Text>
            <Text style={styles.emptySubtitle}>
              When you send a gift card or share an AI greeting, your history will appear here.
            </Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
              <Text style={styles.browseButtonText}>Browse Upcoming Events</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  greetingBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
