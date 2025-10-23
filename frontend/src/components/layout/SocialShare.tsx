// components/shared/SocialShare.tsx
import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Linkedin, 
  MessageCircle,
  Mail,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  trigger?: React.ReactNode;
}

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description = '',
  image = '',
  className = '',
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareConfig = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };

  const handleShare = (platform: keyof typeof shareConfig) => {
    const shareUrl = shareConfig[platform];
    
    if (platform === 'email') {
      window.location.href = shareUrl;
      return;
    }

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Job link has been copied to clipboard',
        variant: 'success',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      platform: 'facebook' as const
    },
    {
      name: 'Twitter',
      icon: X,
      color: 'bg-black hover:bg-gray-800',
      platform: 'twitter' as const
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      platform: 'linkedin' as const
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      platform: 'whatsapp' as const
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      platform: 'email' as const
    },
    {
      name: 'Copy Link',
      icon: Copy,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: handleCopyLink
    }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Share this job</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Share Buttons Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareButtons.map((button) => (
                <button
                  key={button.name}
                  onClick={() => button.action ? button.action() : handleShare(button.platform!)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl text-white transition-all hover:scale-105 ${button.color}`}
                >
                  <button.icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">{button.name}</span>
                </button>
              ))}
            </div>

            {/* Direct Link */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direct Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShare;