import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Gift, Phone, Mail, UserPlus, Heart } from 'lucide-react-native';
import { CalendarEventItem } from '@/types';
import { scanCalendarEvents, getSampleEvents } from '@/services/calendar';

export default function ContactsDirectoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await scanCalendarEvents(365);
        setEvents(res.events);
      } catch {
        setEvents(getSampleEvents());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = events.filter((e) => {
    const query = search.toLowerCase();
    return (
      (e.contactName && e.contactName.toLowerCase().includes(query)) ||
      e.title.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people or celebrations..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = item.contactName || item.title;
            const initials = name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <View style={styles.personCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials || '🎁'}</Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.dateLabel}>
                    {item.eventType === 'birthday' ? '🎂 Birthday' : '💍 Anniversary'}:{' '}
                    {item.eventDate} (in {item.daysUntil} days)
                  </Text>
                  <View style={styles.badgesRow}>
                    {item.contactPhone && (
                      <View style={styles.contactBadge}>
                        <Phone size={10} color="#4B5563" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeText}>{item.contactPhone}</Text>
                      </View>
                    )}
                    {item.contactEmail && (
                      <View style={styles.contactBadge}>
                        <Mail size={10} color="#4B5563" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeText}>{item.contactEmail}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionButton}
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
                  <Gift size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>
            );
          }}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  contactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#4B5563',
  },
  actionButton: {
    padding: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
