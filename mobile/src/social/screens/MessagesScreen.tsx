/**
 * MessagesScreen — conversations list.
 * -----------------------------------------------------------------------------
 * Structure (top → bottom):
 *   - Header: "Messages" + new-message icon
 *   - Search input
 *   - Role tabs: All | Connections | Candidates | Freelancers | Companies
 *   - Message Requests banner (tappable)
 *   - Conversations list (FlashList)
 *   - Empty state per tab
 *   - Pull-to-refresh
 */

import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSocialTheme } from '../theme/socialTheme';
import { useConversations } from '../hooks/useConversations';
import { useBulkConnectionStatus, useToggleFollow } from '../hooks/useFollow';
import type { Conversation } from '../types/chat';
import ContactCard from '../components/chat/ContactCard';

type FilterTab = 'all' | 'connections' | 'candidate' | 'freelancer' | 'company';
type AnyNav = NativeStackNavigationProp<any>;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'connections', label: 'Connections' },
  { key: 'candidate', label: 'Candidates' },
  { key: 'freelancer', label: 'Freelancers' },
  { key: 'company', label: 'Companies' },
];

const MessagesScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');

  const apiFilter = activeTab === 'all' ? undefined : activeTab;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isRefetching,
    refetch,
  } = useConversations(apiFilter);

  const conversations: Conversation[] = data?.list ?? [];
  const requestsCount = data?.requestsCount ?? 0;

  // Client-side filter for the search box (server tab filter already applied).
  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) =>
      c.otherUser.name.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const userIds = useMemo(
    () => filtered.map((c) => c.otherUser._id),
    [filtered],
  );
  const { statusMap } = useBulkConnectionStatus(userIds);
  const { mutate: toggleFollow } = useToggleFollow();

  const openChat = (conv: Conversation) =>
    navigation.navigate('Chat', {
      conversationId: conv._id,
      otherUser: conv.otherUser,
    });

  const renderItem = ({ item }: { item: Conversation }) => (
    <ContactCard
      conversation={item}
      status={statusMap[item.otherUser._id]}
      onPress={() => openChat(item)}
      onFollowPress={() =>
        toggleFollow({
          targetId: item.otherUser._id,
          targetType: 'User',
          source: 'manual',
        })
      }
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles.headerAction}
          accessibilityLabel="Start new conversation"
        >
          <Ionicons name="create-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.inputBg, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search conversations"
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={theme.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.primary : theme.cardAlt,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? '#fff' : theme.text },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Requests banner */}
      {requestsCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('MessageRequests')}
          style={[
            styles.requestsBanner,
            { backgroundColor: theme.cardAlt, borderColor: theme.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${requestsCount} message requests`}
        >
          <Ionicons name="mail-outline" size={20} color={theme.primary} />
          <Text style={[styles.requestsText, { color: theme.text }]}>
            Message Requests
          </Text>
          <View style={[styles.requestsBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.requestsBadgeText}>{requestsCount}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.muted}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
      )}

      {/* List */}
      <FlashList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={theme.muted}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptySub, { color: theme.subtext }]}>
                Start a chat from a profile or search.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Search')}
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.emptyBtnText}>Find People</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: { fontSize: 24, fontWeight: '800' },
    headerAction: { padding: 6 },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
    tabsScroll: { marginTop: 12, maxHeight: 50 },
    tabsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      minHeight: 36,
      justifyContent: 'center',
    },
    tabText: { fontSize: 13, fontWeight: '600' },
    requestsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    requestsText: { fontSize: 14, fontWeight: '700' },
    requestsBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
      gap: 10,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700' },
    emptySub: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
    emptyBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      minHeight: 44,
      justifyContent: 'center',
    },
    emptyBtnText: { color: '#fff', fontWeight: '700' },
  });

export default MessagesScreen;