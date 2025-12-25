# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Resumefy** is a production SaaS web application that helps job seekers tailor their resumes for specific job postings using AI-powered analysis. The platform features resume upload, job description parsing, AI-driven content tailoring, fit score calculation, and professional PDF generation with multiple templates.

**Current State**: ✅ **PRODUCTION** - Fully implemented with subscription payments, multi-tier access control, and anti-exploit measures.

---

## Tech Stack

### Frontend
- **Framework**: Vite 7.1.7 + React 19.1.1 + TypeScript 5.8.3
- **Routing**: React Router DOM v7.9.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Library**: Radix UI primitives (shadcn/ui components)
- **State Management**: React hooks + Supabase realtime (NO Jotai)
- **Icons**: Lucide React 0.544.0
- **Animation**: Framer Motion 12.23.19
- **PDF Preview**: @react-pdf/renderer 4.3.1 (client-side only)
- **Drag-and-Drop**: react-dropzone 14.3.8, @dnd-kit/core 6.3.1
- **Analytics**: Google Analytics GA4 + Microsoft Clarity

### Backend
- **Database**: Supabase Postgres with Row Level Security (RLS)
- **Authentication**: Supabase Auth (magic link emails)
- **Storage**: Supabase Storage (AES-256 encrypted at rest)
- **Functions**: Supabase Edge Functions (Deno runtime, TypeScript)
- **AI**: OpenAI GPT-4o-mini via Responses API
- **Payments**: Stripe API v17.4.0 with webhook verification
- **PDF Extraction**: PDF.js v4.0.379 (library-based, no AI cost)
- **PDF Generation**: pdfmake (server-side rendering in edge functions)

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend**: Supabase Cloud
- **CDN**: Supabase Storage with signed URLs (1-year expiry)
- **Monitoring**: Google Analytics + Microsoft Clarity

---

## Color System

### Brand Colors (Tailwind Custom)
```javascript
// Actual colors used in production
orange_peel: '#ff9f1c'      // Primary orange - CTAs, highlights
hunyadi_yellow: '#ffbf69'   // Secondary yellow - accents
mint_green: '#cbf3f0'       // Accent mint - success states
light_sea_green: '#2ec4b6'  // Accent teal - links, interactive elements
```

### Shadcn/UI Theme System
Uses CSS variables defined in `frontend/src/index.css`:
- `--primary`, `--secondary`, `--accent` for semantic colors
- HSL format for consistency: `hsl(var(--primary))`
- Dark mode support via `darkMode: ["class"]` in Tailwind config

### Typography
```javascript
// Font families (tailwind.config.js)
heading: ['Plus Jakarta Sans', 'Poppins', 'system-ui', 'sans-serif']
body: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif']
```

**PDF Template Fonts**:
- Templates A & B: Inter (modern, professional)
- Template C: Plus Jakarta Sans (colorful, modern)
- Template D: Arial (compact, dense)

---

## Database Architecture

### Core Tables

#### `email_captures`
**Purpose**: Lead capture before user authentication
```sql
- id, email, uploaded_filename, job_positions
- upload_timestamp, magic_link_clicked, magic_link_clicked_at
- file_url, raw_text
```

#### `user_profiles`
**Purpose**: User metadata + subscription tier + paywall enforcement
```sql
- id, user_id (FK → auth.users) UNIQUE
- full_name, phone, experience_years, target_roles
- tier: 'free' | 'pro' | 'max'
- resumes_lifetime_count (anti-exploit counter - NEVER decrements)
- stripe_customer_id, stripe_subscription_id
- subscription_status, subscription_current_period_end
```

#### `resumes`
**Purpose**: Uploaded resume files + extracted text
```sql
- id, user_id, file_url, file_name, file_size
- raw_text (PDF.js extraction), page_count
- parsing_status: 'pending' | 'processing' | 'completed' | 'failed'
- jobs_created_count (anti-exploit counter per resume)
```

#### `jobs`
**Purpose**: Job descriptions + tailored resumes + AI insights
```sql
- id, user_id, resume_id, job_title, job_description, job_url
- tailored_json (ContentBlock[] array), template_used: 'A'|'B'|'C'|'D'
- pdf_url (signed URL, 1-year expiry)
- generation_status: 'pending' | 'generating' | 'completed' | 'failed'
- fit_score (0-100%), fit_score_breakdown, missing_skills, recommendations
```

#### `tailored_content_cache` (Layer 1 Cache)
**Purpose**: Cache AI-generated content to avoid redundant AI calls
```sql
- id, resume_id, job_id, tailored_blocks, layout_decision
- fit_score, fit_score_breakdown, missing_skills, recommendations
- detected_language (ISO 639-1), detected_language_name
- UNIQUE(resume_id, job_id)
```

#### `generated_resumes` (Layer 2 Cache)
**Purpose**: Cache rendered PDFs to avoid redundant generation
```sql
- id, tailored_content_id, template_id: 'A'|'B'|'C'|'D'
- pdf_url (Supabase Storage signed URL)
- UNIQUE(tailored_content_id, template_id)
```

### Database Functions

#### Tier Configuration
```sql
get_tier_limits(p_tier TEXT) → TABLE(resumes_limit, jobs_per_resume_limit, can_generate_pdfs)
```
- Free: 1 resume, 5 jobs/resume, NO PDF generation
- Pro: 3 resumes, 25 jobs/resume, unlimited PDFs
- Max: 10 resumes, 100 jobs/resume, unlimited PDFs

#### Paywall Enforcement
```sql
can_upload_resume(p_user_id UUID) → JSONB {allowed, reason}
can_add_job(p_user_id UUID, p_resume_id UUID) → JSONB {allowed, reason}
can_generate_pdf(p_user_id UUID) → JSONB {allowed, reason, tier}
```

**Anti-Exploit Design**: Lifetime counters NEVER decrement (prevents delete→create→download loop).

---

## Subscription Tiers & Pricing

| Tier | Price | Resumes | Jobs/Resume | PDF Generation |
|------|-------|---------|-------------|----------------|
| **Free** | $0 | 1 | 5 | ❌ NO (paywall) |
| **Pro** | $8.99/mo | 3 | 25 | ✅ Unlimited |
| **Max** | $17.99/mo | 10 | 100 | ✅ Unlimited |

**Free Tier Strategy**: Users see AI insights but cannot download PDFs (conversion funnel).

**Economics**: Free = $0.05 cost (loss leader), Pro = 92% margin, Max = 44% margin.

---

## Supabase Edge Functions

### 1. `parse-resume` (PDF Text Extraction)
**Purpose**: Extract raw text from PDF using PDF.js (NO AI cost)

### 2. `generate-tailored-resume` (AI Orchestration - 7 Steps)
**Purpose**: AI-powered resume tailoring + PDF generation

**Flow**:
1. Paywall check (server-side security)
2. Layer 1 cache check (content cache)
3. AI Step 0: Detect resume language
4. AI Step 1: Analyze compatibility
5. AI Step 2A: Extract raw blocks VERBATIM
6. AI Step 2B: Tailor blocks with JD keywords
7. AI Step 3: Calculate fit score (0-100%)
8. AI Step 4: Detect missing skills
9. AI Step 5: Generate recommendations
10. AI Step 6: Decide layout
11. Save to Layer 1 cache
12. Layer 2 cache check (PDF cache)
13. Render PDF with pdfmake
14. Upload to Supabase Storage
15. Save to Layer 2 cache

**AI Model**: GPT-4o-mini, Temperature: 0.1, Cost: ~$0.05-0.07/generation

**Anti-Hallucination**: Step 2A preserves all metrics verbatim, Step 2B validates no fabrication.

**Multilingual**: All AI outputs match detected resume language (en, pt, es, etc.).

### 3. `scrape-job-url` (Job Description Extraction)
**Supported**: LinkedIn, Indeed, Greenhouse, Lever, generic fallback

### 4. `create-checkout-session` (Stripe Checkout)
**Purpose**: Create Stripe subscription checkout session (Pro/Max)

### 5. `stripe-webhook` (Stripe Event Handler)
**Events**: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed

### 6. `cancel-subscription` (Cancel Subscription)
**Purpose**: Cancel Stripe subscription (retains access until period end)

### 7. `delete-job` (Delete Job & Cache)
**Purpose**: Delete job + Layer 1/2 cache + PDF from Storage (does NOT decrement counters)

### 8. `bulk-generate-resumes` (Parallel PDF Generation)
**Purpose**: Generate PDFs for all 4 templates (A, B, C, D) in parallel

---

## Frontend Architecture

### Project Structure
```
frontend/src/
├── components/
│   ├── layout/ (AppLayout, app-sidebar)
│   ├── templates/ (TemplateA, TemplateB, TemplateC, TemplateD)
│   ├── ui/ (shadcn/ui components)
│   └── UploadModal, ResumeUpload, PaywallModal
├── pages/
│   ├── Landing, DashboardPage, MyResumesPage
│   ├── TailoringPageV2 (main tailoring interface)
│   ├── GeneratedResumesPage, BillingPage, BillingDetailsPage
│   └── PaymentSuccessPage, Privacy, Terms, Support
├── lib/
│   ├── supabase.ts, analytics.ts, clarity.ts
│   ├── paywall.ts (client-side paywall checks)
│   └── uploadResume.ts, parseResume.ts
└── App.tsx (routing), main.tsx
```

### Routing (React Router v7)
```
/ → Landing page
/app/dashboard → DashboardPage
/app/my-resumes → MyResumesPage
/app/tailor/:resumeId → TailoringPageV2
/app/generated-resumes/:resumeId → GeneratedResumesPage
/app/billing → BillingPage (subscription plans)
/app/billing-details → BillingDetailsPage
/app/billing/success → PaymentSuccessPage
/privacy, /terms, /support → Static pages
```

---

## Key User Flows

### 1. Authentication (Magic Link)
1. User clicks "Get Started" → Opens UploadModal
2. Enters email → Saved to `email_captures`
3. Receives magic link email → Clicks link → Auto-signin
4. `on_auth_user_created` trigger creates `user_profiles` with tier='free'
5. Redirected to `/app/dashboard`

### 2. Resume Upload & Parsing
1. Upload PDF → Supabase Storage (`resume` bucket)
2. Frontend calls `parse-resume` edge function
3. Edge function extracts text with PDF.js, saves `raw_text` to `resumes`
4. Frontend polls `parsing_status` until 'completed'

### 3. Job Description & Tailoring
1. User enters job via URL scraping or manual paste
2. Client-side paywall check: Free tier → Show PaywallModal, Pro/Max → Enable "Generate"
3. User selects template (A/B/C/D)
4. Frontend calls `generate-tailored-resume` edge function
5. Edge function: Paywall check → AI orchestration → PDF generation
6. Frontend displays: PDF download, fit score, missing skills, recommendations

### 4. Payment & Upgrade
1. User hits tier limit → PaywallModal appears
2. User clicks "Upgrade to Pro/Max" → Calls `create-checkout-session`
3. Redirected to Stripe → Completes payment
4. Stripe webhook updates `user_profiles.tier` and `subscription_status`
5. Redirected to `/app/billing/success` → New limits active

---

## Paywall Architecture (3-Layer Defense)

### Layer 1: Client-Side UX
**File**: `/frontend/src/lib/paywall.ts`
**Purpose**: Show PaywallModal, disable buttons
**Functions**: `checkCanUploadResume()`, `checkCanAddJob()`, `checkCanGeneratePDF()`

### Layer 2: Server-Side Security
**File**: `/backend/supabase/functions/generate-tailored-resume/index.ts`
**Purpose**: Prevent API abuse by direct edge function calls
**Implementation**: `can_generate_pdf()` check before AI processing, returns 402 if unauthorized

### Layer 3: Database-Level Constraints
**File**: `/backend/supabase/migrations/20251106000001_add_lifetime_usage_counters.sql`
**Purpose**: Prevent delete→create→download exploit
**Implementation**: Lifetime counters increment on INSERT, NEVER decrement on DELETE

---

## PDF Template System

### Templates
- **Template A**: Modern Single Column (50 lines max, 24pt name, 14pt headings, 11pt body)
- **Template B**: Professional Two Column (50 lines max, sidebar for contact/skills/education)
- **Template C**: Modern with Color (blue header #4299e1, white backgrounds, black text)
- **Template D**: Compact Dense (60 lines max, 20pt name, 11pt headings, 9pt body)

### Rendering
- **Client-Side Preview**: `@react-pdf/renderer` (React components)
- **Production PDFs**: `pdfmake` (server-side JSON schema in edge function)

---

## Analytics & Tracking

### Google Analytics (GA4)
**Tracking ID**: `G-TF36NSEQ0S`
**Events**: Landing page view, upload, job paste, PDF generation, checkout started/completed

### Microsoft Clarity
**Purpose**: Session recordings, heatmaps, user behavior analysis

---

## Environment Variables

### Frontend
```
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
VITE_GA_TRACKING_ID=G-TF36NSEQ0S
VITE_CLARITY_PROJECT_ID, VITE_APP_URL
```

### Backend (Supabase Secrets)
```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SIGNING_SECRET
STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_MAX, APP_URL
```

---

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

### Backend (Supabase)
```bash
supabase start   # Start local Supabase (Docker)
supabase db reset
supabase functions deploy <function-name>
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase functions logs <function-name> --tail
```

---

## Security & Privacy

- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Authentication**: Magic links (passwordless), JWT tokens (1-week expiry)
- **RLS**: All tables have Row Level Security policies
- **Data Retention**: User-managed (no auto-deletion)
- **Compliance**: GDPR/CCPA privacy policy at `/privacy`

---

## Known Issues & Fixes

### Issue #1: Multilingual Support (FIXED)
**Fix**: Step 0 detects resume language, all AI outputs match detected language.
**Migration**: `20251125000001_add_language_detection.sql`

### Issue #2: AI Hallucination (FIXED)
**Fix**: Step 2A extracts raw content verbatim, Step 2B validates no fabrication.
**Function**: `validateNoFabricatedMetrics()` in `generate-tailored-resume/index.ts`

### Issue #3: Delete-Create Exploit (FIXED)
**Fix**: Lifetime counters NEVER decrement.
**Migration**: `20251106000001_add_lifetime_usage_counters.sql`

---

## Caching Strategy (2-Layer System)

### Layer 1: Content Cache
**Table**: `tailored_content_cache`
**Savings**: 5 AI API calls (~$0.04) when user switches templates for same job
**Key**: `UNIQUE(resume_id, job_id)`

### Layer 2: PDF Cache
**Table**: `generated_resumes`
**Savings**: Instant PDF retrieval (0.5s vs 3-5s generation)
**Key**: `UNIQUE(tailored_content_id, template_id)`

---

## NOT Implemented

❌ **Affiliate System** (no creator tracking)
❌ **Manual Review Option** (AI-only)
❌ **DOCX Output** (PDF only)
❌ **Resume Embeddings** (no vector search)
❌ **Monthly Credit Resets** (lifetime limits)

---

## Important Reminders

1. **State Management**: NO Jotai - Use React hooks + Supabase realtime
2. **Color System**: Orange/teal brand colors (NOT pastel colors)
3. **Paywall**: 3-layer enforcement (client + server + database)
4. **Anti-Exploit**: Lifetime counters NEVER decrement
5. **Caching**: 2-layer system saves AI costs
6. **Multilingual**: AI outputs MUST match detected resume language
7. **Anti-Hallucination**: Validate AI output against raw content
8. **Templates**: Client preview = React, Production = pdfmake
9. **Tier System**: Free = no PDFs (paywall), Pro/Max = unlimited PDFs
10. **Stripe**: Webhook signature verification is CRITICAL

---

**Last Updated**: 2025-12-25
**Codebase Version**: main (commit d579df7)
**Document Version**: 2.0
