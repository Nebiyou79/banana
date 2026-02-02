import { Profile, DetailedProfile, PublicProfile } from "@/services/profileService";

interface GetAvatarOptions {
  profile?: Profile | DetailedProfile | PublicProfile | null;
  name?: string;
  fallbackColor?: string;
  size?: number;
}

export function getAvatarUrl({
  profile,
  name = "U",
  fallbackColor = "#6366F1",
  size = 150,
}: GetAvatarOptions): string {
  if (profile && 'avatar' in profile) {
    const secureUrl = (profile as Profile).avatar?.secure_url;
    if (secureUrl) return secureUrl;
  }

  if (profile?.user?.avatar) {
    return profile.user.avatar;
  }

  const initials = name.charAt(0).toUpperCase();

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=${encodeURIComponent(fallbackColor)}&color=fff&size=${size}`;
}
