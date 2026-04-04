// src/lib/image-utils.ts
export const getSafeImageUrl = (url: string | undefined, baseUrl?: string): string | null => {
  if (!url) return null;
  
  try {
    if (url.startsWith('http')) {
      return url;
    }
    
    const apiBase = baseUrl || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
};

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = event.currentTarget;
  target.style.display = 'none';
  
  // Find and show fallback
  const fallback = target.nextElementSibling as HTMLElement;
  if (fallback) {
    fallback.style.display = 'flex';
  }
};