/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/analytics.ts
type EventName = 
  | 'portfolio_view'
  | 'portfolio_share_click'
  | 'portfolio_delete'
  | 'portfolio_external_link'
  | 'share'
  | 'page_view';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Simple analytics utility for tracking events
 * In production, you might want to integrate with Google Analytics, Mixpanel, etc.
 */
export const trackEvent = (eventName: EventName, properties?: EventProperties) => {
  // For development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}:`, properties);
  }

  // In production, you would send to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
    
    // Example: Send to your own analytics endpoint
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    }).catch(console.error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (url: string, title?: string) => {
  trackEvent('page_view', { url, title });
};

/**
 * Initialize analytics
 */
export const initAnalytics = () => {
  if (typeof window !== 'undefined') {
    // Track initial page view
    trackPageView(window.location.pathname, document.title);
    
    // Track history changes (for SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      trackPageView(window.location.pathname, document.title);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      trackPageView(window.location.pathname, document.title);
    };

    window.addEventListener('popstate', () => {
      trackPageView(window.location.pathname, document.title);
    });
  }
};