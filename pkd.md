# PKD — ResumeTailor (working name)

**Tagline options (pick one or mix):**
- **Everyone Deserves a Callback — Tailor Your Resume, Get Noticed.**
- **Tailored Resumes. Interview‑Ready Results.**
- **One Job. One Resume. One More Interview.**

---

## Executive summary
This document expands the MVP product specification to include **job-description (JD) contextual tailoring** as a core differentiator. The product helps job seekers upload a resume, quickly assess role-fit, and create *job-specific* resumes (automatically tailored to a pasted JD or job link). The service is privacy-first, credit-based, and built for distribution through LinkedIn creators.

**Primary goal:** Everyone is worthy of an interview callback with a tailored optimization of your resume.

Success KPIs (first 90 days):
- Upload → scan conversion: >= 25%
- JD paste rate (of scanned users): >= 10%
- Paid conversion (free → paid): 3–7%
- Repeat purchase rate for JD tailoring: > 20%

---

## Product scope
### MVP (day 0–30)
- Landing page + email capture via magic link
- Resume upload (PDF/DOCX) and secure storage
- Parsing using a third‑party resume parser (Affinda / Sovren)
- Free scan with: top 3 role matches, 3 prioritized improvement tips
- JD paste box + optional URL input
- Paid tailoring: 1 tailored resume per credit (credits packs)
- Checkout via Stripe + webhook to kick off tailor job
- Deliverables: ATS-optimized PDF + editable DOCX
- Basic affiliate tracking for creators (unique link/coupon)

### Post‑MVP (30–90 days)
- Subscription option (monthly unlimited tailoring)
- Human writer fallback / review queue
- Embedding-based role/job DB for faster matching
- Affiliate dashboard and payouts
- Localization & multi-language resume support

---

## Feature breakdown — detailed
### 1) Landing page (desktop + mobile)
**Purpose:** quick comprehension + fast upload CTA for influencer traffic.
**Layout (desktop):**
- Top nav: Logo (left), Pricing, How it works, For Creators (right)
- Hero (two-column): left = headline + subhead + primary CTA (Upload Resume) + secondary CTA (See pricing); right = animated mock (resume → JD → tailored resume) using Framer Motion.
- Features (three cards horizontally): Role match, Tailor to JD, Privacy first + trust badges (GDPR, encryption).
- How it works (4-step horizontal timeline): Upload → Magic link → Paste JD (optional) → Tailored resume.
- Pricing strip: clear table (Free: 1 scan; Credit packs; Human rewrite price)
- Footer: legal, privacy, affiliate link signup.

**Mobile:** stacked sections; primary CTA pinned; simplified animations.

**Microcopy tips:** keep CTAs concrete: “Get free scan”, “Tailor to a job” rather than abstract verbs.

### 2) Upload flow + magic link
**UX:**
- File drag/drop or select file; allow PDF/DOCX only; show size and page count.
- After upload: ask for email (one-field), show privacy summary: "We delete files after 30 days by default; opt-in to keep" with checkbox.
- Click “Send magic link” button — background: create secure token (JWT short expiry), email sent with magic link.

**Magic link email:** minimal, branded, single CTA: “View your resume insights” — token expires in 15 minutes for security.

**Edge cases:** if user tries multiple uploads with same email, maintain upload history in dashboard.

### 3) Free scan results page
**Top section:** summary card with parse confidence, top 3 role matches (with short rationale) and a single-line “match score” (%).

**Mid section — Improvements:** prioritized list (high → low) with short why + suggested action. Each item has an “Apply quick-fix” button (if free quick fix available, greyed otherwise).

**JD prompt CTA:** “Applying for a role? Paste the job description or link here to tailor this resume” — prominent box.

**Footer — monetization:** credit packs CTA with pricing and one-click upgrade.

### 4) Job-Description (JD) Tailor flow (core differentiator)
**Inputs supported:** raw text paste, URL (LinkedIn/Indeed/Glassdoor), or upload of job PDF. If URL, the system scrapes job content (with user consent) and extracts JD text.

**Parsing JD:** LLM + heuristic extractor to create structured JD: title, responsibilities, required skills, nice-to-have, location, seniority, key keywords.

**Match screen (before tailoring):** show side-by-side:
- Left: user resume important snippets with highlights for matched keywords
- Right: parsed JD summary + labeled must-have skills
- Visual: overlap Venn or progress bar showing match % and top 5 missing/weak items.

**Tailor options:**
- **Quick Tailor (1 credit):** automated bullet rephrasing + topical emphasis (fast, instant)
- **Deep Tailor (2 credits or higher):** re-order sections, prioritize experience, reformat for the job type
- **Human review:** escalate to a resume writer (additional fee + turnaround time)

**Tailor output preview:** before you pay, show a blurred/partial preview (e.g., top half of first page) and a list of the most impactful edits the tailor will do. This increases conversion.

**Delivery:** After successful payment, run the tailor job; show progress indicator. Email user when completed with download link (PDF + DOCX) and an audit log showing what changed (diff-highlight).

**Diff UI:** visually show changes with green highlights for additions, yellow for emphasized words, strike-through for deletions. Also offer a side-by-side text diff.

### 5) Credits & Pricing model
**Base model:** micro-credit packs sold in local currency.
- 1 credit = 1 quick-tailor
- 5 credits = $10 (ROW) / ₹500 (India) — sample; you can tweak
- Human rewrite pricing = $99 (or local equivalent)
- Subscription: $14/mo for unlimited quick tailors (launch later)

**Affiliate pricing:** allow creators to set a promo code (e.g., INFLUENCER20) that gives 10–20% off first purchase; track via cookies/referral link.

**Checkout:** Stripe Checkout; server-side create a session. On success, Stripe webhook triggers the tailor job and logs affiliate attribution.

### 6) User dashboard & history
**Features:**
- Uploaded resumes list with upload date, parse confidence, and actions: view, tailor, delete.
- Credit balance & purchase history
- Tailored resumes with job title tag, download link, and timestamp
- Settings: data retention preference, delete account, API keys for power users (later)

**Admin dashboard:**
- Upload volume, daily processed jobs, failed parses, pending human tasks
- Affiliate conversions with payout statuses
- Manual resume retrieval for disputes (with audit logs)

---

## UI components & layout system (atomic)
- **Container**: 1200–1400px max width, center aligned
- **Grid**: 12-column responsive, 24px gutters
- **Cards**: rounded-2xl, p-6, soft shadow
- **Primary CTA**: `--buff` background, white text, 12px vertical padding, 18px font
- **Secondary CTA**: `--tea-green` outline style
- **Progress / Score bar**: compact pill with numeric % and micro-copy
- **Diff Viewer**: two-column text area, sticky header with toggles (show/hide changes)
- **Job paste box**: large textarea with paste & fetch URL button; accept up to 10k characters

Color tokens (your palette):
- `--tea-green: #ccd5aeff` (accent backgrounds)
- `--beige: #e9edc9ff` (section cards)
- `--cornsilk: #fefae0ff` (page bg)
- `--papaya-whip: #faedcdff` (muted card bg)
- `--buff: #d4a373ff` (primary CTA)

Typography:
- Headings: **Plus Jakarta Sans** or **Poppins** (modern, geometric)
- Body: **Noto Sans / Inter** for multi-language coverage
- Sizes: H1 36–44px, H2 28–32px, body 16px, small 13px

Animation & interactions:
- Use **Framer Motion** for entry/exit animations, loading skeletons, and interactive previews.
- Subtle parallax on hero mock; micro-bounce on CTA press; crossfade between original & tailored preview.

Accessibility:
- Contrast ratios checked for CTAs
- Keyboard focus states for all inputs
- Alt text for images; aria-live for job-processing updates

---

## Data & API design
### Entities (high level)
- **User**: id, email, createdAt, retentionPref, creditBalance, affiliateId
- **Resume**: id, userId, originalFilePath, parsedJson, language, pages, confidence
- **JobDescription**: id, sourceUrl, rawText, parsedJDJson
- **TailorJob**: id, resumeId, jdId (nullable), type (quick|deep|human), status, outputFiles
- **Transaction**: id, userId, amount, currency, stripeSession, affiliateCode
- **Affiliate**: id, creatorName, code, payoutInfo

### Key API endpoints
- `POST /upload` → accept file, returns uploadId
- `POST /auth/magic` → send magic link email
- `GET /auth/magic?token=` → login, redirect to results
- `GET /resume/:id/scan` → returns parsed JSON + match summary
- `POST /jd/parse` → parse JD text or fetch URL
- `POST /tailor` → create tailor job (consumes credit)
- `POST /checkout/create-session` → Stripe session
- `POST /webhook/stripe` → handles payment events
- `GET /user/dashboard` → user history
- `DELETE /resume/:id` → delete resume & records

**Webhook flow (simplified):**
1. Frontend sends checkout create request → backend creates Stripe session with metadata {userId, resumeId, tailorType, affiliateCode}
2. On `checkout.session.completed` event, Stripe posts to `/webhook/stripe`
3. Server verifies event, records transaction, decrements credits (if applicable), queues tailor job
4. Worker processes tailor job (LLM + templates) and posts output to storage + marks tailor job complete
5. System sends an email with secure download link

---

## AI & parsing architecture
### Resume parsing
- Preferred integration: Affinda/Sovren (robust PDF parsing). Save parsed JSON with versioning.
- Fallback steps: if parser confidence < threshold, show manual edit UI for user to correct fields.

### Role matching & embeddings
- Build a small job-role embedding index (initially utilize existing JD corpus + LinkedIn titles) and use cosine similarity over embeddings (OpenAI / client-side vector DB) to find close roles.
- Rank roles by: title similarity, skill overlap, and seniority.

### Tailoring engine
- **Prompt design:** combine parsed resume JSON + JD parsed JSON + template rules to produce rewritten bullets.
- **Temperature and tokens:** use low temperature (0.0–0.2) for deterministic edits; large token limits for long resumes.
- **Caching:** store previous tailor outputs for same resume+JD pair (ids) to avoid duplicate LLM cost.

### Quality controls
- Apply post-processing rules: preserve dates, preserve company names, avoid hallucinating employer names or certifications. Mark hallucination risks in the audit log.
- Use regex checks for phone/email integrity.

---

## Security, privacy & compliance
- **Encryption:** TLS in transit, AES-256 at rest for file storage. Use KMS for key rotation.
- **Data retention:** default 30-day retention for uploaded resumes; allow user to opt-in to longer retention.
- **GDPR/CCPA:** provide Data Processing Agreement (DPA), delete/export endpoints, and clear consent screens describing profiling/automated decisions.
- **Access control:** role-based access for internal staff; logs of who accessed raw resumes.
- **Pen testing and vulnerability scans** before public launch.

---

## Operational runbook (human processes)
- **Human rewrite queue:** writers submit availability and sample work; system assigns tasks with SLAs (48hrs turnaround).
- **Refunds & disputes:** allow 7-day refund window for human rewrites; automated tailored outputs are ineligible unless output blank or parse failure.
- **Support triage:** automated triage bot + email for human escalation.

---

## Analytics & measurement
Events to track:
- Upload created, Magic link clicked, Scan viewed, JD pasted, Tailor requested, Checkout started, Checkout completed, Downloaded output, Affiliate click/conversion
Key metrics:
- CAC by creator, LTV per user, conversion rates per funnel step, churn for subscription, repeat purchase rate for tailoring

A/B tests:
- Pricing (credit pack sizes), CTA copy for landing, Tailor preview amount (blur %), Affiliate incentive ($ vs %)

---

## Edge-cases & failure modes
- **Malformed PDF**: prompt user to re-upload or convert to DOCX; show manual editing UI.
- **Non-English JD/Resume**: detect language; allow TL;DR in English or route to language-specific model version.
- **High hallucination risk**: detect and show warning; require user confirmation before including new claims.

---

## Launch plan (0–90 days)
**Day 0–7:** build landing, upload+magic link, parser integration, free scan prototype, basic JD paste UI (no tailor yet), Stripe sandbox wiring.
**Day 8–21:** implement tailor quick flow + credits + checkout + webhook + deliverable generation. Integrate affiliate tracking and simple admin.
**Day 22–45:** initial small creator pilot (10–30 nano influencers). Collect feedback, fix UX friction, tune AI prompts.
**Day 45–90:** add human rewrite channel, subscription option, analytics, and scale creator outreach.

---

## Creator / Affiliate kit (launch-ready)
- One-page affiliate onboarding form (name, LinkedIn handle, payout details)
- Pre-written UGC posts (short, medium, long) with image assets
- Unique coupon codes + dashboard link for earnings
- Disclosure language: “#ad” plus “I may earn a commission if you purchase” as required by the FTC

---

## Appendix (operational snippets)
**Recommended Stripe metadata fields:** `userId`, `resumeId`, `tailorType`, `affiliateCode`

**Recommended default LLM prompt knobs:** temperature=0.15, max_tokens=1200, stop sequences to prevent over-writing header/footer.

**Sample data retention microcopy:** “We delete uploaded resumes after 30 days by default. You can request immediate deletion from your account settings.”

---

If you’d like, next I can:
- Produce desktop + mobile **wireframes** for the landing page, results page, JD-tailoring screen and checkout modal.  
- Produce the **email/magic-link copy**, and the **Stripe webhook spec** with example payloads.  
- Produce a compact **engineering tasks list** (tickets) prioritized for an initial weekend build.

Tell me which one to do next and I’ll add it to this document.
