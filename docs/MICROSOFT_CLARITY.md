# Microsoft Clarity Setup Guide

Microsoft Clarity is a **free** analytics tool that provides session recordings, heatmaps, and user flow visualization. It's perfect for understanding how users interact with your application.

## Key Benefits

- **Session Recordings**: Watch how users navigate through your app
- **Heatmaps**: Visualize where users click and scroll
- **User Flow Analysis**: See conversion funnels and drop-off points
- **Free Tier**: 100% free, no credit card required
- **Privacy**: Automatically masks passwords, emails, credit cards, and sensitive data

## Getting Started (Free Account)

### Step 1: Create Microsoft Clarity Account

1. Go to https://clarity.microsoft.com
2. Click **"Sign up for Clarity"**
3. Sign in with your Microsoft account (create one if needed)
4. Accept the terms and conditions
5. You now have a free account with **no time limit, no credit card required**

### Step 2: Create a New Project

1. In the Clarity dashboard, click **"+ New Project"**
2. Enter your project name (e.g., "Resumefy")
3. Enter your website domain (e.g., `resumefy.com` or `localhost:5173` for local dev)
4. Click **"Create project"**
5. You'll see your **Project ID** (13-character alphanumeric string)

### Step 3: Add Project ID to Your Code

#### Option A: Add to Local `.env` File (Development)

Create or edit `/frontend/.env`:

```env
VITE_CLARITY_PROJECT_ID=YOUR_PROJECT_ID_HERE
```

Replace `YOUR_PROJECT_ID_HERE` with the Project ID from Step 2.

#### Option B: Add to `.env.production` (Production)

Create `/frontend/.env.production`:

```env
VITE_CLARITY_PROJECT_ID=YOUR_PRODUCTION_PROJECT_ID
VITE_GA_TRACKING_ID=YOUR_GA_TRACKING_ID
VITE_APP_URL=https://resumefy.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Restart Development Server

```bash
npm run dev
```

Clarity will automatically initialize when the page loads. You'll see:
```
✅ Microsoft Clarity initialized
```

in your browser console.

### Step 5: Test It Out

1. Visit your site at `http://localhost:5173`
2. Interact with the page (click buttons, scroll, fill forms)
3. Go to your Clarity dashboard at https://clarity.microsoft.com
4. After a few minutes, you'll see recordings and heatmaps appearing

## Features Overview

### 1. Session Recordings

Watch real user sessions to see:
- How users navigate your upload flow
- Where they get confused or stuck
- Which buttons they click
- Form completion rates

### 2. Heatmaps

See aggregated click and scroll patterns:
- **Click Heatmap**: Where users click most frequently
- **Scroll Heatmap**: How far down the page users scroll
- **Rage Click Heatmap**: Where users are frustrated (multiple rapid clicks)

### 3. Funnels

Track conversion flows:
- Landing page → Upload modal
- Upload → Email verification
- Email verification → Dashboard access
- Resume upload → Job tailoring

### 4. Insights Dashboard

Automatic analysis of:
- Dead clicks (clicks on non-interactive elements)
- Rage clicks (frustrated clicking)
- Users with errors
- Session duration and activity levels

## Privacy & Data Masking

### What Clarity Automatically Masks

- Password fields
- Credit card inputs
- Email inputs (configurable in dashboard)
- Phone number fields

### How to Mask Additional Content

Add the `clarity-mask` class to any HTML element you want to hide:

```tsx
// Hide API keys or sensitive data
<input type="text" className="clarity-mask" placeholder="API Key" />

// Hide specific form fields
<div className="clarity-mask">
  Sensitive information
</div>
```

## Advanced Usage

### Track Custom Events

Use the Clarity event tracking function in your components:

```tsx
import { trackClarityEvent } from '@/lib/clarity';

// In your component
const handleOptimization = () => {
  trackClarityEvent('optimization_started', {
    resumeId: 'abc123',
    jobCount: 5
  });
  // ... do optimization
};
```

### Set User ID for Session Tracking

```tsx
import { setClarityUserId } from '@/lib/clarity';

// After user logs in
useEffect(() => {
  if (user) {
    setClarityUserId(user.id);
  }
}, [user]);
```

## Comparing GA4 vs Clarity

| Feature | Google Analytics 4 | Microsoft Clarity |
|---------|-------------------|-------------------|
| **Session Recordings** | ❌ No | ✅ Yes |
| **Heatmaps** | ❌ No | ✅ Yes |
| **User Flow Visualization** | ⚠️ Limited | ✅ Yes |
| **Funnels** | ✅ Yes | ✅ Yes |
| **Real-time Data** | ✅ Yes | ✅ Yes |
| **Cost** | Free tier available | Free (always) |
| **Event Tracking** | ✅ Flexible | ⚠️ Basic |

**Recommendation**: Use **both** GA4 and Clarity:
- **GA4** for detailed event tracking and business metrics
- **Clarity** for understanding user behavior and UX issues

## Troubleshooting

### Clarity Not Showing Data

1. **Check Project ID**: Verify it's correct in `.env`
2. **Wait for Data**: Recordings appear after ~5 minutes
3. **Check Dashboard Settings**: Ensure your domain is whitelisted
4. **Browser Console**: Should show `✅ Microsoft Clarity initialized`

### Recordings Look Redacted

Clarity automatically masks sensitive fields. Check:
- Dashboard → Settings → Mask List
- Add custom masks if needed

### Missing Domain

If you see "Domain not verified":
1. Go to Project Settings
2. Add your domain (including subdomain if applicable)
3. Wait 5-10 minutes for verification

## Dashboard Navigation

After logging in to https://clarity.microsoft.com:

- **Home**: Overview of your project
- **Recordings**: Watch individual user sessions
- **Heatmaps**: Click and scroll visualization
- **Funnels**: Create custom conversion flows
- **Insights**: AI-powered analysis of user behavior
- **Settings**: Configure masking, domains, and team access

## Cost

**Microsoft Clarity is 100% free.** There are no:
- Tier limits
- Session limits
- Feature restrictions
- Hidden costs

You can use it indefinitely with no credit card required.

## Next Steps

1. ✅ Create account at https://clarity.microsoft.com
2. ✅ Create new project and get Project ID
3. ✅ Add Project ID to `.env`
4. ✅ Restart dev server
5. ✅ Visit your site and interact with it
6. ✅ Check recordings in Clarity dashboard after 5 minutes
7. ✅ Set up funnels to track conversion paths

## Support

- **Clarity Docs**: https://clarity.microsoft.com/help
- **Community**: https://learn.microsoft.com/en-us/clarity/
- **Issues**: Check browser console for error messages

---

**Pro Tip**: Combine Clarity recordings with GA4 events for complete user journey understanding. Watch recordings when GA4 shows unusual behavior or drop-offs.
