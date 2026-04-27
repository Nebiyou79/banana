// src/social/screens/NewChatScreen.tsx
/**
 * NewChatScreen — pick someone to message.
 * -----------------------------------------------------------------------------
 * Three-tier tap behavior, mirrored from the spec:
 *   • Connected (mutual)   → opens conversation immediately
 *   • Following (one-way)  → opens compose with the "request" banner; first
 *                            message becomes a Message Request on the backend
 *   • No follow            → row is disabled with a "Follow first" badge;
 *                            tapping it does nothing (visual cue only)
 *
 * The list is empty by default; results appear as the user types.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import SearchBar from '../components/search/SearchBar';
import NewChatRow from '../components/chat/NewChatRow';
import { EmptyState, SectionHeader } from '../components/shared';
import {
  useSocialSearch,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import { isDirectChat } from '../utils/connectionStatus';
import type { SearchResult } from '../types';
import type { ChatUser } from '../types/chat';
import type { ConnectionStatus } from '../types/follow';
import { useBulkConnectionStatus, useConnections } from '../hooks/useFollow';
import { useGetOrCreateConversation } from '../hooks/useConversations';

type AnyNav = NativeStackNavigationProp<any>;

const NewChatScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

  // ── Data ─────────────────────────────────────────────────────────────
  const connectionsQ = useConnections();
  const searchQ = useSocialSearch({ q: query, type: 'all', limit: 20 });
  const { mutate: openChat, isPending: opening } =
    useGetOrCreateConversation();

  // Connections (suggestions when query is empty) — shape the entries to
  // match SearchResult so we can reuse NewChatRow.
  const connectionResults: SearchResult[] = useMemo(() => {
    const list = (connectionsQ.data?.list ?? []) as any[];
    return list
      .map((entry: any): SearchResult | null => {
        const u =
          (entry?.user && typeof entry.user === 'object' ? entry.user : null) ??
          (entry?.targetId && typeof entry.targetId === 'object'
            ? entry.targetId
            : null) ??
          entry;
        const id = u?._id ?? entry?._id;
        if (!id) return null;
        return {
          _id: id,
          name: u?.name ?? 'Unknown',
          avatar: u?.avatar,
          role: u?.role ?? 'candidate',
          headline: u?.headline,
          followerCount: u?.socialStats?.followerCount,
          verificationStatus: u?.verificationStatus,
        };
      })
      .filter(Boolean) as SearchResult[];
  }, [connectionsQ.data?.list]);

  const searchResults: SearchResult[] = searchQ.data?.results ?? [];
  const visible = isSearching ? searchResults : connectionResults;

  const userIds = useMemo(() => visible.map((r) => r._id), [visible]);
  const { statusMap } = useBulkConnectionStatus(userIds);

  // ── Tap handler with tier-aware routing ─────────────────────────────
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const status: ConnectionStatus = statusMap[result._id] ?? 'none';

      // Tier 3 — disabled. NewChatRow already prevents the tap, but defend
      // here too for completeness / programmatic callers.
      if (status === 'none' || status === 'follow_back') {
        Toast.show({
          type: 'info',
          text1: 'Follow this person first to send a message.',
          position: 'bottom',
        });
        return;
      }
      if (status === 'self' || status === 'blocked') return;

      const otherUser: ChatUser = {
        _id: result._id,
        name: result.name,
        avatar: result.avatar,
        role: result.role,
        headline: result.headline,
        verificationStatus: result.verificationStatus,
      };

      openChat(
        { userId: result._id },
        {
          onSuccess: (conv) => {
            // Replace the picker in the stack so back goes to Messages.
            navigation.replace('Chat', {
              conversationId: conv._id,
              otherUser,
              // Surface a soft hint when this is a Tier 2 (request) flow.
              isRequestFlow: !isDirectChat(status),
            });
          },
        },
      );
    },
    [statusMap, openChat, navigation],
  );

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>New message</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          autoFocus
        />
      </View>

      <FlashList
        data={visible}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NewChatRow
            result={item}
            status={statusMap[item._id] ?? 'none'}
            onPress={() => handleSelect(item)}
          />
        )}
        ListHeaderComponent={
          !isSearching && connectionResults.length > 0 ? (
            <SectionHeader title="Your connections" />
          ) : null
        }
        ListEmptyComponent={
          isSearching ? (
            searchQ.isLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title={`No matches for "${trimmed}"`}
                subtitle="Try a different name or keyword."
              />
            )
          ) : connectionsQ.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="No connections yet"
              subtitle="Search above to find someone to message."
            />
          )
        }
        ListFooterComponent={
          opening ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ paddingVertical: 16 }}
            />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
};

const makeStyles = (_theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    searchWrap: { paddingHorizontal: 12, paddingVertical: 10 },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
  });

export default NewChatScreen;