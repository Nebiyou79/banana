// /* eslint-disable @typescript-eslint/no-explicit-any */
// // hooks/useSocialShare.ts
// import { useToast } from '@/hooks/use-toast';
// import { Job, jobService } from '@/services/jobService';
// import { Tender, TenderService } from '@/services/tenderService';

// interface ShareOptions {
//   title: string;
//   text?: string;
//   url: string;
//   files?: File[];
// }

// // Helper function to generate share URL
// const generateShareUrl = (item: Job | Tender): string => {
//   const baseUrl = 'https://getbananalink.com';
//   const isTender = 'budget' in item;
  
//   if (isTender) {
//     return `${baseUrl}/dashboard/candidate/tenders/${item._id}`;
//   } else {
//     return `${baseUrl}/dashboard/candidate/jobs/${item._id}`;
//   }
// };

// // Helper function to get owner name
// const getOwnerName = (item: Job | Tender): string => {
//   if ('budget' in item) {
//     // It's a Tender
//     return item.company?.name || item.organization?.name || 'Unknown';
//   } else {
//     // It's a Job
//     return jobService.getOwnerName(item);
//   }
// };

// // Helper function to format budget/salary
// const formatBudgetSalary = (item: Job | Tender): string => {
//   if ('budget' in item) {
//     // It's a Tender
//     const { budget } = item;
//     if (budget.isNegotiable) return 'Negotiable';
//     if (budget.min && budget.max) {
//       return `${budget.min.toLocaleString()} - ${budget.max.toLocaleString()} ${budget.currency}`;
//     } else if (budget.min) {
//       return `From ${budget.min.toLocaleString()} ${budget.currency}`;
//     } else if (budget.max) {
//       return `Up to ${budget.max.toLocaleString()} ${budget.currency}`;
//     }
//     return 'Negotiable';
//   } else {
//     // It's a Job
//     return jobService.formatSalary(item.salary);
//   }
// };

// // Helper function to get location
// const getLocation = (item: Job | Tender): string => {
//   if ('budget' in item) {
//     // Tender location from requirements
//     return item.requirements?.location || 'Location not specified';
//   } else {
//     // Job location
//     return `${item.location.city}, ${item.location.region}`;
//   }
// };

// // Helper function to get type label
// const getTypeLabel = (item: Job | Tender): string => {
//   if ('budget' in item) {
//     return 'TENDER';
//   } else {
//     return jobService.getJobTypeDisplayLabel(item);
//   }
// };

// // Helper function to safely format date
// const safeFormatDate = (dateString: string | undefined | null): string => {
//   if (!dateString) return 'Not specified';
  
//   try {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return 'Invalid date';
//   }
// };

// // Helper function to check if item is a tender (type guard)
// const isTender = (item: Job | Tender): item is Tender => {
//   return 'budget' in item && 'deadline' in item;
// };

// export const useSocialShare = () => {
//   const { toast } = useToast();

//   const share = async (options: ShareOptions) => {
//     if (navigator.share) {
//       try {
//         await navigator.share(options);
//         return true;
//       } catch (error: any) {
//         if (error.name !== 'AbortError') {
//           console.error('Error sharing:', error);
//         }
//         return false;
//       }
//     }
//     return false;
//   };

//   const shareToPlatform = (platform: string, url: string, title: string, text?: string) => {
//     const encodedUrl = encodeURIComponent(url);
//     const encodedTitle = encodeURIComponent(title);
//     const encodedText = encodeURIComponent(text || '');

//     const shareUrls: Record<string, string> = {
//       facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
//       twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
//       linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
//       whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
//       telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
//       tiktok: `https://www.tiktok.com/share?url=${encodedUrl}`,
//       reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
//       email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
//       sms: `sms:?body=${encodedTitle}%20${encodedUrl}`
//     };

//     const shareUrl = shareUrls[platform.toLowerCase()];
    
//     if (!shareUrl) {
//       toast({
//         title: 'Unsupported platform',
//         description: 'This sharing platform is not supported',
//         variant: 'destructive',
//       });
//       return;
//     }

//     if (platform === 'email' || platform === 'sms') {
//       window.location.href = shareUrl;
//       return;
//     }

//     const width = 600;
//     const height = 400;
//     const left = (window.screen.width - width) / 2;
//     const top = (window.screen.height - height) / 2;

//     window.open(
//       shareUrl,
//       'share',
//       `width=${width},height=${height},left=${left},top=${top}`
//     );
//   };

//   const copyToClipboard = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       toast({
//         title: 'Copied to clipboard!',
//         description: 'Link has been copied to clipboard',
//         variant: 'success',
//       });
//       return true;
//     } catch (error) {
//       const textArea = document.createElement('textarea');
//       textArea.value = text;
//       document.body.appendChild(textArea);
//       textArea.select();
//       try {
//         document.execCommand('copy');
//         toast({
//           title: 'Copied to clipboard!',
//           description: 'Link has been copied to clipboard',
//           variant: 'success',
//         });
//         return true;
//       } catch (fallbackError) {
//         toast({
//           title: 'Copy failed',
//           description: 'Please copy the link manually',
//           variant: 'destructive',
//         });
//         return false;
//       } finally {
//         document.body.removeChild(textArea);
//       }
//     }
//   };

//   const generateQRCode = (url: string): string => {
//     return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8`;
//   };

//   const generateShareableImage = async (item: Job | Tender): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       try {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         if (!ctx) {
//           reject(new Error('Could not get canvas context'));
//           return;
//         }

//         // Set canvas size for optimal social media sharing
//         canvas.width = 1200;
//         canvas.height = 800;

//         const loadBackground = () => {
//           return new Promise<void>((resolveBg) => {
//             const bgImage = new Image();
//             bgImage.onload = () => {
//               ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
//               ctx.fillStyle = 'rgba(10, 37, 64, 0.85)';
//               ctx.fillRect(0, 0, canvas.width, canvas.height);
//               resolveBg();
//             };
//             bgImage.onerror = () => {
//               const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
//               gradient.addColorStop(0, '#0A2540');
//               gradient.addColorStop(1, '#1A365D');
//               ctx.fillStyle = gradient;
//               ctx.fillRect(0, 0, canvas.width, canvas.height);
//               resolveBg();
//             };
//             bgImage.src = '/images/job-share-bg.jpg';
//           });
//         };

//         const drawContent = async () => {
//           await loadBackground();

//           // Content container
//           ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
//           roundRect(ctx, 40, 40, canvas.width - 80, canvas.height - 80, 20);
//           ctx.fill();

//           // Brand header
//           ctx.fillStyle = '#FFD700';
//           ctx.fillRect(40, 40, canvas.width - 80, 80);

//           // Logo/Brand name
//           ctx.fillStyle = '#0A2540';
//           ctx.font = 'bold 36px system-ui';
//           ctx.textAlign = 'left';
//           ctx.fillText('BananaLink', 80, 90);

//           // Content area
//           const contentX = 80;
//           let currentY = 180;

//           // Title
//           ctx.fillStyle = '#0A2540';
//           ctx.font = 'bold 48px system-ui';
//           const titleLines = wrapText(ctx, item.title, contentX, currentY, canvas.width - 160, 60);
//           currentY += titleLines * 60 + 40;

//           // Type badge
//           const isTenderItem = isTender(item);
//           ctx.fillStyle = isTenderItem ? '#F1BB03' : '#4DA6FF';
//           roundRect(ctx, contentX, currentY, 120, 40, 20);
//           ctx.fill();
//           ctx.fillStyle = '#FFFFFF';
//           ctx.font = 'bold 20px system-ui';
//           ctx.textAlign = 'center';
//           ctx.fillText(getTypeLabel(item), contentX + 60, currentY + 26);
//           ctx.textAlign = 'left';

//           currentY += 60;

//           // Company/Organization
//           ctx.fillStyle = '#333333';
//           ctx.font = 'bold 32px system-ui';
//           const ownerName = getOwnerName(item);
//           ctx.fillText(ownerName, contentX, currentY);
//           currentY += 50;

//           // Location
//           ctx.font = '28px system-ui';
//           ctx.fillStyle = '#666666';
//           const locationText = getLocation(item);
//           ctx.fillText(`📍 ${locationText}`, contentX, currentY);
//           currentY += 50;

//           // Budget/Salary
//           ctx.font = 'bold 32px system-ui';
//           ctx.fillStyle = '#059669';
//           const budgetSalaryText = formatBudgetSalary(item);
//           ctx.fillText(`💰 ${budgetSalaryText}`, contentX, currentY);
//           currentY += 60;

//           // Description (truncated)
//           ctx.font = '24px system-ui';
//           ctx.fillStyle = '#4B5563';
//           const description = item.description.substring(0, 200) + (item.description.length > 200 ? '...' : '');
//           const descLines = wrapText(ctx, description, contentX, currentY, canvas.width - 160, 32);
//           currentY += descLines * 32 + 40;

//           // Skills/Requirements
//           const skills = isTenderItem ? (item as Tender).skillsRequired : (item as Job).skills;
//           if (skills && skills.length > 0) {
//             ctx.font = 'bold 28px system-ui';
//             ctx.fillStyle = '#0A2540';
//             ctx.fillText('Requirements:', contentX, currentY);
//             currentY += 40;

//             ctx.font = '22px system-ui';
//             ctx.fillStyle = '#666666';
//             const skillsText = skills.slice(0, 4).join(' • ');
//             wrapText(ctx, skillsText, contentX, currentY, canvas.width - 160, 28);
//             currentY += 40;
//           }

//           // Deadline for tenders
//           if (isTenderItem && (item as Tender).deadline) {
//             ctx.font = 'bold 28px system-ui';
//             ctx.fillStyle = '#DC2626';
//             const deadline = safeFormatDate((item as Tender).deadline);
//             ctx.fillText(`⏰ Deadline: ${deadline}`, contentX, currentY);
//             currentY += 50;
//           }

//           // Application deadline for jobs
//           if (!isTenderItem && (item as Job).applicationDeadline) {
//             ctx.font = 'bold 28px system-ui';
//             ctx.fillStyle = '#DC2626';
//             const deadline = safeFormatDate((item as Job).applicationDeadline);
//             ctx.fillText(`⏰ Apply by: ${deadline}`, contentX, currentY);
//             currentY += 50;
//           }

//           // Footer with URL
//           ctx.fillStyle = '#0A2540';
//           ctx.font = 'bold 24px system-ui';
//           ctx.textAlign = 'center';
//           ctx.fillText('Apply now at getbananalink.com', canvas.width / 2, canvas.height - 60);

//           // QR Code area
//           ctx.fillStyle = '#F5F5F5';
//           roundRect(ctx, canvas.width - 180, canvas.height - 180, 140, 140, 10);
//           ctx.fill();
//           ctx.fillStyle = '#666666';
//           ctx.font = '16px system-ui';
//           ctx.fillText('Scan to apply', canvas.width - 110, canvas.height - 30);

//           const dataUrl = canvas.toDataURL('image/png', 1.0);
//           resolve(dataUrl);
//         };

//         drawContent().catch(reject);
//       } catch (error) {
//         reject(error);
//       }
//     });
//   };

//   // Helper function to draw rounded rectangles
//   const roundRect = (
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number,
//     width: number,
//     height: number,
//     radius: number
//   ) => {
//     ctx.beginPath();
//     ctx.moveTo(x + radius, y);
//     ctx.arcTo(x + width, y, x + width, y + height, radius);
//     ctx.arcTo(x + width, y + height, x, y + height, radius);
//     ctx.arcTo(x, y + height, x, y, radius);
//     ctx.arcTo(x, y, x + width, y, radius);
//     ctx.closePath();
//   };

//   // Helper function to wrap text
//   const wrapText = (
//     ctx: CanvasRenderingContext2D,
//     text: string,
//     x: number,
//     y: number,
//     maxWidth: number,
//     lineHeight: number
//   ): number => {
//     const words = text.split(' ');
//     let line = '';
//     let lines = 1;
//     let testLine = '';
    
//     ctx.textAlign = 'left';
//     ctx.textBaseline = 'top';

//     for (let n = 0; n < words.length; n++) {
//       testLine = line + words[n] + ' ';
//       const metrics = ctx.measureText(testLine);
//       const testWidth = metrics.width;
      
//       if (testWidth > maxWidth && n > 0) {
//         ctx.fillText(line, x, y);
//         line = words[n] + ' ';
//         y += lineHeight;
//         lines++;
//       } else {
//         line = testLine;
//       }
//     }
//     ctx.fillText(line, x, y);
//     return lines;
//   };

//   return {
//     share,
//     shareToPlatform,
//     copyToClipboard,
//     generateQRCode,
//     generateShareableImage,
//     generateShareUrl
//   };
// };