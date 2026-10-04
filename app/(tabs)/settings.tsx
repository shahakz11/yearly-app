import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Bell, ShieldCheck, Calendar, Heart, ExternalLink } from 'lucide-react-native';
import { getPreferences, savePreferences } from '@/services/db';
import { UserPreferences } from '@/types';
import { requestCalendarPermissions } from '@/services/calendar';
import { requestNotificationPermissions } from '@/services/notifications';

export default function SettingsScreen() {
  const [notify7Days, setNotify7Days] = useState(true);
  const [notify3Days, setNotify3Days] = useState(true);
  const [notifyDayOf, setNotifyDayOf] = useState(true);
  const [autoMatch, setAutoMatch] = useState(true);

  useEffect(() => {
    async function load() {
      const prefs = await getPreferences();
      setNotify7Days(prefs.notificationDaysBefore.includes(7));
      setNotify3Days(prefs.notificationDaysBefore.includes(3));
      setNotifyDayOf(prefs.notificationDaysBefore.includes(0));
      setAutoMatch(prefs.autoMatchContacts);
    }
    load();
  }, []);

  const handleUpdate = async () => {
    const days: number[] = [];
    if (notify7Days) days.push(7);
    if (notify3Days) days.push(3);
    if (notifyDayOf) days.push(0);

    await savePreferences({
      notificationDaysBefore: days,
      notificationHour: 9,
      autoMatchContacts: autoMatch,
      selectedCalendarIds: [],
    });
  };

  const handleCheckPermissions = async () => {
    const cal = await requestCalendarPermissions();
    const notif = await requestNotificationPermissions();
    Alert.alert(
      'Permissions Status',
      `Calendar Access: ${cal ? '✅ Connected' : '❌ Disabled'}\nNotifications: ${
        notif ? '✅ Enabled' : '❌ Disabled'
      }`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Privacy Guarantee Card */}
      <View style={styles.privacyCard}>
        <View style={styles.privacyIconRow}>
          <ShieldCheck size={24} color="#16A34A" />
          <Text style={styles.privacyTitle}>100% On-Device Privacy</Text>
        </View>
        <Text style={styles.privacyDesc}>
          Auto-gifter is built local-first. Your calendars, contacts, and personal dates never leave
          your phone. No external databases, no data selling.
        </Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SMART NUDGE SCHEDULE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>7 Days in Advance</Text>
              <Text style={styles.rowSub}>Early reminder to plan ahead</Text>
            </View>
            <Switch
              value={notify7Days}
              onValueChange={(v) => {
                setNotify7Days(v);
                handleUpdate();
              }}
              trackColor={{ true: '#6366F1' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>3 Days in Advance</Text>
              <Text style={styles.rowSub}>Action prompt to pick a gift card</Text>
            </View>
            <Switch
              value={notify3Days}
              onValueChange={(v) => {
                setNotify3Days(v);
                handleUpdate();
              }}
              trackColor={{ true: '#6366F1' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Day-of Morning Alert</Text>
              <Text style={styles.rowSub}>9:00 AM celebration message</Text>
            </View>
            <Switch
              value={notifyDayOf}
              onValueChange={(v) => {
                setNotifyDayOf(v);
                handleUpdate();
              }}
              trackColor={{ true: '#6366F1' }}
            />
          </View>
        </View>
      </View>

      {/* Integrations & Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SYSTEM ACCESS</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleCheckPermissions}>
            <View>
              <Text style={styles.rowTitle}>Calendar & Notification Access</Text>
              <Text style={styles.rowSub}>Check system permission status</Text>
            </View>
            <ExternalLink size={18} color="#6366F1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Auto-Match Contacts</Text>
              <Text style={styles.rowSub}>Find recipient phone/email automatically</Text>
            </View>
            <Switch
              value={autoMatch}
              onValueChange={(v) => {
                setAutoMatch(v);
                handleUpdate();
              }}
              trackColor={{ true: '#6366F1' }}
            />
          </View>
        </View>
      </View>

      {/* Affiliate & About */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.aboutText}>
            Auto-gifter v1.0.0 (MVP)
            {'\n\n'}
            Disclosure: Auto-gifter partners with brands via affiliate networks (e.g. Giftcards.com,
            DoorDash, Starbucks, Amazon). When you purchase a gift card through partner links, we may
            earn a commission at no additional cost to you.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  privacyCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  privacyDesc: {
    fontSize: 13,
    color: '#15803D',
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rowSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  aboutText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
