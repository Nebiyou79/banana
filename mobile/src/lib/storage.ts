import * as SecureStore from 'expo-secure-store';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ROLE: 'user_role',
  USER_ID: 'user_id',
  ONBOARDING_SEEN: 'onboarding_seen',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── Token ─────────────────────────────────────────────────────────────────
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (e) {
    console.error('setToken error', e);
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch { /* ignore */ }
};

// ─── Role ──────────────────────────────────────────────────────────────────
export const getRole = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);
  } catch {
    return null;
  }
};

export const setRole = async (role: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, role);
  } catch (e) {
    console.error('setRole error', e);
  }
};

// ─── User ID ───────────────────────────────────────────────────────────────
export const getUserId = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);
  } catch {
    return null;
  }
};

export const setUserId = async (id: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, id);
  } catch (e) {
    console.error('setUserId error', e);
  }
};

// ─── Onboarding ────────────────────────────────────────────────────────────
export const getOnboardingSeen = async (): Promise<boolean> => {
  try {
    const val = await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_SEEN);
    return val === 'true';
  } catch {
    return false;
  }
};

export const setOnboardingSeen = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
  } catch { /* ignore */ }
};

// ─── Clear all ─────────────────────────────────────────────────────────────
export const clearAll = async (): Promise<void> => {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID),
  ]);
};