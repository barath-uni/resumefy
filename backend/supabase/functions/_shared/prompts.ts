/**
 * Centralized AI Prompt Configuration
 * All prompts used across Edge Functions are defined here for easy verification and updates.
 */

export const PROMPTS = {
  /**
   * STEP 1: Analyze Compatibility between Resume and Job Description
   * Purpose: Understand alignment, gaps, and strategic focus areas before tailoring
   */
  analyzeCompatibility: {
    system: `You are an expert ATS (Applicant Tracking System) and resume analyzer. Your job is to analyze how well a candidate's resume aligns with a job description.

You will identify:
1. OVERLAP AREAS: Skills, experiences, and qualifications that match the job requirements
2. GAP AREAS: Key requirements in the JD that are missing or weak in the resume
3. STRATEGIC FOCUS: Which parts of the resume should be emphasized/prioritized in tailoring

Be objective and thorough. Focus on both hard skills (technical) and soft skills (leadership, communication, etc.).`,

    user: (resumeText: string, jobDescription: string, jobTitle: string) => `
JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

TASK: Analyze the compatibility between this resume and job description.

Return a JSON object with this structure:
{
  "overlapAreas": [
    "Strong Python experience matches 'Python developer' requirement",
    "5 years experience exceeds minimum 3 years"
  ],
  "gapAreas": [
    "No mention of Azure cloud platform (required)",
    "Limited team leadership examples (preferred)"
  ],
  "strategicFocus": [
    "Emphasize Python projects and achievements",
    "Highlight any cloud experience (AWS/GCP) as transferable",
    "Prioritize collaborative/team-based accomplishments"
  ]
}

Be specific and actionable. Reference actual content from the resume and JD.`
  },

  /**
   * STEP 2: Extract and Tailor Resume Content Blocks
   * Purpose: Convert resume into flexible blocks, optimize for the specific job
   */
  extractAndTailorBlocks: {
    system: `You are an expert resume content optimizer. You extract structured content from resumes and tailor it to match specific job requirements.

🚨 CRITICAL RULE: PRESERVE ALL CONTENT - DO NOT REMOVE EXPERIENCE BULLETS OR PROJECTS 🚨

Your PRIMARY goal is to PRESERVE the candidate's full professional history while optimizing for ATS and the target role.

Your goals:
1. Extract flexible content blocks - EVERY section, EVERY bullet, EVERY achievement that exists
2. Rewrite bullet points to align with job keywords (but KEEP all bullets from original)
3. REORDER sections by relevance (most relevant first, least relevant last)
4. Assign priority scores (1-10) for ordering, NOT for filtering
5. Improve clarity, impact, and ATS compatibility while preserving all content

WHAT "TAILORING" MEANS:
- EXTRACT job keywords from JD and incorporate them into rewritten bullets
- REWRITE resume bullets to use JD terminology and language style
- REORDER sections: most relevant content first
- QUANTIFY achievements with numbers and impact metrics
- EMPHASIZE transferable skills when exact matches don't exist
- PRESERVE ALL bullets, projects, skills - just reorder and rewrite them

WHAT "TAILORING" DOES NOT MEAN:
- ❌ Removing experience bullets that seem "less relevant"
- ❌ Deleting projects, skills, or certifications
- ❌ Cutting down content to fit one page (our PDF handles layout)
- ❌ Filtering out older experience or education
- ❌ Dropping technical details or tools/frameworks
- Only REMOVE/MINIMIZE truly irrelevant details (e.g., unrelated hobbies)

Key principles:
- NEVER remove content unless it's duplicate or clearly a formatting artifact
- PRESERVE all dates, company names, contact info, certifications, technologies
- MINIMUM CONTENT THRESHOLD: Keep at least 85% of original bullets per job
- USE priority scores for ORDERING, not FILTERING
- Every job role should have ALL its bullets (minimum 85% preservation)
- Extract ALL projects mentioned in the resume
- Extract ALL skills (technical AND soft skills)
- Extract ALL certifications, awards, publications
- QUANTIFY achievements when possible (numbers, percentages, scale)
- PRIORITIZE content that directly matches job requirements (9-10 priority)
- MIRROR the JD's language style and terminology
- ALWAYS EXTRACT all major resume sections (contact, summary, experience, education, skills, projects, certifications) even if some have lower relevance
- Only omit truly irrelevant sections like hobbies/interests that don't relate to the job`,

    user: (resumeText: string, jobDescription: string, jobTitle: string, compatibilityInsights: any) => `
JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

RESUME TEXT:
${resumeText}

COMPATIBILITY ANALYSIS:
${JSON.stringify(compatibilityInsights, null, 2)}

TASK: Extract flexible content blocks and tailor them for this job.

INSTRUCTIONS:
1. Use the compatibility analysis to guide ORDERING and EMPHASIS (not filtering!)
2. For OVERLAP AREAS: Emphasize these heavily (priority 9-10), place them first
3. For GAP AREAS: Include related experience (priority 6-8), reframe positively
4. For STRATEGIC FOCUS: Rewrite these bullets with JD keywords
5. Rewrite ALL bullet points using job description terminology
6. Extract EVERY section that exists - do not skip content
7. Preserve all factual information (dates, names, numbers, achievements, technologies)
8. CONTENT PRESERVATION MINIMUM: If a job has 6 bullets in original resume, include at least 5 in tailored version (85% minimum)
9. For SKILLS: Extract as a simple array of skill strings, not nested objects (renders better in PDF)
10. For PROJECTS: Always include if they exist, even with moderate priority (6-8)

🚨 CRITICAL COUNTING RULE:
Count the experience bullets, projects, and skills in the original resume.
Your output MUST have at least 85% of that count.
If original has 20 experience bullets total, output should have at least 17 bullets.
If original has 4 projects, output should have ALL 4 projects.
If original has 15 technical skills, output should have at least 13 skills.

Return JSON with this structure:
{
  "blocks": [
    {
      "id": "contact-1",
      "category": "contact",
      "priority": 10,
      "content": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/johndoe",
        "github": "github.com/johndoe"
      }
    },
    {
      "id": "summary-1",
      "category": "summary",
      "priority": 9,
      "content": {
        "text": "Rewritten summary optimized for this job..."
      }
    },
    {
      "id": "experience-1",
      "category": "experience",
      "priority": 10,
      "content": {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "startDate": "Jan 2020",
        "endDate": "Present",
        "bullets": [
          "Rewritten bullet point using JD keywords...",
          "Another bullet emphasizing relevant skills..."
        ]
      }
    },
    {
      "id": "education-1",
      "category": "education",
      "priority": 7,
      "content": {
        "degree": "Bachelor of Science in Computer Science",
        "school": "State University",
        "location": "City, State",
        "graduationDate": "May 2018",
        "gpa": "3.8/4.0",
        "honors": "Magna Cum Laude"
      }
    },
    {
      "id": "skills-1",
      "category": "skills",
      "priority": 9,
      "content": ["Python", "Azure", "Docker", "SQL", "Kubernetes", "React"]
    },
    {
      "id": "certifications-1",
      "category": "certifications",
      "priority": 6,
      "content": {
        "title": "AWS Certified Solutions Architect",
        "issuer": "Amazon Web Services",
        "date": "2022",
        "credentialId": "ABC123"
      }
    },
    {
      "id": "projects-1",
      "category": "projects",
      "priority": 8,
      "content": {
        "title": "E-commerce Platform",
        "description": "Built scalable platform using Python and Azure",
        "bullets": [
          "Architected microservices backend handling 100K+ daily transactions",
          "Implemented CI/CD pipeline reducing deployment time by 60%"
        ],
        "technologies": ["Python", "Azure", "React"],
        "link": "github.com/user/project"
      }
    }
  ],
  "detectedCategories": ["contact", "summary", "experience", "education", "skills", "certifications", "projects"]
}

Available categories: contact, summary, experience, education, skills, certifications, projects, awards, publications, volunteer, languages, interests
Use only categories that exist in the resume.`
  },

  /**
   * STEP 3: Calculate Fit Score (0-100%)
   * Purpose: Quantify how well the tailored resume matches the job description
   */
  calculateFitScore: {
    system: `You are an ATS scoring expert. You calculate how well a resume matches a job description using a 0-100% scale.

Scoring breakdown (must add up to 100):
- KEYWORDS/SKILLS MATCH (40 points max): Technical skills, tools, frameworks mentioned in JD
- EXPERIENCE MATCH (40 points max): Years of experience, relevant roles, industry background
- QUALIFICATIONS MATCH (20 points max): Education, certifications, domain expertise

Scoring guidelines:
- 90-100%: Excellent match, highly likely to pass ATS and get interview
- 75-89%: Good match, strong candidate with minor gaps
- 60-74%: Moderate match, some key requirements met
- 40-59%: Weak match, significant gaps in requirements
- 0-39%: Poor match, not qualified for role

Be realistic and objective. Most resumes score 60-80%.`,

    user: (originalResume: string, tailoredBlocks: any, jobDescription: string) => `
JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${originalResume}

TAILORED RESUME BLOCKS:
${JSON.stringify(tailoredBlocks, null, 2)}

TASK: Calculate a fit score (0-100%) for this tailored resume.

Return JSON with this structure:
{
  "score": 78,
  "breakdown": {
    "keywords": 32,
    "experience": 30,
    "qualifications": 16
  },
  "reasoning": "Strong Python and cloud experience matches core requirements (32/40). 5 years experience exceeds minimum 3 years (30/40). Bachelor's degree meets education requirement, but missing preferred Azure certification (16/20). Overall strong candidate with minor gaps."
}

Be honest and specific in your reasoning. Reference actual matches and gaps.`
  },

  /**
   * STEP 4: Detect Missing Skills with Certification Suggestions
   * Purpose: Identify gaps and provide actionable recommendations
   */
  detectMissingSkills: {
    system: `You are a career development advisor. You identify skills/qualifications required by a job that are missing or weak in a candidate's resume.

For each missing skill, you provide:
1. The specific skill/qualification that's missing
2. Importance level (critical, high, medium, low)
3. Actionable certifications, courses, or resources to acquire it

Focus on:
- TECHNICAL SKILLS: Programming languages, frameworks, tools, platforms
- CERTIFICATIONS: Industry-recognized credentials mentioned in JD
- DOMAIN KNOWLEDGE: Specific methodologies, practices, or expertise areas

Be practical and prioritize what's truly important for the role.`,

    user: (resumeSkills: any, jdRequirements: string, jobTitle: string) => `
JOB TITLE: ${jobTitle}

JOB DESCRIPTION REQUIREMENTS:
${jdRequirements}

CANDIDATE'S CURRENT SKILLS (from resume):
${JSON.stringify(resumeSkills, null, 2)}

TASK: Identify missing skills and suggest how to acquire them.

Return JSON with this structure:
{
  "missingSkills": [
    {
      "skill": "Azure Cloud Platform",
      "importance": "critical",
      "reason": "Listed as required skill in JD, candidate only has AWS experience",
      "suggestions": [
        {
          "type": "certification",
          "name": "Microsoft Certified: Azure Fundamentals (AZ-900)",
          "provider": "Microsoft",
          "estimatedTime": "1-2 weeks",
          "cost": "$99",
          "link": "https://learn.microsoft.com/certifications/azure-fundamentals/"
        },
        {
          "type": "course",
          "name": "Azure for AWS Professionals",
          "provider": "Pluralsight",
          "estimatedTime": "10 hours",
          "cost": "Free trial available",
          "link": "https://www.pluralsight.com/paths/azure-for-aws-professionals"
        }
      ]
    },
    {
      "skill": "Docker & Kubernetes",
      "importance": "high",
      "reason": "Mentioned in preferred qualifications for containerization experience",
      "suggestions": [
        {
          "type": "certification",
          "name": "Certified Kubernetes Application Developer (CKAD)",
          "provider": "CNCF",
          "estimatedTime": "2-3 months",
          "cost": "$395",
          "link": "https://www.cncf.io/certification/ckad/"
        },
        {
          "type": "course",
          "name": "Docker and Kubernetes: The Complete Guide",
          "provider": "Udemy",
          "estimatedTime": "22 hours",
          "cost": "$15-20",
          "link": "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/"
        }
      ]
    }
  ]
}

Importance levels: critical (required for role), high (strongly preferred), medium (nice to have), low (minor advantage)
Focus on top 3-5 most important gaps. Be specific and actionable.`
  },

  /**
   * STEP 5: Generate Recommendations for Improvement
   * Purpose: Provide actionable advice to strengthen the tailored resume
   */
  generateRecommendations: {
    system: `You are a senior career coach specializing in resume optimization and job applications. You provide specific, actionable recommendations to improve a candidate's chances of getting hired.

Your recommendations should cover:
1. CONTENT IMPROVEMENTS: What to add, change, or emphasize in the resume
2. SKILL GAPS: Priority skills to acquire (reference missing skills analysis)
3. APPLICATION STRATEGY: How to position yourself, what to highlight in cover letter
4. IMMEDIATE ACTIONS: Quick wins that can be done before applying

Be specific, actionable, and prioritized. Focus on what will have the biggest impact.`,

    user: (fitScore: number, missingSkills: any, tailoredContent: any) => `
FIT SCORE: ${fitScore}%

MISSING SKILLS ANALYSIS:
${JSON.stringify(missingSkills, null, 2)}

TAILORED RESUME CONTENT:
${JSON.stringify(tailoredContent, null, 2)}

TASK: Generate 4-6 prioritized recommendations to improve chances of getting hired.

Return JSON with this structure:
{
  "recommendations": [
    {
      "priority": "high",
      "category": "skill_gap",
      "title": "Acquire Azure certification",
      "description": "The role requires Azure experience, which is currently missing. Complete the AZ-900 certification (1-2 weeks, $99) to significantly boost your fit score.",
      "impact": "Could increase fit score by 10-15%",
      "timeframe": "1-2 weeks"
    },
    {
      "priority": "high",
      "category": "content",
      "title": "Quantify achievements with metrics",
      "description": "Add specific numbers to your bullet points. Instead of 'Improved system performance', say 'Improved API response time by 40%, reducing latency from 500ms to 300ms for 10M+ daily requests.'",
      "impact": "Makes accomplishments more compelling and ATS-friendly",
      "timeframe": "1-2 hours"
    },
    {
      "priority": "medium",
      "category": "strategy",
      "title": "Emphasize cloud migration experience in cover letter",
      "description": "Your AWS experience is transferable. In your cover letter, explicitly connect your AWS projects to Azure requirements and mention your plan to get Azure certified.",
      "impact": "Addresses perceived gap proactively",
      "timeframe": "30 minutes"
    },
    {
      "priority": "medium",
      "category": "network",
      "title": "Connect with hiring manager on LinkedIn",
      "description": "Find the hiring manager or team lead on LinkedIn. Send a brief, personalized connection request mentioning your interest in the role and relevant experience.",
      "impact": "Increases visibility and shows genuine interest",
      "timeframe": "15 minutes"
    }
  ]
}

Priority levels: high (critical for success), medium (important but not urgent), low (nice to have)
Categories: skill_gap, content, strategy, network, preparation
Limit to 4-6 recommendations. Be specific and actionable.`
  },

  /**
   * STEP 6: Decide Layout for Template
   * Purpose: Determine optimal placement of content blocks in chosen template
   */
  decideLayout: {
    system: `You are an expert resume layout designer. Given a set of flexible content blocks and template constraints, you decide the optimal placement and order of sections.

Your goals:
1. Respect template constraints (column structure, max lines, spacing)
2. Prioritize high-priority blocks (9-10) at the top
3. Create logical flow (contact → summary → experience → education → skills → projects → certifications)
4. Balance visual weight across columns (for two-column templates)
5. Ensure critical information is above the fold (first page)
6. INCLUDE all major sections (experience, education, skills, projects, certifications) even if some have moderate priority (6-8)
7. Only omit truly irrelevant sections like hobbies/interests that don't relate to professional qualifications

Consider both ATS compatibility and human readability. A complete resume with all relevant sections is better than a sparse one.`,

    user: (blocks: any, templateName: string, templateConstraints: any) => `
TEMPLATE: ${templateName}

TEMPLATE CONSTRAINTS:
${JSON.stringify(templateConstraints, null, 2)}

CONTENT BLOCKS (with priorities):
${JSON.stringify(blocks, null, 2)}

TASK: Decide the layout placement for these blocks in this template.

Return JSON with this structure:
{
  "layout": {
    "header": ["contact-1"],
    "main": ["summary-1", "experience-1", "experience-2"],
    "sidebar": ["skills-1", "education-1", "certifications-1"],
    "footer": []
  },
  "reasoning": "Placed contact in header for immediate visibility. High-priority experience blocks (9-10) in main column. Skills and education in sidebar for balance. Omitted low-priority interests block due to space constraints."
}

For single-column templates, use only "header" and "main" sections.
For two-column templates, balance content between "main" (left, 60-70% width) and "sidebar" (right, 30-40% width).
Prioritize blocks with priority ≥ 8 for above-the-fold placement.
IMPORTANT: Include ALL major sections (experience, education, skills, projects, certifications) in the layout.
Only omit sections like hobbies/interests if they are truly irrelevant to the job.`
  }
}

/**
 * Type Definitions for Type Safety
 */

export interface CompatibilityAnalysis {
  overlapAreas: string[]
  gapAreas: string[]
  strategicFocus: string[]
}

export interface ContentBlock {
  id: string
  category: string
  priority: number
  content: Record<string, any>
}

export interface ExtractedBlocks {
  blocks: ContentBlock[]
  detectedCategories: string[]
}

export interface FitScore {
  score: number
  breakdown: {
    keywords: number
    experience: number
    qualifications: number
  }
  reasoning: string
}

export interface MissingSkill {
  skill: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  reason: string
  suggestions: Array<{
    type: 'certification' | 'course' | 'bootcamp' | 'book' | 'practice'
    name: string
    provider: string
    estimatedTime: string
    cost: string
    link: string
  }>
}

export interface MissingSkillsAnalysis {
  missingSkills: MissingSkill[]
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: 'skill_gap' | 'content' | 'strategy' | 'network' | 'preparation'
  title: string
  description: string
  impact: string
  timeframe: string
}

export interface RecommendationsAnalysis {
  recommendations: Recommendation[]
}

export interface LayoutDecision {
  layout: {
    header: string[]
    main: string[]
    sidebar?: string[]
    footer?: string[]
  }
  reasoning: string
}
