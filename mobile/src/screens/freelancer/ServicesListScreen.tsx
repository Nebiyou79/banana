/**
 * screens/freelancer/ServicesListScreen.tsx
 */
import React, { useState } from 'react';
import {
  View, Alert, TouchableOpacity, StyleSheet,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useFreelancerServices, useDeleteService } from '../../hooks/useFreelancer';
import { ServiceCard } from '../../components/freelancer/ServiceCard';
import {
  ScreenWrapper, LoadingState, EmptyState,
} from '../../components/shared/UIComponents';
import ServiceFormModal from '../../components/freelancer/ServiceFormModal';
import type { FreelancerServiceItem } from '../../types/freelancer';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';
import { ScreenHeader } from '../../components/freelancer/ScreenHeader';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

export const ServicesListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [formVisible, setFormVisible] = useState(false);
  const [editingService, setEditingService] = useState<FreelancerServiceItem | null>(null);

  const { data: services = [], isLoading, refetch, isRefetching } = useFreelancerServices();
  const deleteMutation = useDeleteService();

  const handleEdit = (service: FreelancerServiceItem) => {
    setEditingService(service);
    setFormVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Service', 'This will permanently remove the service. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const handleAdd = () => {
    setEditingService(null);
    setFormVisible(true);
  };

  if (isLoading) return (
    <ScreenWrapper>
      <ScreenHeader title="My Services" onBack={() => navigation.goBack()} />
      <LoadingState message="Loading services…" />
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="My Services"
        subtitle={`${services.length} service${services.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add', onPress: handleAdd }}
      />

      <FlashList
        data={services}
        keyExtractor={s => s._id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="construct-outline"
            title="No services yet"
            subtitle="Add your offered services so clients can understand what you provide and how much you charge."
            action={{ label: 'Add Service', onPress: handleAdd }}
          />
        }
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isOwner
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={handleAdd}
        style={[styles.fab, {
          backgroundColor: colors.primary,
          bottom: insets.bottom + spacing.lg,
        }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ServiceFormModal
        visible={formVisible}
        service={editingService ? { ...editingService, deliveryTime: typeof editingService.deliveryTime === 'string' ? parseInt(editingService.deliveryTime, 10) : editingService.deliveryTime } : null}
        onClose={() => { setFormVisible(false); setEditingService(null); }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});