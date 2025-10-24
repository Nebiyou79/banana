/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useSocialShare.ts
import { useToast } from '@/hooks/use-toast';
import { Job, jobService } from '@/services/jobService';

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
      tiktok: `https://www.tiktok.com/share?url=${encodedUrl}`,
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

  const generateShareableImage = async (jobData: Job): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size for a nice shareable image
        canvas.width = 1200;
        canvas.height = 630; // Optimal social media image size

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some decorative elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 100 + 50,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Content background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.roundRect = function (x: number, y: number, w: number, h: number, r: number) {
          if (w < 2 * r) r = w / 2;
          if (h < 2 * r) r = h / 2;
          this.beginPath();
          this.moveTo(x + r, y);
          this.arcTo(x + w, y, x + w, y + h, r);
          this.arcTo(x + w, y + h, x, y + h, r);
          this.arcTo(x, y + h, x, y, r);
          this.arcTo(x, y, x + w, y, r);
          this.closePath();
          return this;
        };
        
        ctx.roundRect.call(ctx, 50, 50, canvas.width - 100, canvas.height - 100, 20);
        ctx.fill();

        // Job title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 48px system-ui';
        ctx.textAlign = 'left';
        
        // Wrap text function
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let testLine = '';
          let testWidth;

          for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            testWidth = ctx.measureText(testLine).width;
            
            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, y);
              line = words[n] + ' ';
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, y);
          return y;
        };

        let currentY = 150;
        
        // Job Title
        ctx.font = 'bold 48px system-ui';
        currentY = wrapText(jobData.title, 100, currentY, canvas.width - 200, 60);

        // Company/Organization
        ctx.font = '32px system-ui';
        ctx.fillStyle = '#4b5563';
        currentY += 80;
        const ownerName = jobService.getOwnerName(jobData);
        ctx.fillText(ownerName, 100, currentY);

        // Location
        ctx.font = '28px system-ui';
        ctx.fillStyle = '#6b7280';
        currentY += 50;
        const locationText = `${jobData.location.city}, ${jobData.location.region}`;
        ctx.fillText(locationText, 100, currentY);

        // Job Type and Experience
        ctx.font = '24px system-ui';
        currentY += 50;
        const jobTypeText = `${jobService.getJobTypeLabel(jobData.type)} • ${jobService.getExperienceLabel(jobData.experienceLevel)}`;
        ctx.fillText(jobTypeText, 100, currentY);

        // Salary if available
        if (jobData.salary) {
          ctx.font = 'bold 28px system-ui';
          ctx.fillStyle = '#059669';
          currentY += 60;
          const salaryText = jobService.formatSalary(jobData.salary);
          ctx.fillText(salaryText, 100, currentY);
        }

        // Website URL at bottom
        ctx.font = '20px system-ui';
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'center';
        ctx.fillText('Visit our website to apply', canvas.width / 2, canvas.height - 60);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    share,
    shareToPlatform,
    copyToClipboard,
    generateQRCode,
    generateShareableImage
  };
};