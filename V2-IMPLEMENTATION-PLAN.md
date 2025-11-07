# 🎯 RESUMEFY V2 - DETAILED IMPLEMENTATION PLAN

**Created:** October 2, 2025
**Goal:** Build fully functional resume tailoring platform with AI optimization

---

## 📊 CURRENT STATE (What We Have Built)

### ✅ Frontend Foundation
- **Landing Page**
  - Hero section with pricing ($14.99/month)
  - Features section (save 5+ hours, role-fit scores, ATS optimization)
  - How It Works section (4 steps)
  - Pricing section (Free Trial vs Pro)
  - Enhanced CTA section
  - Footer with legal links

- **Upload Modal (4-Step Flow)**
  - Step 1: Resume upload + email input
  - Step 2: Multiple job description inputs (URL or text)
  - Step 3: Payment intent question ($14.99/month willingness to pay)
  - Step 4: Email confirmation message

- **Legal Pages**
  - Privacy Policy (`/privacy`)
  - Terms of Service (`/terms`)
  - Support Page (`/support`)

- **Tech Stack**
  - React + TypeScript + Vite
  - React Router for navigation
  - Tailwind CSS + Shadcn UI components
  - Framer Motion for animations
  - Google Analytics 4 tracking

### ✅ Backend Foundation
- **Supabase Setup**
  - Authentication (magic link system)
  - Database tables:
    - `email_captures` (email, uploaded_filename, job_positions, payment_intent)
    - `magic_links` (token, email, expires_at)
    - `user_profiles` (linked to auth.users)

- **Infrastructure**
  - Vercel deployment configured
  - Environment variables setup
  - Git repository structure

### ✅ Analytics & Tracking
- Landing page views
- Upload attempts
- Email submissions
- Magic link clicks
- Payment intent tracking (yes/maybe/no)
- Job positions added count
- File upload success

---

## 🎯 V2 GOALS (What We Need to Build)

### Core Functionality
❌ Resume upload → storage → parsing
❌ Job description input & processing
❌ AI-powered resume tailoring (OpenAI)
❌ Fit score calculation (0-100%)
❌ **Subscription paywall (weekly or monthly)**
❌ 3 professional PDF templates (React-PDF)
❌ PDF generation & download
❌ Complete dashboard with end-to-end flow

### User Journey (SIMPLIFIED - NO CREDITS)
```
Upload Resume → Parse → Add Job → AI Tailor → View Fit Score
    ↓
PAYWALL: "Subscribe to download" ($14.99/month or weekly)
    ↓
After Payment → Select Template → Download PDF
```

### Monetization Strategy
- **Free tier:** Upload resume + get AI tailoring + see fit score
- **Paid tier:** Unlock PDF downloads with subscription
- **No credit tracking** - simpler to build and deploy fast

---

## 📋 PRIORITY IMPLEMENTATION PLAN

---

### **PHASE 1: Database Schema Extension** ⏱️ 30 mins
**Priority: CRITICAL** | **Dependency: None**

**Objective:** Extend database to store resumes, jobs, and credit tracking

**Tasks:**
1. Create migration file: `20250926000001_add_v2_tables.sql`

2. **Resumes Table**
   ```sql
   CREATE TABLE resumes (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     file_url TEXT NOT NULL,              -- Supabase Storage URL
     file_name TEXT NOT NULL,
     file_size INTEGER,
     parsed_json JSONB,                   -- Structured resume data
     parsing_status TEXT DEFAULT 'pending', -- pending/processing/completed/failed
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_resumes_user_id ON resumes(user_id);
   ```

3. **Jobs Table** (tailored resumes for specific job postings)
   ```sql
   CREATE TABLE jobs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
     job_title TEXT NOT NULL,
     job_description TEXT NOT NULL,
     job_url TEXT,
     tailored_json JSONB,                 -- AI-optimized resume data
     fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
     missing_skills TEXT[],               -- Array of skills user lacks
     template_used TEXT DEFAULT 'A',      -- A/B/C template selection
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_jobs_user_id ON jobs(user_id);
   CREATE INDEX idx_jobs_resume_id ON jobs(resume_id);
   ```

4. **Update User Profiles for Subscriptions**
   ```sql
   -- Add subscription fields to existing user_profiles table
   ALTER TABLE user_profiles
   ADD COLUMN subscription_status TEXT DEFAULT 'free'
     CHECK (subscription_status IN ('free', 'weekly_paid', 'monthly_paid')),
   ADD COLUMN subscription_start_date TIMESTAMP,
   ADD COLUMN subscription_end_date TIMESTAMP,
   ADD COLUMN stripe_customer_id TEXT,
   ADD COLUMN stripe_subscription_id TEXT;
   ```

5. **RLS Policies**
   ```sql
   -- Resumes
   ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own resumes" ON resumes FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own resumes" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can update own resumes" ON resumes FOR UPDATE USING (auth.uid() = user_id);
   CREATE POLICY "Users can delete own resumes" ON resumes FOR DELETE USING (auth.uid() = user_id);

   -- Jobs
   ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = user_id);
   ```

6. **Helper Function for Subscription Check**
   ```sql
   CREATE OR REPLACE FUNCTION is_user_subscribed(p_user_id UUID)
   RETURNS BOOLEAN AS $$
   DECLARE
       v_status TEXT;
       v_end_date TIMESTAMP;
   BEGIN
       SELECT subscription_status, subscription_end_date
       INTO v_status, v_end_date
       FROM user_profiles
       WHERE id = p_user_id;

       IF v_status IN ('weekly_paid', 'monthly_paid') THEN
           IF v_end_date IS NULL OR v_end_date > NOW() THEN
               RETURN TRUE;
           END IF;
       END IF;
       RETURN FALSE;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

7. **Apply migrations to Supabase**

**Deliverable:** Database schema ready for V2 features

**Files Created:**
- `backend/supabase/migrations/20250926000001_add_v2_tables.sql`
- `backend/supabase/migrations/20250927000001_add_subscription_model.sql`

---

### **PHASE 2: Resume Upload & Storage** ⏱️ 2 hours
**Priority: HIGH** | **Dependency: Phase 1**

**Objective:** Allow users to upload resumes to Supabase Storage

**Tasks:**
1. **Supabase Storage Setup**
   - Create bucket `resumes` (private, max 5MB files)
   - Configure RLS policies for authenticated users only

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install react-dropzone
   ```

3. **Update Dashboard Component** (`frontend/src/pages/Dashboard.tsx`)
   - Add resume upload dropzone using `react-dropzone`
   - Show current resume info (name, size, upload date)
   - "Replace Resume" button if resume exists
   - Loading state during upload
   - Error handling for file size/type validation

4. **Create Upload Handler** (`frontend/src/lib/uploadResume.ts`)
   ```typescript
   export async function uploadResume(
     file: File,
     userId: string
   ): Promise<{ fileUrl: string; resumeId: string }>
   ```
   - Validate file type (PDF/DOCX only)
   - Validate file size (<5MB)
   - Upload to Supabase Storage
   - Insert record in `resumes` table
   - Return file URL and resume ID

5. **UI Components**
   - Dropzone with drag-and-drop
   - File preview (name, size, type icon)
   - Progress indicator
   - Success/error toast notifications

**Deliverable:** Users can upload resumes to Supabase Storage

**Files Created/Modified:**
- `frontend/src/lib/uploadResume.ts` (new)
- `frontend/src/pages/Dashboard.tsx` (update)

---

### **PHASE 3: Resume Processing (3-Step Architecture)** ⏱️ 8 hours total
**Priority: HIGH** | **Dependency: Phase 2**

**REVISED ARCHITECTURE:** We're splitting resume processing into 3 distinct phases for reliability, cost-efficiency, and testability.

```
Phase 3A: PDF → Text (Library-based, no AI) → $0 cost, 99% reliability
Phase 3B: Text → Tailored JSON (AI-powered) → ~$0.01/job, 95% reliability
Phase 3C: JSON → PDF (Template-based) → $0 cost, 100% reliability
```

---

### **PHASE 3A: PDF Text Extraction (Library-Based)** ⏱️ 1 hour
**Priority: CRITICAL** | **Dependency: Phase 2**

**Objective:** Reliably extract raw text from PDF resumes using deterministic parsing libraries

**Strategy:** Use `pdf-parse` library (Deno-compatible) instead of AI for text extraction

**Why Library-Based Extraction:**
- ✅ **Reliable:** Guaranteed text extraction (no AI hallucinations)
- ✅ **Cost:** $0 (no API calls)
- ✅ **Fast:** ~1-2 seconds vs 10-20 seconds for AI
- ✅ **Maintainable:** No prompt engineering, no API changes
- ✅ **Scalable:** Parse once, tailor many times

**Tasks:**

1. **Update Database Schema**
   ```sql
   -- Add raw_text column to resumes table
   ALTER TABLE resumes
   ADD COLUMN raw_text TEXT,
   ADD COLUMN page_count INTEGER,
   ADD COLUMN extracted_at TIMESTAMP;
   ```

2. **Refactor Edge Function** (`supabase/functions/parse-resume/index.ts`)

   **Replace AI-based parsing with library-based extraction:**
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   // Use pdfjs for Deno (no OpenAI needed!)
   import * as pdfjs from 'https://cdn.skypack.dev/pdfjs-dist@3.11.174'

   serve(async (req) => {
     const { resumeId, fileUrl } = await req.json()

     // Download PDF from Supabase Storage
     const supabase = createClient(...)
     const filePath = fileUrl.split('/resume/')[1]
     const { data: fileData } = await supabase.storage
       .from('resume')
       .download(filePath)

     // Extract text using pdfjs (deterministic, no AI)
     const arrayBuffer = await fileData.arrayBuffer()
     const pdf = await pdfjs.getDocument(arrayBuffer).promise

     let rawText = ''
     for (let i = 1; i <= pdf.numPages; i++) {
       const page = await pdf.getPage(i)
       const textContent = await page.getTextContent()
       const pageText = textContent.items.map(item => item.str).join(' ')
       rawText += pageText + '\n\n'
     }

     // Save raw text to database
     await supabase.from('resumes').update({
       raw_text: rawText,
       page_count: pdf.numPages,
       extracted_at: new Date().toISOString(),
       parsing_status: 'completed'
     }).eq('id', resumeId)

     return new Response(JSON.stringify({
       success: true,
       resumeId,
       text: rawText,
       pages: pdf.numPages
     }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

3. **Deploy Updated Edge Function**
   ```bash
   supabase functions deploy parse-resume
   ```

4. **Frontend Integration** (`frontend/src/lib/parseResume.ts`)
   ```typescript
   export interface ExtractResult {
     success: boolean
     resumeId?: string
     text?: string
     pages?: number
     error?: string
   }

   export async function extractResumeText(
     resumeId: string,
     fileUrl: string
   ): Promise<ExtractResult> {
     const { data, error } = await supabase.functions.invoke('parse-resume', {
       body: { resumeId, fileUrl }
     })

     if (error) return { success: false, error: error.message }
     return data as ExtractResult
   }
   ```

5. **Dashboard Updates** (`frontend/src/pages/Dashboard.tsx`)
   - Show loading: "Extracting text from resume..."
   - Display extracted text in collapsible section
   - Show metadata: pages, word count
   - "Next: Add Job Description" CTA

**Deliverable:** Users see extracted resume text in Dashboard (no AI, no cost, fast & reliable)

**Files Modified:**
- `backend/supabase/migrations/20251029000003_add_raw_text_column.sql` (new)
- `backend/supabase/functions/parse-resume/index.ts` (refactor - remove OpenAI)
- `frontend/src/lib/parseResume.ts` (update)
- `frontend/src/pages/Dashboard.tsx` (display extracted text)

---

### **PHASE 3B: AI-Powered Resume Tailoring** ⏱️ 3 hours
**Priority: CRITICAL** | **Dependency: Phase 3A**

**Objective:** Structure + tailor resume text to match job descriptions using AI

**Strategy:** Use OpenAI only for structuring + tailoring (NOT extraction)

**Why AI Here:**
- ✅ Understands context (job titles, skills, achievements)
- ✅ Rewrites bullets to emphasize relevant keywords
- ✅ Calculates fit score
- ✅ Identifies missing skills

**Cost:** ~$0.01-0.02 per tailoring (text-based, much cheaper than PDF parsing)

**Tasks:**

1. **Create New Edge Function**
   ```bash
   supabase functions new tailor-resume
   ```

2. **Implement Tailoring** (`supabase/functions/tailor-resume/index.ts`)
   ```typescript
   import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

   interface TailoredResult {
     tailored_json: ResumeJson  // Structured + optimized
     fit_score: number          // 0-100
     missing_skills: string[]   // Skills user lacks
     recommendations: string[]  // Improvement suggestions
   }

   serve(async (req) => {
     const { resumeId, jobTitle, jobDescription, userId } = await req.json()

     // Load raw_text from resumes table
     const { data: resume } = await supabase
       .from('resumes')
       .select('raw_text')
       .eq('id', resumeId)
       .single()

     // Call OpenAI to structure + tailor
     const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
     const response = await openai.chat.completions.create({
       model: "gpt-4o-mini",
       messages: [{
         role: "system",
         content: `You are a professional resume writer. Given raw resume text and a job description:
         1. Extract structured data (header, summary, experience, education, skills)
         2. Tailor content to match job keywords
         3. Calculate fit score (0-100)
         4. Identify missing skills
         Return JSON only.`
       }, {
         role: "user",
         content: `Resume Text:\n${resume.raw_text}\n\nJob Title: ${jobTitle}\n\nJob Description:\n${jobDescription}`
       }],
       response_format: { type: "json_object" },
       temperature: 0.3
     })

     const result: TailoredResult = JSON.parse(response.choices[0].message.content)

     // Save to jobs table
     const { data: job } = await supabase.from('jobs').insert({
       user_id: userId,
       resume_id: resumeId,
       job_title: jobTitle,
       job_description: jobDescription,
       tailored_json: result.tailored_json,
       fit_score: result.fit_score,
       missing_skills: result.missing_skills
     }).select().single()

     return new Response(JSON.stringify({
       success: true,
       jobId: job.id,
       ...result
     }))
   })
   ```

3. **Set OpenAI API Key** (if not already set)
   ```bash
   cd backend
   supabase secrets set OPENAI_API_KEY=sk-your-key-here
   ```

4. **Deploy Edge Function**
   ```bash
   supabase functions deploy tailor-resume
   ```

5. **Frontend Integration** (`frontend/src/lib/tailorResume.ts`)
   ```typescript
   export async function tailorResume(
     resumeId: string,
     jobTitle: string,
     jobDescription: string,
     userId: string
   ) {
     const { data, error } = await supabase.functions.invoke('tailor-resume', {
       body: { resumeId, jobTitle, jobDescription, userId }
     })
     if (error) throw error
     return data
   }
   ```

6. **Dashboard UI Updates**
   - Add job description input form
   - "Tailor Resume" button
   - Loading: "AI is optimizing your resume..."
   - Display results:
     - Fit score gauge (0-100%)
     - Missing skills badges
     - Recommendations list
   - "Download PDF" CTA (Phase 3C)

**Deliverable:** Users get AI-tailored resumes with fit scores

**Files Created/Modified:**
- `backend/supabase/functions/tailor-resume/index.ts` (new)
- `frontend/src/lib/tailorResume.ts` (new)
- `frontend/src/pages/Dashboard.tsx` (add job input form)
- `frontend/src/components/FitScoreGauge.tsx` (new)

---

### **PHASE 3C: INTELLIGENT TEMPLATE ENGINE (Text → Professional PDF)** ⏱️ 6 hours
**Priority: CRITICAL** | **Dependency: Phase 3A** | **THE MONEY MAKER 💰**

**Objective:** Convert raw resume text to beautifully formatted PDFs using AI-powered layout engine

**REVISED STRATEGY:** Two-phase AI system for flexible, content-aware template rendering

```
Raw Text → [AI: Extract Flexible Blocks] → [AI: Decide Layout per Template] → [React-PDF: Adaptive Render] → Beautiful PDF
```

**Why This Approach:**
- ✅ **NO rigid schema** - Handles any resume format (like resume.io)
- ✅ **Content-aware** - AI decides what goes where based on template
- ✅ **Overflow-proof** - Auto-scales font, truncates intelligently
- ✅ **Missing sections OK** - Only renders what exists
- ✅ **Two-column support** - AI places blocks in sidebar vs main
- ✅ **Cost:** ~$0.015 per PDF (2 AI calls, still 97% margin!)

---

### **PHASE 3C.1: Flexible Block Extraction** ⏱️ 1 hour
**Objective:** AI extracts resume content as flexible, prioritized blocks (NO rigid structure)

**Core Schema:**
```typescript
interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: 'contact' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'custom'
  priority: number  // 1-10, AI decides importance
  content: any
  metadata: {
    estimatedLines: number  // AI predicts space needed
    isOptional: boolean
    keywords: string[]
  }
}

interface FlexibleResumeData {
  blocks: ContentBlock[]
  suggestedLayout: 'single-column' | 'two-column' | 'compact'
  totalEstimatedPages: number
}
```

**Tasks:**

1. **Create Edge Function**
   ```bash
   cd backend
   supabase functions new extract-resume-blocks
   ```

2. **Implement Flexible Extraction** (`backend/supabase/functions/extract-resume-blocks/index.ts`)
   - Takes `raw_text` from Phase 3A
   - AI identifies sections dynamically (not hardcoded)
   - Returns prioritized blocks with estimated space
   - Suggests best template type

3. **AI Prompt Strategy:**
   ```
   Extract resume as flexible blocks. Return JSON:
   - Each block has: category, priority (1-10), estimated lines
   - Priority 10 = critical (header, experience)
   - Priority 1-5 = optional (hobbies, certifications)
   - Suggest template based on content density
   - If no certifications section, don't create empty block
   ```

4. **Deploy Edge Function**

5. **Frontend Integration** (`frontend/src/lib/extractBlocks.ts`)

**Deliverable:** Resume content as flexible blocks, ready for any template

---

### **PHASE 3C.2: AI Layout Decision Engine** ⏱️ 1.5 hours
**Objective:** AI decides HOW to place blocks in EACH template (smart placement)

**Template Definitions:**
```typescript
interface TemplateConstraints {
  id: 'A' | 'B' | 'C'
  type: 'single-column' | 'two-column' | 'compact'
  maxLinesPerPage: number
  sidebarCategories?: string[]  // For two-column
  mainCategories?: string[]
  spacing: 'comfortable' | 'compact'
}

interface LayoutDecision {
  template: TemplateConstraints
  placement: {
    [blockId: string]: {
      section: 'main' | 'sidebar' | 'header'
      order: number
      fontSize: number  // Auto-calculated to fit
      maxLines?: number  // Truncate if needed
    }
  }
  fits: boolean
  warnings: string[]
}
```

**Tasks:**

1. **Create Edge Function**
   ```bash
   supabase functions new decide-layout
   ```

2. **Implement Layout Decision** (`backend/supabase/functions/decide-layout/index.ts`)
   - Input: Flexible blocks + Template constraints
   - AI decides: sidebar vs main, order, font sizes
   - Handles overflow: scale fonts or truncate old jobs
   - Returns placement map for React-PDF

3. **AI Prompt Strategy:**
   ```
   You're a professional resume designer.

   Template: {template.name} with {constraints}
   Content blocks: {blocks}

   Decide:
   1. Which blocks go in sidebar vs main (for two-column)
   2. Order of sections (visual hierarchy)
   3. Font sizes to fit everything on 1 page
   4. What to truncate if content overflows

   Return JSON with placement decisions.
   ```

4. **Deploy Edge Function**

5. **Frontend Integration** (`frontend/src/lib/decideLayout.ts`)

**Deliverable:** Smart layout decisions for each template, no hardcoded rules

---

### **PHASE 3C.3: Adaptive React-PDF Renderer** ⏱️ 3.5 hours
**Objective:** Build Template A with dynamic rendering based on AI decisions

**Template A: Modern Single-Column** (MVP - 80% of users prefer this)

**Key Features:**
- Content-aware spacing
- Smart overflow handling
- Only renders existing sections
- Font auto-scaling
- Dynamic bullet truncation

**Tasks:**

1. **Install React-PDF**
   ```bash
   cd frontend
   npm install @react-pdf/renderer
   ```

2. **Create Adaptive Template A** (`frontend/src/pdf/TemplateA.tsx`)
   ```typescript
   import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

   interface TemplateAProps {
     blocks: ContentBlock[]
     layoutDecision: LayoutDecision
   }

   // Renders blocks based on AI placement decisions
   // Auto-scales fonts, handles missing sections
   // Prevents overflow with dynamic truncation
   ```

3. **Create Block Renderer** (handles all block types dynamically)
   - Header block → Name, contact
   - Experience block → Title, company, bullets
   - Education block → Degree, school, year
   - Skills block → Tag cloud
   - Handles missing sections gracefully

4. **PDF Generation Utility** (`frontend/src/lib/generatePDF.ts`)
   ```typescript
   export async function generateAdaptivePDF(
     rawText: string,
     template: 'A' | 'B' | 'C'
   ): Promise<Blob> {
     // Step 1: Extract flexible blocks (AI call #1)
     const blocks = await extractResumeBlocks(rawText)

     // Step 2: Decide layout for template (AI call #2)
     const layout = await decideLayout(blocks, getTemplateConstraints(template))

     // Step 3: Render with React-PDF (adaptive, no AI)
     const TemplateComponent = getTemplate(template)
     const blob = await pdf(<TemplateComponent blocks={blocks} layout={layout} />).toBlob()

     return blob
   }
   ```

5. **Dashboard Integration**
   - Add "Generate PDF" button after text extraction
   - Show loading: "AI is structuring your resume..."
   - Then: "Creating professional PDF..."
   - Download automatically

6. **Test with Sample Resume**
   - Test with resume that has ALL sections
   - Test with resume MISSING certifications
   - Test with 2 jobs vs 10 jobs (overflow handling)
   - Verify fonts scale correctly

**Deliverable:** Working Template A that handles ANY resume format, no overflow issues

**Files Created:**
- `backend/supabase/functions/extract-resume-blocks/index.ts` (new)
- `backend/supabase/functions/decide-layout/index.ts` (new)
- `frontend/src/lib/extractBlocks.ts` (new)
- `frontend/src/lib/decideLayout.ts` (new)
- `frontend/src/lib/generatePDF.ts` (new)
- `frontend/src/pdf/TemplateA.tsx` (new)
- `frontend/src/pdf/BlockRenderer.tsx` (new helper)
- `frontend/src/pages/Dashboard.tsx` (add PDF generation button)

**Templates B & C:** (Future - after Template A works)
- Template B: Two-column with sidebar (1.5 hours)
- Template C: ATS-friendly compact (1 hour)

---

**TOTAL PHASE 3C TIME:** 6 hours for complete intelligent system
**MVP (Template A only):** 4 hours

**Cost Per Resume:**
- Extract blocks: $0.01 (GPT-4o-mini)
- Decide layout: $0.005 (GPT-4o-mini)
- Render PDF: $0 (React-PDF client-side)
- **Total: $0.015** → Still 97% margin at $14.99/month! 💰

**Model Choice:** **OpenAI GPT-4o-mini** (fast, cheap, good for structured output)

**Tasks:**

1. **Create Edge Function**
   ```bash
   supabase functions new tailor-resume
   ```

2. **Implement Tailoring** (`supabase/functions/tailor-resume/index.ts`)
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

   interface TailoredResult {
     tailored_json: ResumeJson
     fit_score: number
     missing_skills: string[]
     recommendations: string[]
   }

   serve(async (req) => {
     const { resumeId, jobTitle, jobDescription, userId } = await req.json()

     // Get resume data
     const supabase = createClient(...)
     const { data: resume } = await supabase
       .from('resumes')
       .select('parsed_json')
       .eq('id', resumeId)
       .single()

     // Call OpenAI (no credit check needed - free tier gets tailoring)
     const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
     const response = await openai.chat.completions.create({
       model: "gpt-4o-mini",
       messages: [{
         role: "system",
         content: "You are a professional resume writer..."
       }, {
         role: "user",
         content: `
           Analyze this resume against the job and:
           1. Calculate fit score (0-100)
           2. Identify missing skills
           3. Optimize resume (keep facts, add keywords, reorder bullets)

           Resume: ${JSON.stringify(resume.parsed_json)}
           Job Title: ${jobTitle}
           Job Description: ${jobDescription}
         `
       }],
       response_format: { type: "json_object" }
     })

     const result: TailoredResult = JSON.parse(response.choices[0].message.content)

     // Save to jobs table
     const { data: job } = await supabase.from('jobs').insert({
       user_id: userId,
       resume_id: resumeId,
       job_title: jobTitle,
       job_description: jobDescription,
       tailored_json: result.tailored_json,
       fit_score: result.fit_score,
       missing_skills: result.missing_skills
     }).select().single()

     return new Response(JSON.stringify({ success: true, jobId: job.id, ...result }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

3. **Deploy Edge Function**
   ```bash
   supabase functions deploy tailor-resume
   ```

5. **Frontend Integration** (`frontend/src/lib/tailorResume.ts`)
   ```typescript
   export async function tailorResume(
     resumeId: string,
     jobTitle: string,
     jobDescription: string,
     userId: string
   ) {
     const { data, error } = await supabase.functions.invoke('tailor-resume', {
       body: { resumeId, jobTitle, jobDescription, userId }
     })

     if (error) throw error
     return data
   }
   ```

6. **Dashboard UI Updates**
   - Add "Job Description" textarea
   - Add "Job Title" input
   - "Tailor Resume" button
   - Show loading state (AI is working...)
   - Display results:
     - Fit score with progress bar/gauge
     - Missing skills badges
     - Recommendations list

**Deliverable:** Users get AI-tailored resumes with fit scores (secure, server-side)

**Files Created/Modified:**
- `supabase/functions/tailor-resume/index.ts` (new Edge Function)
- `frontend/src/lib/tailorResume.ts` (new - calls Edge Function)
- `frontend/src/lib/subscription.ts` (new - check subscription status)
- `frontend/src/pages/Dashboard.tsx` (update)
- `frontend/src/components/FitScoreDisplay.tsx` (new)
- `frontend/src/components/PaywallModal.tsx` (new - show after tailoring)

---

### **PHASE 5: PDF Template System** ⏱️ 4 hours
**Priority: HIGH** | **Dependency: Phase 4**

**Objective:** Create 3 professional resume templates

**Library:** **@react-pdf/renderer** (free, React-based PDF generation)

**Tasks:**

1. **Install React-PDF**
   ```bash
   npm install @react-pdf/renderer
   ```

2. **Create Template Components**

   **Template A: Modern Single-Column**
   - File: `frontend/src/pdf/TemplateA.tsx`
   - Style: Clean, modern, single column
   - Header with contact info
   - Summary section
   - Experience with bullet points
   - Education and skills

   **Template B: Two-Column with Sidebar**
   - File: `frontend/src/pdf/TemplateB.tsx`
   - Style: Professional, sidebar for skills
   - Left sidebar: Skills, contact, education
   - Right column: Summary, experience

   **Template C: Classic ATS-Friendly**
   - File: `frontend/src/pdf/TemplateC.tsx`
   - Style: Traditional, minimal formatting
   - Optimized for ATS parsing
   - Simple black text, no complex layouts

3. **Shared Template Interface**
   ```typescript
   interface TemplateProps {
     resumeData: ResumeJson
   }
   ```

4. **Template Preview Thumbnails**
   - Create static preview images (PNG)
   - Store in `public/templates/`
   - Show in template selector

5. **Template Selector UI**
   - Component: `frontend/src/components/TemplateSelector.tsx`
   - Radio button selection
   - Preview thumbnails
   - "Generate PDF" button

**Deliverable:** 3 professional resume templates ready

**Files Created:**
- `frontend/src/pdf/TemplateA.tsx` (new)
- `frontend/src/pdf/TemplateB.tsx` (new)
- `frontend/src/pdf/TemplateC.tsx` (new)
- `frontend/src/components/TemplateSelector.tsx` (new)
- `public/templates/preview-a.png` (new)
- `public/templates/preview-b.png` (new)
- `public/templates/preview-c.png` (new)

---

### **PHASE 6: PDF Rendering & Download** ⏱️ 3 hours
**Priority: HIGH** | **Dependency: Phase 5**

**Objective:** Generate and download tailored resumes as PDFs

**Tasks:**

1. **PDF Generation Utility** (`frontend/src/lib/generatePDF.ts`)
   ```typescript
   import { pdf } from '@react-pdf/renderer'

   export async function generatePDF(
     resumeData: ResumeJson,
     template: 'A' | 'B' | 'C'
   ): Promise<Blob>
   ```

2. **Download Handler**
   - Generate PDF blob
   - Trigger browser download
   - Filename: `Resume_${jobTitle}_Template${template}.pdf`

3. **Dashboard Integration**
   - After tailoring, show template selector
   - Click template → generate + download PDF
   - Show download progress
   - Success message with file name

4. **Download History Section**
   - List all previously tailored jobs
   - Show: Job title, fit score, date, template used
   - "Re-download" button for each
   - "Delete" option

5. **Update Jobs Table**
   - Store `template_used` when PDF is generated
   - Track download count (optional analytics)

**Deliverable:** Users can download tailored PDFs in 3 formats

**Files Created/Modified:**
- `frontend/src/lib/generatePDF.ts` (new)
- `frontend/src/pages/Dashboard.tsx` (update)
- `frontend/src/components/JobHistory.tsx` (new)

---

### **PHASE 7: Frontend Dashboard Integration** ⏱️ 4 hours
**Priority: MEDIUM** | **Dependency: All previous phases**

**Objective:** Polish complete end-to-end user experience

**Tasks:**

1. **State Management**
   - Use React Context or Zustand for global state
   - Track: currentResume, currentJob, credits, user

2. **Dashboard Layout** (`frontend/src/pages/Dashboard.tsx`)
   ```
   ┌─────────────────────────────────────────┐
   │ Header: Logo, Credits Badge, Sign Out  │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Step 1: Upload Resume (if none)        │
   │   └─ Show parsed resume preview        │
   │                                         │
   │ Step 2: Add Job Description            │
   │   ├─ Job Title Input                   │
   │   ├─ Job Description Textarea          │
   │   └─ "Tailor Resume" Button            │
   │                                         │
   │ Step 3: View Results (after tailoring) │
   │   ├─ Fit Score Gauge                   │
   │   ├─ Missing Skills Badges             │
   │   └─ Recommendations List              │
   │                                         │
   │ Step 4: Select Template & Download     │
   │   ├─ Template A/B/C Previews           │
   │   └─ Download Button                   │
   │                                         │
   │ Download History                        │
   │   └─ Table of past jobs                │
   │                                         │
   └─────────────────────────────────────────┘
   ```

3. **Loading States**
   - Uploading resume: Spinner
   - Parsing resume: "Analyzing your resume..."
   - Tailoring: "AI is optimizing... (~30 sec)"
   - Generating PDF: "Creating your resume..."

4. **Error Handling**
   - File upload errors
   - Parsing failures
   - AI API errors
   - Credit limit reached
   - Network errors
   - Toast notifications for all errors

5. **Empty States**
   - No resume uploaded: "Upload your first resume"
   - No jobs created: "Add a job description to get started"
   - Credits exhausted: Upgrade CTA

6. **Responsive Design**
   - Mobile-friendly layout
   - Collapsible sections on small screens

**Deliverable:** Smooth, polished end-to-end user experience

**Files Modified:**
- `frontend/src/pages/Dashboard.tsx` (major refactor)
- `frontend/src/contexts/AppContext.tsx` (new - global state)
- `frontend/src/components/ErrorBoundary.tsx` (new)

---

### **PHASE 8: Subscription Paywall** ⏱️ 2 hours
**Priority: HIGH** | **Dependency: Phase 4**

**Objective:** Show paywall after AI tailoring to unlock PDF downloads

**Tasks:**

1. **Subscription Check Utility** (`frontend/src/lib/subscription.ts`)
   ```typescript
   export async function isUserSubscribed(userId: string): Promise<boolean> {
     const { data } = await supabase.rpc('is_user_subscribed', { p_user_id: userId })
     return data || false
   }
   ```

2. **Paywall Modal** (`frontend/src/components/PaywallModal.tsx`)
   - Trigger: Show after AI tailoring completes (if user not subscribed)
   - Title: "Ready to download your tailored resume?"
   - Message: "Subscribe to unlock PDF downloads"
   - Pricing options:
     - **Weekly:** $4.99/week
     - **Monthly:** ~~$19.99~~ **$14.99/month** (Save 25%)
   - Benefits:
     - ✅ Unlimited resume downloads
     - ✅ All 3 professional templates
     - ✅ Tailor for unlimited jobs
     - ✅ Cancel anytime
   - CTA: "Subscribe Now" (links to Stripe checkout)
   - Secondary: "Not now" (close modal)

3. **Dashboard Flow Logic**
   ```typescript
   // After AI tailoring completes
   const isSubscribed = await isUserSubscribed(user.id)

   if (!isSubscribed) {
     showPaywallModal()
   } else {
     showTemplateSelector() // Allow PDF download
   }
   ```

4. **Subscription Status Display**
   - Badge in header for paid users: "Pro ✨"
   - Free users: Show "Free Plan"

5. **Analytics Events**
   - Track: `paywall_viewed`
   - Track: `subscribe_clicked`
   - Track: `paywall_dismissed`

**Deliverable:** Paywall shown to free users after tailoring, subscription check working

**Files Created/Modified:**
- `frontend/src/components/PaywallModal.tsx` (new)
- `frontend/src/lib/subscription.ts` (new)
- `frontend/src/pages/Dashboard.tsx` (update - add paywall logic)

---

## 🔄 IMPLEMENTATION ORDER (Sprint Plan)

### **Sprint 1: Core Engine** (Day 1-2)
1. ✅ Phase 1: Database Schema (30 min)
2. ✅ Phase 2: Resume Upload (2 hrs)
3. ✅ Phase 3: Resume Parsing (3 hrs)
4. ✅ Phase 4: AI Tailoring (4 hrs)

**Milestone:** Users can upload resume and get AI-tailored version with fit score

---

### **Sprint 2: Output & Polish** (Day 3)
5. ✅ Phase 5: PDF Templates (4 hrs)
6. ✅ Phase 6: PDF Rendering (3 hrs)
7. ✅ Phase 7: Dashboard Integration (4 hrs)

**Milestone:** Users can download professional PDFs

---

### **Sprint 3: Monetization** (Day 4)
8. ✅ Phase 8: Subscription Paywall (2 hrs)

**Milestone:** V2 ready for production launch (Stripe integration in separate phase)

---

## 📦 DEPENDENCIES & LIBRARIES

### New Dependencies to Install
```bash
# Frontend
npm install @react-pdf/renderer     # PDF generation (client-side)
npm install react-dropzone          # File upload UI
npm install zustand                 # State management (optional)

# Supabase Edge Functions (Deno runtime - no npm install needed)
# - OpenAI: imported via https://deno.land/x/openai@v4.20.1/mod.ts
# - Supabase Client: imported via https://esm.sh/@supabase/supabase-js@2
```

### Environment Variables
```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://resumefy.com

# Supabase Secrets (set via CLI)
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### Supabase CLI Setup
```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

---

## 🎯 SUCCESS CRITERIA

After completing all 8 phases, users should be able to:

1. ✅ Sign up with magic link authentication
2. ✅ Upload resume (PDF/DOCX)
3. ✅ See parsed resume data with structured fields
4. ✅ Paste job description for any role
5. ✅ Get AI-tailored resume with:
   - Fit score (0-100%)
   - Missing skills identified
   - Optimization recommendations
6. ✅ See paywall modal after tailoring (if not subscribed)
7. ✅ Subscribe (weekly or monthly) to unlock downloads
8. ✅ Select from 3 professional templates (if subscribed)
9. ✅ Download tailored PDF resume (if subscribed)
10. ✅ View download history of all past jobs

---

## 🚨 DEVELOPMENT PRINCIPLES

### 1. **Don't Reinvent the Wheel**
- Use existing libraries wherever possible
- Prefer **free/open-source** solutions first
- Test with free tiers of paid APIs before committing

### 2. **Speed Over Perfection**
- Use the **easiest model to integrate** (OpenAI GPT-4o-mini)
- Don't over-engineer
- Ship fast, iterate later

### 3. **Free-First Strategy**
- **Supabase Edge Functions** (500k free invocations/month) for all backend logic
- OpenAI GPT-4o-mini for both parsing and tailoring (fastest to integrate)
- `@react-pdf/renderer` (free) for PDF generation
- Supabase Storage for file upload

### 4. **Security-First Architecture**
- **NEVER expose API keys in frontend**
- All AI/LLM calls via Supabase Edge Functions
- API keys stored as Supabase Secrets
- Frontend only calls Edge Functions

### 5. **Architecture Comparison**
| Approach | Cost | Security | Complexity |
|----------|------|----------|------------|
| ❌ Frontend OpenAI calls | Low | **INSECURE** | Low |
| ❌ Separate Node.js backend | High hosting | Secure | High |
| ✅ **Supabase Edge Functions** | **Free tier** | **Secure** | **Low** |

---

## 🏁 NEXT STEPS

**Ready to start Phase 1: Database Schema Setup**

Create the migration file with tables for:
- `resumes` (file storage + parsed JSON)
- `jobs` (tailored resumes + fit scores)
- `user_credits` (20 free limit tracking)

Shall we begin? 🚀
