// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

// Initialize Google Analytics
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'G-XXXXXXXXXX'

// Helper function to safely call gtag
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// Initialize GA4
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    })
  }
}

// Page view tracking
export const trackPageView = (page_title: string, page_location: string) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
    gtag('event', 'page_view', {
      page_title,
      page_location,
    })
  }
}

// Conversion events for demand validation
export const trackEvent = (action: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID !== 'G-XXXXXXXXXX') {
    gtag('event', action, parameters)
  }
}

// Specific conversion events from pre-MVP plan
export const analytics = {
  // Generic event tracking
  trackEvent,

  // Landing page visits
  trackLandingPageView: () => {
    trackEvent('page_view', {
      page_title: 'Resumefy - Landing Page',
      page_location: window.location.href,
    })
  },

  // Upload modal opened
  trackUploadAttempt: () => {
    trackEvent('upload_attempt', {
      event_category: 'engagement',
      event_label: 'upload_modal_opened',
    })
  },

  // Email capture completed
  trackEmailSubmitted: (email: string) => {
    trackEvent('email_submitted', {
      event_category: 'conversion',
      event_label: 'email_capture_completed',
      // Don't send actual email for privacy
      user_properties: {
        has_email: true,
        email
      }
    })
  },

  // Magic link sent successfully
  trackMagicLinkSent: (email: string) => {
    trackEvent('magic_link_sent', {
      event_category: 'conversion',
      event_label: 'magic_link_email_sent',
      user_properties: {
        has_email: true,
        email
      }
    })
  },

  // User clicked email link (KEY METRIC!)
  trackMagicLinkClicked: () => {
    trackEvent('magic_link_clicked', {
      event_category: 'conversion',
      event_label: 'magic_link_clicked',
      value: 1, // High-value conversion event
    })
  },

  // User reached account page
  trackDashboardReached: () => {
    trackEvent('dashboard_reached', {
      event_category: 'conversion',
      event_label: 'account_dashboard_reached',
      value: 1, // High-value conversion event
    })
  },

  // Job positions added
  trackJobPositionsAdded: (count: number) => {
    trackEvent('job_positions_added', {
      event_category: 'engagement',
      event_label: 'job_positions_count',
      value: count,
    })
  },

  // File upload success
  trackFileUploaded: (filename: string, fileSize: number) => {
    trackEvent('file_uploaded', {
      event_category: 'engagement',
      event_label: 'resume_file_uploaded',
      custom_parameters: {
        file_type: filename.split('.').pop(),
        file_size_mb: Math.round(fileSize / 1024 / 1024 * 100) / 100,
      }
    })
  },

  // Payment intent tracking (KEY DEMAND VALIDATION METRIC!)
  trackPaymentIntent: (intent: string) => {
    trackEvent('payment_intent_selected', {
      event_category: 'conversion',
      event_label: `payment_intent_${intent}`,
      value: intent === 'yes' ? 10 : intent === 'maybe' ? 5 : 1,
      custom_parameters: {
        intent_response: intent,
      }
    })
  }
}