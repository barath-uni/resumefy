# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resumefy is a SaaS web application that helps job seekers optimize their resumes for specific job postings. The platform allows users to upload resumes, get role-fit assessments, and generate job-specific optimized resumes through AI-powered analysis and tailoring.

## Development Phases

### Current State: Pre-Development
This repository currently contains product specifications but no implemented code.

### Pre-MVP (Days 0-7)
- **Frontend**: Vite + React + Tailwind CSS + Shadcn UI components
- **Backend**: Supabase (auth + database)
- **Purpose**: Email capture and interest validation with soft error flow
- **Key Features**: Landing page, upload modal, magic link auth, analytics

### MVP (Days 8-30)
- Resume parsing integration (Affinda/Sovren)
- JD parsing and tailoring engine
- Credit-based payment system (Stripe)
- File generation (PDF/DOCX outputs)
- Affiliate tracking system

## Tech Stack (Planned)

### Frontend
- **Framework**: Vite + React
- **Styling**: Tailwind CSS + Shadcn UI
- **Animation**: Framer Motion
- **Typography**: Plus Jakarta Sans/Poppins (headings), Noto Sans/Inter (body)

### Backend
- **Database/Auth**: Supabase
- **Payments**: Stripe with webhooks
- **File Storage**: Encrypted storage with AES-256
- **Resume Parsing**: Affinda or Sovren integration
- **AI**: OpenAI API for resume tailoring

### Infrastructure
- **Hosting**: Vercel (frontend)
- **Analytics**: Google Analytics
- **Email**: Supabase Auth (magic links)

## Color Palette
- `--tea-green: #ccd5aeff` (accent backgrounds)
- `--beige: #e9edc9ff` (section cards)
- `--cornsilk: #fefae0ff` (page background)
- `--papaya-whip: #faedcdff` (muted card backgrounds)
- `--buff: #d4a373ff` (primary CTAs)

## Architecture Overview

### Data Models (Planned)
- **User**: id, email, createdAt, retentionPref, creditBalance, affiliateId
- **Resume**: id, userId, originalFilePath, parsedJson, language, pages, confidence
- **JobDescription**: id, sourceUrl, rawText, parsedJDJson
- **OptimizationJob**: id, resumeId, jdId, type (quick|deep|human), status, outputFiles
- **Transaction**: id, userId, amount, currency, stripeSession, affiliateCode
- **Affiliate**: id, creatorName, code, payoutInfo

### Key API Endpoints (Planned)
- `POST /upload` → file upload, returns uploadId
- `POST /auth/magic` → send magic link email
- `GET /auth/magic?token=` → login, redirect to results
- `GET /resume/:id/scan` → parsed JSON + role matches
- `POST /jd/parse` → parse JD text or scrape URL
- `POST /optimize` → create optimization job (consumes credits)
- `POST /checkout/create-session` → Stripe checkout
- `POST /webhook/stripe` → payment processing
- `GET /user/dashboard` → user history
- `DELETE /resume/:id` → delete resume & records

## Core Features

### Resume Processing
- File upload (PDF/DOCX) with drag-and-drop
- Third-party parsing integration (Affinda/Sovren)
- Role matching using embeddings/cosine similarity
- Confidence scoring and manual edit fallback

### Job Description Optimization
- Support for text paste, URL scraping (LinkedIn/Indeed), or PDF upload
- LLM-powered parsing to extract: title, responsibilities, skills, keywords
- Side-by-side match visualization (resume vs JD)
- Multiple optimization options: Quick (1 credit), Deep (2+ credits), Human review

### Monetization
- Credit-based system: 5 credits = $10 USD (adjustable by region)
- Affiliate program with creator tracking and payouts
- Future subscription option: $14/month unlimited quick optimizations

## Development Commands

### Pre-MVP Setup
Since no code exists yet, initial setup will be:
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @supabase/supabase-js
npm install framer-motion
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Security & Privacy Requirements

- **Encryption**: TLS in transit, AES-256 at rest for file storage
- **Data Retention**: Default 30-day retention for uploaded resumes
- **Compliance**: GDPR/CCPA compliant with DPA and data export/delete endpoints
- **Access Control**: Role-based access with audit logs
- **API Security**: Rate limiting, input validation, secure token handling

## Quality Controls

### AI/LLM Guidelines
- Low temperature (0.0-0.2) for deterministic resume optimization
- Preserve dates, company names, contact information
- Flag potential hallucinations in audit logs
- Cache identical resume+JD combinations to reduce costs

### File Processing
- Validate file types and sizes before processing
- Show confidence scores for parsed content
- Provide manual edit UI for low-confidence parses
- Generate both PDF and DOCX outputs

## Analytics & Metrics

### Key Events to Track
- Upload created, Magic link clicked, Scan viewed
- JD pasted, Optimization requested, Checkout started/completed
- Downloaded output, Affiliate click/conversion

### Success Metrics
- Upload → scan conversion: ≥25%
- JD paste rate: ≥10%
- Free → paid conversion: 3-7%
- Repeat purchase rate: >20%

## Creator/Affiliate System

- Unique coupon codes and referral links
- Dashboard for earnings tracking
- Pre-written UGC content and assets
- FTC-compliant disclosure requirements
- Commission tracking via cookies/referral attribution