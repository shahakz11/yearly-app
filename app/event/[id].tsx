import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import {
  Gift,
  Sparkles,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Heart,
  MessageCircle,
} from 'lucide-react-native';
import { GIFT_BRANDS } from '@/constants/giftBrands';
import { GiftBrand } from '@/types';
import { generateGreeting, GreetingTone, formatShareableMessage } from '@/services/aiGreeting';
import { buildPartnerCheckoutUrl } from '@/services/deeplink';
import { recordGiftSent } from '@/services/db';

export default function EventGiftScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    name: string;
    type: string;
    daysUntil: string;
    date: string;
    phone?: string;
    email?: string;
  }>();

  const recipientName = params.name || 'Friend';
  const eventType = (params.type as any) || 'birthday';

  // State
  const [selectedBrand, setSelectedBrand] = useState<GiftBrand>(GIFT_BRANDS[0]);
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmountText, setCustomAmountText] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [greetingTone, setGreetingTone] = useState<GreetingTone>('warm');
  const [greetingText, setGreetingText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate greeting on mount or tone change
  useEffect(() => {
    const text = generateGreeting({
      recipientName,
      eventType,
      tone: greetingTone,
      brandName: selectedBrand.name,
      amount: selectedAmount,
    });
    setGreetingText(text);
  }, [recipientName, eventType, greetingTone, selectedBrand.name, selectedAmount]);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomAmount(false);
    setCustomAmountText('');
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmountText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedAmount(parsed);
      setIsCustomAmount(true);
    }
  };

  const regenerateGreeting = () => {
    const fresh = generateGreeting({
      recipientName,
      eventType,
      tone: greetingTone,
      brandName: selectedBrand.name,
      amount: selectedAmount,
    });
    setGreetingText(fresh);
  };

  const handleOpenMerchant = async () => {
    const url = buildPartnerCheckoutUrl({
      brand: selectedBrand,
      amount: selectedAmount,
      recipientName,
      recipientEmail: params.email,
    });

    // Record gift locally
    await recordGiftSent({
      id: Math.random().toString(36).substring(7),
      eventId: params.id || 'custom',
      recipientName,
      brandId: selectedBrand.id,
      brandName: selectedBrand.name,
      amount: selectedAmount,
      greetingSent: greetingText,
      deliveredVia: 'direct_merchant',
      createdAt: new Date().toISOString(),
    });

    try {
      const canOpen = await Linking.canOpenURL(selectedBrand.deepLinkScheme);
      if (canOpen) {
        await Linking.openURL(selectedBrand.deepLinkScheme);
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  const handleShareToChat = async () => {
    const checkoutUrl = buildPartnerCheckoutUrl({
      brand: selectedBrand,
      amount: selectedAmount,
      recipientName,
      recipientEmail: params.email,
    });

    const fullMessage = formatShareableMessage(greetingText, checkoutUrl);

    try {
      await Share.share({
        message: fullMessage,
        title: `Gift for ${recipientName}`,
      });

      await recordGiftSent({
        id: Math.random().toString(36).substring(7),
        eventId: params.id || 'custom',
        recipientName,
        brandId: selectedBrand.id,
        brandName: selectedBrand.name,
        amount: selectedAmount,
        greetingSent: greetingText,
        deliveredVia: 'whatsapp',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Share dismissed or failed:', error);
    }
  };

  const handleCopyNote = async () => {
    await Clipboard.setStringAsync(greetingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Recipient Card */}
      <View style={styles.headerCard}>
        <View style={styles.recipientRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{recipientName[0] || '🎁'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientName}>{recipientName}</Text>
            <Text style={styles.eventSubtitle}>
              {params.title || 'Celebration'} • In {params.daysUntil || '0'} days
            </Text>
          </View>
        </View>

        {(params.phone || params.email) && (
          <View style={styles.contactDetailsRow}>
            {params.phone ? <Text style={styles.contactBadge}>📞 {params.phone}</Text> : null}
            {params.email ? <Text style={styles.contactBadge}>✉️ {params.email}</Text> : null}
          </View>
        )}
      </View>

      {/* Step 1: Select Brand */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Choose Gift Card or Experience</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandCarousel}
        >
          {GIFT_BRANDS.map((brand) => {
            const isSelected = selectedBrand.id === brand.id;
            return (
              <TouchableOpacity
                key={brand.id}
                style={[
                  styles.brandCard,
                  isSelected && { borderColor: brand.primaryColor, borderWidth: 2 },
                ]}
                onPress={() => setSelectedBrand(brand)}
              >
                <View style={[styles.brandLogoCircle, { backgroundColor: brand.primaryColor }]}>
                  <Text style={styles.brandEmoji}>{brand.logoEmoji}</Text>
                </View>
                <Text style={styles.brandName}>{brand.name}</Text>
                <Text style={styles.brandTagline} numberOfLines={2}>
                  {brand.tagline}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Step 2: Amount Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Select Amount</Text>
        <View style={styles.amountGrid}>
          {selectedBrand.supportedAmounts.map((amt) => {
            const isSelected = selectedAmount === amt && !isCustomAmount;
            return (
              <TouchableOpacity
                key={amt}
                style={[styles.amountChip, isSelected && styles.amountChipActive]}
                onPress={() => handleSelectAmount(amt)}
              >
                <Text style={[styles.amountText, isSelected && styles.amountTextActive]}>
                  ${amt}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.customAmountBox, isCustomAmount && styles.customAmountBoxActive]}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Other"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={customAmountText}
              onChangeText={handleCustomAmountChange}
            />
          </View>
        </View>
      </View>

      {/* Step 3: AI Greeting Card Note */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>3. AI Greeting Message</Text>
          <TouchableOpacity style={styles.regenButton} onPress={regenerateGreeting}>
            <Sparkles size={14} color="#6366F1" style={{ marginRight: 4 }} />
            <Text style={styles.regenText}>Regenerate</Text>
          </TouchableOpacity>
        </View>

        {/* Tone Selector */}
        <View style={styles.toneRow}>
          {(['warm', 'funny', 'short', 'celebratory'] as GreetingTone[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.toneChip, greetingTone === t && styles.toneChipActive]}
              onPress={() => setGreetingTone(t)}
            >
              <Text style={[styles.toneText, greetingTone === t && styles.toneTextActive]}>
                {t === 'warm' && 'Warm ❤️'}
                {t === 'funny' && 'Funny 😂'}
                {t === 'short' && 'Short ⚡'}
                {t === 'celebratory' && 'Cheers 🥂'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note Box */}
        <View style={styles.greetingBox}>
          <TextInput
            style={styles.greetingInput}
            multiline
            value={greetingText}
            onChangeText={setGreetingText}
          />
          <TouchableOpacity style={styles.copyNoteButton} onPress={handleCopyNote}>
            {copied ? (
              <>
                <Check size={14} color="#16A34A" style={{ marginRight: 4 }} />
                <Text style={[styles.copyNoteText, { color: '#16A34A' }]}>Copied!</Text>
              </>
            ) : (
              <>
                <Copy size={14} color="#6B7280" style={{ marginRight: 4 }} />
                <Text style={styles.copyNoteText}>Copy Note</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {/* Primary Merchant Checkout */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: selectedBrand.primaryColor }]}
          onPress={handleOpenMerchant}
        >
          <ExternalLink size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>
            Send ${selectedAmount} via {selectedBrand.name}
          </Text>
        </TouchableOpacity>

        {/* Secondary: WhatsApp / iMessage Share */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShareToChat}>
          <MessageCircle size={18} color="#25D366" style={{ marginRight: 8 }} />
          <Text style={styles.shareButtonText}>Share via WhatsApp / iMessage</Text>
        </TouchableOpacity>
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
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  eventSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactBadge: {
    fontSize: 12,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  regenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  regenText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  brandCarousel: {
    gap: 12,
    paddingVertical: 4,
  },
  brandCard: {
    width: 130,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brandLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandEmoji: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  amountTextActive: {
    color: '#ffffff',
  },
  customAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  customAmountBoxActive: {
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  customInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
  },
  toneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  toneChipActive: {
    backgroundColor: '#4338CA',
  },
  toneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  toneTextActive: {
    color: '#ffffff',
  },
  greetingBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    minHeight: 110,
  },
  greetingInput: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  copyNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionsSection: {
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
});
