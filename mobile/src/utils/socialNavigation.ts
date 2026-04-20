// utils/socialNavigation.ts — shared helper
import type { NavigationProp } from '@react-navigation/native';

export function navigateToSocialRoot(
  navigation: NavigationProp<any>,
  screen: string,
  params?: object,
) {
  // Walk up the navigator tree until we find a navigator that has the screen,
  // falling back gracefully if the parent doesn't exist.
  let nav: NavigationProp<any> | undefined = navigation;
  while (nav) {
    try {
      nav.navigate(screen as any, params as any);
      return;
    } catch {
      nav = nav.getParent?.();
    }
  }
}