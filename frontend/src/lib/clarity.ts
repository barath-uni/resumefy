/**
 * Microsoft Clarity Analytics Integration
 * Initializes Clarity for session recording, heatmaps, and user flow visualization
 */

export const initClarity = () => {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

  if (!projectId || projectId === 'YOUR_CLARITY_PROJECT_ID') {
    console.warn('⚠️ Microsoft Clarity: Project ID not configured. See docs/MICROSOFT_CLARITY.md');
    return;
  }

  // Inject Clarity script dynamically with the project ID from environment
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.innerHTML = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${projectId}");
  `;

  document.head.appendChild(script);
};

/**
 * Track custom events with Clarity
 * Clarity automatically tracks most user interactions (clicks, scrolls, etc.)
 * Use this function for custom event tracking
 */
export const trackClarityEvent = (eventName: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('set', eventName, data);
  }
};

/**
 * Set user properties in Clarity
 * Useful for tagging sessions with user info for analysis
 */
export const setClarityUserId = (userId: string) => {
  if (typeof window !== 'undefined' && (window as any).clarity) {
    (window as any).clarity('set', 'userId', userId);
  }
};

/**
 * Mask sensitive data in Clarity recordings
 * Add class "clarity-mask" to HTML elements you want to hide from recordings
 */
export const maskSensitiveElements = () => {
  // Note: Clarity automatically masks:
  // - Password fields
  // - Credit card inputs
  // - Email inputs (by default in dashboard settings)
  //
  // For additional masking, add 'clarity-mask' class to elements:
  // <input type="text" className="clarity-mask" />
};
