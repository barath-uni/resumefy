# PKD — ResumeTailor (Refined Pre-MVP Version with Soft Error Flow)

**Tagline options:**

* Everyone Deserves a Callback — Tailor Your Resume, Get Noticed.
* Tailored Resumes. Interview-Ready Results.
* One Job. One Resume. One More Interview.

---

## Executive Summary

ResumeTailor helps job seekers upload their resume, indicate target roles, and capture interest **without any real processing yet**. This pre-MVP version focuses on **collecting user emails and role intentions** while maintaining trust through a smooth soft-error flow that communicates ongoing work.

**Primary goal:** Validate user interest in JD-tailored resumes while building an email list for early adopters.

Success KPIs (first 30 days):

* Email capture rate ≥ 10%
* Upload interactions ≥ 20% of visitors
* Role-link submission rate ≥ 5%
* Magic link confirmation rate ≥ 50% of emails sent

---

## Product Scope

### Pre-MVP (0–7 days)

* **Landing page** with modal to upload resume + enter job links + email (magic link)
* **Frontend stack:** Vite + React + Tailwind CSS + Shadcn UI components
* **Backend stack:** Supabase (auth + email capture table)
* **Soft error flow:** After email confirmation, show a 404-style page: "Something went wrong. We are working on it and will notify you when results are ready." Smooth animation, user-friendly copy.
* **Analytics:** Google Analytics tracking for page views, upload button clicks, and post-magic-link visits.

### Post-Validation MVP (7–30 days)

* Resume parsing + scan results
* JD paste box + optional URL
* Credit packs for tailoring
* Stripe checkout + webhook
* Deliverables: ATS-optimized PDF + editable DOCX
* Affiliate tracking (basic)

---

## Feature Breakdown — Pre-MVP

### 1) Landing Page (Desktop + Mobile)

**Purpose:** Capture emails, role intent, and simulate upload interaction.

**Desktop Layout:**

* Top nav: Logo left; Pricing, How it works, For Creators right
* Hero: Headline + subhead + primary CTA ("Upload Your Resume")
* Upload modal: drag/drop or select file, input for job links, email field, magic link button
* Features section: Role match, Tailor to JD, Privacy-first
* Footer: privacy statement, legal

**Mobile:** stacked sections; pinned CTA; modal adapts to screen size

**Microcopy:** CTAs like "Upload Your Resume", "Paste Role Links", "Confirm Email to View Results"

### 2) Upload Modal Flow

1. User clicks "Upload Resume" → modal opens
2. Drag/drop PDF/DOCX or select file
3. Input job links for roles they want to apply
4. Enter email → click "Send Magic Link"
5. Modal closes with confirmation: "Check your email to confirm and view results"

### 3) Magic Link Flow

* Supabase sends magic link to email
* On click: redirect to results page
* Results page shows **soft error**: "Something went wrong. We are working on it and will notify you when results are ready." Subtle animation to maintain trust

### 4) Analytics

* Track page views, upload button clicks, role link inputs
* Track post-magic-link visits and engagement on error page
* Google Analytics events for each step of the funnel

### 5) Design Tokens & Typography

**Colors:**

* **Orange Peel**: `#ff9f1c` (primary buttons and CTAs)
* **Hunyadi Yellow**: `#ffbf69` (accents and highlights)
* **White**: `#ffffff` (clean page background)
* **Mint Green**: `#cbf3f0` (card backgrounds and soft elements)
* **Light Sea Green**: `#2ec4b6` (secondary buttons and borders)

**Typography:**

* Headings: Plus Jakarta Sans or Poppins
* Body: Noto Sans / Inter
* Sizes: H1 36–44px, H2 28–32px, body 16px

### 6) Animations & UI/UX

* Framer Motion for modal open/close, upload animation, progress bars
* Soft fade + slide for error page
* Smooth transitions between upload modal → email confirm → error page

---

## Launch Plan (Pre-MVP)

**Day 0–2:** Build landing page + upload modal + email capture with Supabase + magic link flow
**Day 3–5:** Integrate Google Analytics for funnel tracking
**Day 6–7:** Test full flow, deploy on Vercel
**Day 8:** Share link in LinkedIn groups, Reddit, Discord, FB groups; collect emails and role links
**Next Steps:** Review interest, refine MVP with parsing and JD-tailoring engine

---

**Key Principle:** Maintain trust with users — no fake results. Collect email + role interest, show smooth soft-error page to communicate ongoing work and forthcoming features.
