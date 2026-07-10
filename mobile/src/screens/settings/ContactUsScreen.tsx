// src/screens/settings/ContactUsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, StyleSheet, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

interface ContactInfo {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  subtext?: string;
  onPress?: () => void;
}

export const ContactUsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const contactInfo: ContactInfo[] = [
    {
      icon: 'mail-outline',
      title: 'Email',
      value: 'getbananalink@gmail.com',
      onPress: () => Linking.openURL('mailto:getbananalink@gmail.com'),
    },
    {
      icon: 'call-outline',
      title: 'Phone',
      value: '+251 926 123 457',
      subtext: 'Available 9AM-6PM GMT',
      onPress: () => Linking.openURL('tel:+251926123457'),
    },
    {
      icon: 'location-outline',
      title: 'Office Location',
      value: '22 Meklit Building, 1st Floor',
      subtext: 'Addis Ababa, Ethiopia',
      onPress: () => Linking.openURL('https://maps.app.goo.gl/4fkiJhGe12EG8y7V8'),
    },
  ];

  const socialLinks = [
    { icon: 'logo-facebook', name: 'Facebook', color: '#1877F2', url: 'https://www.facebook.com/jobonbanana' },
    { icon: 'logo-youtube', name: 'YouTube', color: '#FF0000', url: '#' },
    { icon: 'logo-tiktok', name: 'TikTok', color: '#000000', url: '#' },
    { icon: 'logo-telegram', name: 'Telegram', color: '#26A5E4', url: '#' },
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Enter a valid email';
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Contact submission:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
    
    Alert.alert(
      'Message Sent',
      'Thank you for reaching out! We\'ll respond within 24-48 hours.',
      [{ text: 'OK', onPress: () => setSubmitted(false) }]
    );
  };

  const accent = colors.primary;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Hero Section */}
        <View style={[s.heroSection, { backgroundColor: colors.bgCard }]}>
          <View style={[s.heroIcon, { backgroundColor: `${accent}15` }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={accent} />
          </View>
          <Text style={[s.heroTitle, { color: colors.text }]}>Get in Touch</Text>
          <Text style={[s.heroSubtitle, { color: colors.textMuted }]}>
            We're here to help with any questions about the platform
          </Text>
        </View>

        {/* Contact Info Cards */}
        <View style={s.contactInfoContainer}>
          {contactInfo.map((info, index) => (
            <TouchableOpacity
              key={info.title}
              style={[s.contactCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={info.onPress}
              activeOpacity={0.7}
            >
              <View style={[s.contactIcon, { backgroundColor: `${accent}12` }]}>
                <Ionicons name={info.icon} size={22} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.contactTitle, { color: colors.textMuted }]}>{info.title}</Text>
                <Text style={[s.contactValue, { color: colors.text }]}>{info.value}</Text>
                {info.subtext && (
                  <Text style={[s.contactSubtext, { color: colors.textMuted }]}>{info.subtext}</Text>
                )}
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Social Links */}
        <View style={s.socialSection}>
          <Text style={[s.socialTitle, { color: colors.text }]}>Connect With Us</Text>
          <View style={s.socialLinks}>
            {socialLinks.map((social) => (
              <TouchableOpacity
                key={social.name}
                style={[s.socialLink, { backgroundColor: `${social.color}15`, borderColor: `${social.color}30` }]}
                onPress={() => Linking.openURL(social.url)}
              >
                <Ionicons name={social.icon as any} size={24} color={social.color} />
                <Text style={[s.socialName, { color: social.color }]}>{social.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View style={[s.formSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[s.formTitle, { color: colors.text }]}>Send a Message</Text>
          <Text style={[s.formSubtitle, { color: colors.textMuted }]}>
            We'll respond within 24-48 hours
          </Text>

          <View style={s.form}>
            <View>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Your full name"
                placeholderTextColor={colors.inputPlaceholder}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
              {formErrors.name && <Text style={s.errorText}>{formErrors.name}</Text>}
            </View>

            <View>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Your email address"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              />
              {formErrors.email && <Text style={s.errorText}>{formErrors.email}</Text>}
            </View>

            <View>
              <TextInput
                style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Subject"
                placeholderTextColor={colors.inputPlaceholder}
                value={formData.subject}
                onChangeText={(text) => setFormData(prev => ({ ...prev, subject: text }))}
              />
              {formErrors.subject && <Text style={s.errorText}>{formErrors.subject}</Text>}
            </View>

            <View>
              <TextInput
                style={[s.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Your message..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={formData.message}
                onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              />
              {formErrors.message && <Text style={s.errorText}>{formErrors.message}</Text>}
            </View>

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: accent }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={s.submitBtnText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg ?? 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactInfoContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  socialSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
  },
  socialName: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});