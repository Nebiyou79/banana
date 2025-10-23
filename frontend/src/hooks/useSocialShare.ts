/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useSocialShare.ts
import { useToast } from '@/hooks/use-toast';

interface ShareOptions {
  title: string;
  text?: string;
  url: string;
  files?: File[];
}

export const useSocialShare = () => {
  const { toast } = useToast();

  const share = async (options: ShareOptions) => {
    // Use Web Share API if available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    }
    return false;
  };

  const shareToPlatform = (platform: string, url: string, title: string, text?: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text || '');

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      sms: `sms:?body=${encodedTitle}%20${encodedUrl}`
    };

    const shareUrl = shareUrls[platform.toLowerCase()];
    
    if (!shareUrl) {
      toast({
        title: 'Unsupported platform',
        description: 'This sharing platform is not supported',
        variant: 'destructive',
      });
      return;
    }

    if (platform === 'email' || platform === 'sms') {
      window.location.href = shareUrl;
      return;
    }

    // Open share window
    const width = 600;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      shareUrl,
      'share',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard!',
        description: 'Link has been copied to clipboard',
        variant: 'success',
      });
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: 'Copied to clipboard!',
          description: 'Link has been copied to clipboard',
          variant: 'success',
        });
        return true;
      } catch (fallbackError) {
        toast({
          title: 'Copy failed',
          description: 'Please copy the link manually',
          variant: 'destructive',
        });
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const generateQRCode = (url: string): string => {
    // Simple QR code generation using Google Charts API
    return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8`;
  };

  const generateShareableImage = async (jobData: any): Promise<string> => {
    // This would be a more complex function that generates a shareable image
    // For now, return a simple URL-based approach
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // In a real implementation, you'd draw the job details on the canvas
    // and return the data URL
    return '';
  };

  return {
    share,
    shareToPlatform,
    copyToClipboard,
    generateQRCode,
    generateShareableImage
  };
};