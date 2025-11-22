/**
 * AI Helper Functions for Resume Tailoring
 * Reusable functions for making OpenAI API calls with proper error handling
 */

import {
  PROMPTS,
  type CompatibilityAnalysis,
  type RawExtractedBlocks,
  type ExtractedBlocks,
  type FitScore,
  type MissingSkillsAnalysis,
  type RecommendationsAnalysis,
  type LayoutDecision,
} from './prompts.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  response_format?: { type: 'json_object' }
  temperature: number
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Generic function to call OpenAI API
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.1,
  requireJSON = true
): Promise<any> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const requestBody: OpenAIRequest = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
  }

  if (requireJSON) {
    requestBody.response_format = { type: 'json_object' }
  }

  // 🔍 DETAILED LOGGING: Log FULL payload for debugging
  console.log('═══════════════════════════════════════════════════════════')
  console.log('[OpenAI] 📤 REQUEST PAYLOAD DETAILS:')
  console.log(`  - Model: ${MODEL}`)
  console.log(`  - Temperature: ${temperature}`)
  console.log(`  - System prompt length: ${systemPrompt.length} chars`)
  console.log(`  - User prompt length: ${userPrompt.length} chars`)
  console.log(`  - Total input length: ${systemPrompt.length + userPrompt.length} chars`)
  console.log('─────────────────────────────────────────────────────────')
  console.log('[OpenAI] 📝 FULL SYSTEM PROMPT:')
  console.log(systemPrompt)
  console.log('─────────────────────────────────────────────────────────')
  console.log('[OpenAI] 📝 FULL USER PROMPT:')
  console.log(userPrompt)
  console.log('═══════════════════════════════════════════════════════════')

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[OpenAI] ❌ API ERROR:', response.status, errorText)
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data: OpenAIResponse = await response.json()

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenAI API')
  }

  const content = data.choices[0].message.content

  // 🔍 DETAILED LOGGING: Log FULL response
  console.log('═══════════════════════════════════════════════════════════')
  console.log('[OpenAI] 📥 FULL RESPONSE:')
  console.log(`  - Response length: ${content.length} chars`)
  console.log('─────────────────────────────────────────────────────────')
  console.log(content)
  console.log('═══════════════════════════════════════════════════════════')

  // Log token usage for cost tracking
  if (data.usage) {
    console.log(`[OpenAI] 💰 Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`)
  }

  return requireJSON ? JSON.parse(content) : content
}

/**
 * STEP 1: Analyze compatibility between resume and job description
 */
export async function analyzeCompatibility(params: {
  resumeText: string
  jobDescription: string
  jobTitle: string
}): Promise<CompatibilityAnalysis> {
  console.log('[AI] Step 1: Analyzing compatibility...')

  const result = await callOpenAI(
    PROMPTS.analyzeCompatibility.system,
    PROMPTS.analyzeCompatibility.user(params.resumeText, params.jobDescription, params.jobTitle),
    0.1,
    true
  )

  console.log('[AI] Step 1 complete:', {
    overlapCount: result.overlapAreas?.length || 0,
    gapCount: result.gapAreas?.length || 0,
    focusCount: result.strategicFocus?.length || 0,
  })

  return result
}

/**
 * STEP 2A: Extract raw content blocks (NO TAILORING)
 * Pure extraction - copies all content verbatim without rewriting or JD analysis
 */
export async function extractBlocksRaw(params: {
  resumeText: string
}): Promise<RawExtractedBlocks> {
  console.log('[AI] Step 2A: Extracting raw content blocks (no tailoring)...')

  // 🔍 CRITICAL LOGGING: Log resume text statistics
  console.log('🔍 [DEBUG] RESUME TEXT ANALYSIS:')
  console.log(`  - Resume text length: ${params.resumeText.length} chars`)
  console.log(`  - Resume text first 300 chars: ${params.resumeText.substring(0, 300)}`)
  console.log(`  - Resume text last 300 chars: ...${params.resumeText.substring(params.resumeText.length - 300)}`)

  // Check for key sections in original resume
  const hasSkillsSection = params.resumeText.toLowerCase().includes('skill')
  const hasProjectsSection = params.resumeText.toLowerCase().includes('project')
  const hasEducationSection = params.resumeText.toLowerCase().includes('education')
  console.log(`  - Contains "skill" keyword: ${hasSkillsSection}`)
  console.log(`  - Contains "project" keyword: ${hasProjectsSection}`)
  console.log(`  - Contains "education" keyword: ${hasEducationSection}`)

  const result = await callOpenAI(
    PROMPTS.extractBlocksRaw.system,
    PROMPTS.extractBlocksRaw.user(params.resumeText),
    0.1,
    true
  )

  // 🔍 DETAILED VALIDATION: Check content extraction
  console.log('🔍 [DEBUG] RAW EXTRACTED BLOCKS ANALYSIS:')
  console.log(`  - Total blocks extracted: ${result.blocks?.length || 0}`)
  console.log(`  - Detected categories: ${JSON.stringify(result.detectedCategories || [])}`)

  const experienceBlocks = result.blocks?.filter(b => b.category === 'experience') || []
  const totalBullets = experienceBlocks.reduce((sum, exp) => {
    return sum + (exp.content.bullets?.length || 0)
  }, 0)

  const projectBlocks = result.blocks?.filter(b => b.category === 'projects') || []
  const skillBlocks = result.blocks?.filter(b => b.category === 'skills') || []
  const educationBlocks = result.blocks?.filter(b => b.category === 'education') || []

  console.log(`  - Experience blocks: ${experienceBlocks.length}, Total bullets: ${totalBullets}`)
  console.log(`  - Project blocks: ${projectBlocks.length}`)
  console.log(`  - Skill blocks: ${skillBlocks.length}`)
  console.log(`  - Education blocks: ${educationBlocks.length}`)

  // Validation warnings
  if (totalBullets < 5) {
    console.warn(`⚠️ [AI] Low bullet count detected in raw extraction: ${totalBullets}`)
  }

  if (hasSkillsSection && skillBlocks.length === 0) {
    console.error('❌ [CRITICAL] Resume contains SKILLS section but NONE were extracted by AI!')
  }

  if (hasProjectsSection && projectBlocks.length === 0) {
    console.error('❌ [CRITICAL] Resume contains PROJECTS section but NONE were extracted by AI!')
  }

  console.log('[AI] Step 2A complete:', {
    blockCount: result.blocks?.length || 0,
    categories: result.detectedCategories || [],
    experienceBullets: totalBullets,
    projects: projectBlocks.length,
    skillCategories: skillBlocks.length,
    education: educationBlocks.length
  })

  return result
}

/**
 * STEP 2B: Tailor extracted blocks (REWRITING ONLY)
 * Takes raw blocks from Step 2A and tailors them for a specific job
 * Preserves 100% of structure, only rewrites content and assigns priorities
 */
export async function tailorExtractedBlocks(params: {
  rawBlocks: RawExtractedBlocks
  jobDescription: string
  jobTitle: string
  compatibilityInsights: CompatibilityAnalysis
}): Promise<ExtractedBlocks> {
  console.log('[AI] Step 2B: Tailoring extracted blocks...')

  console.log('🔍 [DEBUG] INPUT TO TAILORING:')
  console.log(`  - Raw blocks count: ${params.rawBlocks.blocks?.length || 0}`)
  console.log(`  - Categories: ${JSON.stringify(params.rawBlocks.detectedCategories || [])}`)

  const result = await callOpenAI(
    PROMPTS.tailorExtractedBlocks.system,
    PROMPTS.tailorExtractedBlocks.user(
      params.rawBlocks,
      params.jobDescription,
      params.jobTitle,
      params.compatibilityInsights
    ),
    0.1,
    true
  )

  // 🔍 DETAILED VALIDATION: Verify structure preservation
  console.log('🔍 [DEBUG] TAILORED BLOCKS ANALYSIS:')
  console.log(`  - Total blocks after tailoring: ${result.blocks?.length || 0}`)
  console.log(`  - Input blocks: ${params.rawBlocks.blocks?.length || 0}`)

  const inputBlockCount = params.rawBlocks.blocks?.length || 0
  const outputBlockCount = result.blocks?.length || 0

  if (inputBlockCount !== outputBlockCount) {
    console.error(`❌ [CRITICAL] Block count mismatch! Input: ${inputBlockCount}, Output: ${outputBlockCount}`)
    console.error('  - Some blocks were dropped during tailoring!')
  }

  // Verify each block has a priority
  const blocksWithoutPriority = result.blocks?.filter(b => !b.priority) || []
  if (blocksWithoutPriority.length > 0) {
    console.error(`❌ [CRITICAL] ${blocksWithoutPriority.length} blocks missing priority scores!`)
  }

  const experienceBlocks = result.blocks?.filter(b => b.category === 'experience') || []
  const totalBullets = experienceBlocks.reduce((sum, exp) => {
    return sum + (exp.content.bullets?.length || 0)
  }, 0)

  const projectBlocks = result.blocks?.filter(b => b.category === 'projects') || []
  const skillBlocks = result.blocks?.filter(b => b.category === 'skills') || []
  const educationBlocks = result.blocks?.filter(b => b.category === 'education') || []

  console.log(`  - Experience blocks: ${experienceBlocks.length}, Total bullets: ${totalBullets}`)
  console.log(`  - Project blocks: ${projectBlocks.length}`)
  console.log(`  - Skill blocks: ${skillBlocks.length}`)
  console.log(`  - Education blocks: ${educationBlocks.length}`)

  console.log('[AI] Step 2B complete:', {
    blockCount: result.blocks?.length || 0,
    categories: result.detectedCategories || [],
    structurePreserved: inputBlockCount === outputBlockCount,
    allHavePriorities: blocksWithoutPriority.length === 0
  })

  return result
}

/**
 * STEP 2 (LEGACY): Extract and tailor content blocks
 * ⚠️ DEPRECATED: This function is being replaced by Step 2A + 2B
 */
export async function extractAndTailorBlocks(params: {
  resumeText: string
  jobDescription: string
  jobTitle: string
  compatibilityInsights: CompatibilityAnalysis
}): Promise<ExtractedBlocks> {
  console.log('[AI] Step 2: Extracting and tailoring content blocks...')

  // 🔍 CRITICAL LOGGING: Log resume text statistics
  console.log('🔍 [DEBUG] RESUME TEXT ANALYSIS:')
  console.log(`  - Resume text length: ${params.resumeText.length} chars`)
  console.log(`  - Resume text first 300 chars: ${params.resumeText.substring(0, 300)}`)
  console.log(`  - Resume text last 300 chars: ...${params.resumeText.substring(params.resumeText.length - 300)}`)

  // Check for key sections in original resume
  const hasSkillsSection = params.resumeText.toLowerCase().includes('skill')
  const hasProjectsSection = params.resumeText.toLowerCase().includes('project')
  const hasEducationSection = params.resumeText.toLowerCase().includes('education')
  console.log(`  - Contains "skill" keyword: ${hasSkillsSection}`)
  console.log(`  - Contains "project" keyword: ${hasProjectsSection}`)
  console.log(`  - Contains "education" keyword: ${hasEducationSection}`)

  const result = await callOpenAI(
    PROMPTS.extractAndTailorBlocks.system,
    PROMPTS.extractAndTailorBlocks.user(
      params.resumeText,
      params.jobDescription,
      params.jobTitle,
      params.compatibilityInsights
    ),
    0.1,
    true
  )

  // 🔍 DETAILED VALIDATION: Check content preservation
  console.log('🔍 [DEBUG] EXTRACTED BLOCKS ANALYSIS:')
  console.log(`  - Total blocks extracted: ${result.blocks?.length || 0}`)
  console.log(`  - Detected categories: ${JSON.stringify(result.detectedCategories || [])}`)

  const experienceBlocks = result.blocks?.filter(b => b.category === 'experience') || []
  const totalBullets = experienceBlocks.reduce((sum, exp) => {
    return sum + (exp.content.bullets?.length || 0)
  }, 0)

  const projectBlocks = result.blocks?.filter(b => b.category === 'projects') || []
  const skillBlocks = result.blocks?.filter(b => b.category === 'skills') || []
  const educationBlocks = result.blocks?.filter(b => b.category === 'education') || []

  console.log(`  - Experience blocks: ${experienceBlocks.length}, Total bullets: ${totalBullets}`)
  console.log(`  - Project blocks: ${projectBlocks.length}`)
  console.log(`  - Skill blocks: ${skillBlocks.length}`)
  console.log(`  - Education blocks: ${educationBlocks.length}`)

  // Log details of each block type
  if (skillBlocks.length > 0) {
    console.log('🔍 [DEBUG] SKILLS BLOCKS DETAILED:')
    skillBlocks.forEach((block, idx) => {
      console.log(`  - Skills block ${idx + 1}:`, JSON.stringify(block, null, 2))
    })
  } else {
    console.warn('⚠️ [WARNING] NO SKILLS BLOCKS EXTRACTED!')
  }

  if (projectBlocks.length > 0) {
    console.log('🔍 [DEBUG] PROJECT BLOCKS DETAILED:')
    projectBlocks.forEach((block, idx) => {
      console.log(`  - Project block ${idx + 1}:`, JSON.stringify(block, null, 2))
    })
  } else {
    console.warn('⚠️ [WARNING] NO PROJECT BLOCKS EXTRACTED!')
  }

  if (educationBlocks.length > 0) {
    console.log('🔍 [DEBUG] EDUCATION BLOCKS DETAILED:')
    educationBlocks.forEach((block, idx) => {
      console.log(`  - Education block ${idx + 1}:`, JSON.stringify(block, null, 2))
    })
  }

  // Validation warnings
  if (totalBullets < 5) {
    console.warn(`⚠️ [AI] Low bullet count detected: ${totalBullets}. Original resume may have been over-filtered.`)
  }

  if (hasSkillsSection && skillBlocks.length === 0) {
    console.error('❌ [CRITICAL] Resume contains SKILLS section but NONE were extracted by AI!')
  }

  if (hasProjectsSection && projectBlocks.length === 0) {
    console.error('❌ [CRITICAL] Resume contains PROJECTS section but NONE were extracted by AI!')
  }

  console.log('[AI] Step 2 complete:', {
    blockCount: result.blocks?.length || 0,
    categories: result.detectedCategories || [],
    experienceBullets: totalBullets,
    projects: projectBlocks.length,
    skillCategories: skillBlocks.length,
    education: educationBlocks.length
  })

  return result
}

/**
 * STEP 3: Calculate fit score (0-100%)
 */
export async function calculateFitScore(params: {
  originalResume: string
  tailoredBlocks: any
  jobDescription: string
}): Promise<FitScore> {
  console.log('[AI] Step 3: Calculating fit score...')

  const result = await callOpenAI(
    PROMPTS.calculateFitScore.system,
    PROMPTS.calculateFitScore.user(
      params.originalResume,
      params.tailoredBlocks,
      params.jobDescription
    ),
    0.1,
    true
  )

  console.log('[AI] Step 3 complete:', {
    score: result.score,
    breakdown: result.breakdown,
  })

  return result
}

/**
 * STEP 4: Detect missing skills with certification suggestions
 */
export async function detectMissingSkills(params: {
  resumeSkills: any
  jdRequirements: string
  jobTitle: string
}): Promise<MissingSkillsAnalysis> {
  console.log('[AI] Step 4: Detecting missing skills...')

  const result = await callOpenAI(
    PROMPTS.detectMissingSkills.system,
    PROMPTS.detectMissingSkills.user(
      params.resumeSkills,
      params.jdRequirements,
      params.jobTitle
    ),
    0.2, // Slightly higher temperature for more creative suggestions
    true
  )

  console.log('[AI] Step 4 complete:', {
    missingSkillsCount: result.missingSkills?.length || 0,
  })

  return result
}

/**
 * STEP 5: Generate recommendations for improvement
 */
export async function generateRecommendations(params: {
  fitScore: number
  missingSkills: any
  tailoredContent: any
}): Promise<RecommendationsAnalysis> {
  console.log('[AI] Step 5: Generating recommendations...')

  const result = await callOpenAI(
    PROMPTS.generateRecommendations.system,
    PROMPTS.generateRecommendations.user(
      params.fitScore,
      params.missingSkills,
      params.tailoredContent
    ),
    0.2, // Slightly higher temperature for more creative advice
    true
  )

  console.log('[AI] Step 5 complete:', {
    recommendationCount: result.recommendations?.length || 0,
  })

  return result
}

/**
 * STEP 6: Decide layout for template
 */
export async function decideLayout(params: {
  blocks: any
  templateName: string
  templateConstraints: any
}): Promise<LayoutDecision> {
  console.log('[AI] Step 6: Deciding layout...')

  const result = await callOpenAI(
    PROMPTS.decideLayout.system,
    PROMPTS.decideLayout.user(
      params.blocks,
      params.templateName,
      params.templateConstraints
    ),
    0.1,
    true
  )

  console.log('[AI] Step 6 complete:', {
    sections: Object.keys(result.layout || {}),
  })

  return result
}

/**
 * NEW CONVERSATIONAL FLOW: Single conversation with 7 steps maintaining full context
 * This replaces the old 6-step flow with a split extraction + tailoring approach
 *
 * STEP 1: Analyze compatibility
 * STEP 2A: Extract raw blocks (no JD, no rewriting)
 * STEP 2B: Tailor blocks (rewrite with JD keywords, assign priorities)
 * STEP 3: Calculate fit score
 * STEP 4: Detect missing skills
 * STEP 5: Generate recommendations
 * STEP 6: Decide layout
 */
export async function conversationalTailoring(params: {
  resumeText: string
  jobDescription: string
  jobTitle: string
  templateName: string
  templateConstraints: any
}): Promise<{
  compatibility: CompatibilityAnalysis
  rawBlocks: RawExtractedBlocks
  blocks: ExtractedBlocks
  fitScore: FitScore
  missingSkills: MissingSkillsAnalysis
  recommendations: RecommendationsAnalysis
  layout: LayoutDecision
}> {
  console.log('🚀 [CONVERSATIONAL TAILORING] Starting with OpenAI Responses API (7 steps)...')

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  // Create conversation object on OpenAI (persists in Dashboard)
  const conversationId = await createConversation()

  // Master system prompt that stays consistent throughout conversation
  const masterSystemPrompt = `You are an expert resume tailoring AI assistant. You will help analyze a resume against a job description and tailor it through 7 sequential steps.

CRITICAL RULES THROUGHOUT ALL STEPS:
1. PRESERVE 100% OF CONTENT - Do not remove sections, skills, projects, or education
2. MAINTAIN CONTEXT - Remember what you extracted in previous steps
3. BE CONSISTENT - If you extract a block in Step 2A, it must appear in Step 2B and Step 6 layout
4. SEPARATION OF CONCERNS - Step 2A extracts verbatim, Step 2B rewrites

You will be asked to complete these steps in order:
- Step 1: Analyze compatibility between resume and job
- Step 2A: Extract ALL sections from resume VERBATIM (no rewriting, no JD analysis)
- Step 2B: Tailor the extracted blocks using job description keywords (preserve all blocks)
- Step 3: Calculate fit score based on tailored blocks
- Step 4: Identify missing skills with learning suggestions
- Step 5: Generate recommendations for improvement
- Step 6: Create layout including ALL blocks from Step 2B

Each step builds on the previous ones. Maintain consistency across all steps.`

  // ============================================================================
  // STEP 1: Analyze Compatibility
  // ============================================================================
  console.log('🧠 [STEP 1/7] Analyzing compatibility...')

  const step1Input = [
    { role: 'system', content: masterSystemPrompt },
    { role: 'user', content: PROMPTS.analyzeCompatibility.user(
      params.resumeText,
      params.jobDescription,
      params.jobTitle
    )}
  ]

  const step1 = await sendTurn(conversationId, step1Input, 1, 0.1)

  let compatibility: CompatibilityAnalysis
  try {
    compatibility = JSON.parse(step1.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 1] JSON Parse Error:', parseError.message)
    console.error('Response preview:', step1.outputText.substring(0, 500))
    throw new Error(`Failed to parse Step 1 compatibility analysis: ${parseError.message}`)
  }

  console.log('✅ [STEP 1/7] Complete:', {
    overlaps: compatibility.overlapAreas?.length || 0,
    gaps: compatibility.gapAreas?.length || 0,
    focus: compatibility.strategicFocus?.length || 0
  })

  // ============================================================================
  // STEP 2A: Extract Raw Blocks (NO TAILORING - PURE EXTRACTION)
  // ============================================================================
  console.log('🧠 [STEP 2A/7] Extracting raw content blocks (no tailoring)...')

  // Log resume analysis
  console.log('🔍 [DEBUG] RESUME TEXT ANALYSIS:')
  console.log(`  - Resume length: ${params.resumeText.length} chars`)
  console.log(`  - Has skills: ${params.resumeText.toLowerCase().includes('skill')}`)
  console.log(`  - Has projects: ${params.resumeText.toLowerCase().includes('project')}`)
  console.log(`  - Has education: ${params.resumeText.toLowerCase().includes('education')}`)

  const step2AInput = [{
    role: 'user',
    content: `${PROMPTS.extractBlocksRaw.system}

Now, complete Step 2A:

${PROMPTS.extractBlocksRaw.user(params.resumeText)}`
  }]

  const step2A = await sendTurn(conversationId, step2AInput, 2, 0.1)

  let rawBlocks: RawExtractedBlocks
  try {
    rawBlocks = JSON.parse(step2A.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 2A] JSON Parse Error:', parseError.message)
    console.error('Response preview (first 500 chars):', step2A.outputText.substring(0, 500))
    console.error('Response preview (last 500 chars):', step2A.outputText.substring(step2A.outputText.length - 500))
    throw new Error(`Failed to parse Step 2A raw extracted blocks: ${parseError.message}`)
  }

  // Validation logging
  const rawExperienceBlocks = rawBlocks.blocks?.filter(b => b.category === 'experience') || []
  const rawTotalBullets = rawExperienceBlocks.reduce((sum, exp) => sum + (exp.content.bullets?.length || 0), 0)
  const rawProjectBlocks = rawBlocks.blocks?.filter(b => b.category === 'projects') || []
  const rawSkillBlocks = rawBlocks.blocks?.filter(b => b.category === 'skills') || []
  const rawEducationBlocks = rawBlocks.blocks?.filter(b => b.category === 'education') || []

  console.log('✅ [STEP 2A/7] Complete:', {
    totalBlocks: rawBlocks.blocks?.length || 0,
    categories: rawBlocks.detectedCategories,
    experienceBlocks: rawExperienceBlocks.length,
    experienceBullets: rawTotalBullets,
    projectBlocks: rawProjectBlocks.length,
    skillBlocks: rawSkillBlocks.length,
    educationBlocks: rawEducationBlocks.length
  })

  if (rawTotalBullets < 5) {
    console.warn(`⚠️ Low bullet count in raw extraction: ${rawTotalBullets}`)
  }
  if (params.resumeText.toLowerCase().includes('skill') && rawSkillBlocks.length === 0) {
    console.error('❌ CRITICAL: Resume has SKILLS but none extracted in Step 2A!')
  }
  if (params.resumeText.toLowerCase().includes('project') && rawProjectBlocks.length === 0) {
    console.error('❌ CRITICAL: Resume has PROJECTS but none extracted in Step 2A!')
  }

  // ============================================================================
  // STEP 2B: Tailor Extracted Blocks (REWRITING ONLY)
  // ============================================================================
  console.log('🧠 [STEP 2B/7] Tailoring extracted blocks...')

  const step2BInput = [{
    role: 'user',
    content: `${PROMPTS.tailorExtractedBlocks.system}

Now, complete Step 2B using the blocks you extracted in Step 2A:

${PROMPTS.tailorExtractedBlocks.user(
      rawBlocks,
      params.jobDescription,
      params.jobTitle,
      compatibility
    )}`
  }]

  const step2B = await sendTurn(conversationId, step2BInput, 3, 0.1)

  let blocks: ExtractedBlocks
  try {
    blocks = JSON.parse(step2B.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 2B] JSON Parse Error:', parseError.message)
    console.error('Response preview (first 500 chars):', step2B.outputText.substring(0, 500))
    console.error('Response preview (last 500 chars):', step2B.outputText.substring(step2B.outputText.length - 500))
    throw new Error(`Failed to parse Step 2B tailored blocks: ${parseError.message}`)
  }

  // Validation logging
  const experienceBlocks = blocks.blocks?.filter(b => b.category === 'experience') || []
  const totalBullets = experienceBlocks.reduce((sum, exp) => sum + (exp.content.bullets?.length || 0), 0)
  const projectBlocks = blocks.blocks?.filter(b => b.category === 'projects') || []
  const skillBlocks = blocks.blocks?.filter(b => b.category === 'skills') || []
  const educationBlocks = blocks.blocks?.filter(b => b.category === 'education') || []

  console.log('✅ [STEP 2B/7] Complete:', {
    totalBlocks: blocks.blocks?.length || 0,
    categories: blocks.detectedCategories,
    experienceBlocks: experienceBlocks.length,
    experienceBullets: totalBullets,
    projectBlocks: projectBlocks.length,
    skillBlocks: skillBlocks.length,
    educationBlocks: educationBlocks.length,
    structurePreserved: rawBlocks.blocks?.length === blocks.blocks?.length
  })

  if (totalBullets < 5) {
    console.warn(`⚠️ Low bullet count after tailoring: ${totalBullets}`)
  }
  if (rawBlocks.blocks?.length !== blocks.blocks?.length) {
    console.error(`❌ CRITICAL: Block count mismatch! Raw: ${rawBlocks.blocks?.length}, Tailored: ${blocks.blocks?.length}`)
  }

  // ============================================================================
  // STEP 3: Calculate Fit Score
  // ============================================================================
  console.log('🧠 [STEP 3/7] Calculating fit score...')

  const step3Input = [{
    role: 'user',
    content: `${PROMPTS.calculateFitScore.system}

Now, complete Step 3 using the tailored blocks from Step 2B:

${PROMPTS.calculateFitScore.user(params.resumeText, blocks.blocks, params.jobDescription)}`
  }]

  const step3 = await sendTurn(conversationId, step3Input, 4, 0.1)

  let fitScore: FitScore
  try {
    fitScore = JSON.parse(step3.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 3] JSON Parse Error:', parseError.message)
    throw new Error(`Failed to parse Step 3 fit score: ${parseError.message}`)
  }

  console.log('✅ [STEP 3/7] Complete:', {
    score: fitScore.score,
    breakdown: fitScore.breakdown
  })

  // ============================================================================
  // STEP 4: Detect Missing Skills
  // ============================================================================
  console.log('🧠 [STEP 4/7] Detecting missing skills...')

  const step4Input = [{
    role: 'user',
    content: `${PROMPTS.detectMissingSkills.system}

Now, complete Step 4:

${PROMPTS.detectMissingSkills.user(skillBlocks, params.jobDescription, params.jobTitle)}`
  }]

  const step4 = await sendTurn(conversationId, step4Input, 5, 0.2)

  let missingSkills: MissingSkillsAnalysis
  try {
    missingSkills = JSON.parse(step4.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 4] JSON Parse Error:', parseError.message)
    throw new Error(`Failed to parse Step 4 missing skills: ${parseError.message}`)
  }

  console.log('✅ [STEP 4/7] Complete:', {
    missingSkillsCount: missingSkills.missingSkills?.length || 0
  })

  // ============================================================================
  // STEP 5: Generate Recommendations
  // ============================================================================
  console.log('🧠 [STEP 5/7] Generating recommendations...')

  const step5Input = [{
    role: 'user',
    content: `${PROMPTS.generateRecommendations.system}

Now, complete Step 5:

${PROMPTS.generateRecommendations.user(fitScore.score, missingSkills, blocks.blocks)}`
  }]

  const step5 = await sendTurn(conversationId, step5Input, 6, 0.2)

  let recommendations: RecommendationsAnalysis
  try {
    recommendations = JSON.parse(step5.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 5] JSON Parse Error:', parseError.message)
    throw new Error(`Failed to parse Step 5 recommendations: ${parseError.message}`)
  }

  console.log('✅ [STEP 5/7] Complete:', {
    recommendationCount: recommendations.recommendations?.length || 0
  })

  // ============================================================================
  // STEP 6: Decide Layout (CRITICAL - MUST INCLUDE ALL BLOCKS FROM STEP 2B)
  // ============================================================================
  console.log('🧠 [STEP 6/7] Deciding layout for all tailored blocks...')

  const step6Input = [{
    role: 'user',
    content: `${PROMPTS.decideLayout.system}

Now, complete Step 6 - CRITICAL: You MUST include ALL ${blocks.blocks?.length || 0} blocks you tailored in Step 2B.

🚨 REMINDER: In Step 2B, you tailored these block IDs:
${blocks.blocks?.map(b => `- ${b.id} (${b.category})`).join('\n')}

Your layout output MUST reference ALL of these block IDs.

${PROMPTS.decideLayout.user(blocks.blocks, params.templateName, params.templateConstraints)}`
  }]

  const step6 = await sendTurn(conversationId, step6Input, 7, 0.1)

  let layout: LayoutDecision
  try {
    layout = JSON.parse(step6.outputText)
  } catch (parseError: any) {
    console.error('❌ [STEP 6] JSON Parse Error:', parseError.message)
    console.error('Response preview (first 500 chars):', step6.outputText.substring(0, 500))
    console.error('Response preview (last 500 chars):', step6.outputText.substring(step6.outputText.length - 500))
    throw new Error(`Failed to parse Step 6 layout: ${parseError.message}`)
  }

  // Validate layout includes all blocks
  const layoutBlockIds = [
    ...(layout.layout.header || []),
    ...(layout.layout.main || []),
    ...(layout.layout.sidebar || []),
    ...(layout.layout.footer || [])
  ]

  const extractedBlockIds = blocks.blocks?.map(b => b.id) || []
  const missingInLayout = extractedBlockIds.filter(id => !layoutBlockIds.includes(id))

  if (missingInLayout.length > 0) {
    console.error(`❌ CRITICAL: Layout missing ${missingInLayout.length} blocks:`, missingInLayout)
  }

  console.log('✅ [STEP 6/7] Complete:', {
    sections: Object.keys(layout.layout),
    totalBlocksInLayout: layoutBlockIds.length,
    expectedBlocks: extractedBlockIds.length,
    allBlocksIncluded: missingInLayout.length === 0
  })

  console.log('🎉 [CONVERSATIONAL TAILORING] All 7 steps complete!')
  console.log(`📊 [OpenAI Dashboard] View conversation: https://platform.openai.com/logs?api=responses&conversation=${conversationId}`)
  console.log('📝 [ARCHITECTURE] New 2-step extraction flow: Step 2A (extract) → Step 2B (tailor)')

  return {
    compatibility,
    rawBlocks,
    blocks,
    fitScore,
    missingSkills,
    recommendations,
    layout
  }
}

/**
 * Create a new conversation object on OpenAI (persists beyond 30 days)
 * https://platform.openai.com/docs/api-reference/conversations/create
 */
async function createConversation(): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const response = await fetch('https://api.openai.com/v1/conversations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[OpenAI] ❌ Failed to create conversation:', response.status, errorText)
    throw new Error(`Failed to create OpenAI conversation: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[Conversation] ✅ Created: ${data.id}`)
  console.log(`[Conversation] 📊 Dashboard: https://platform.openai.com/logs?api=responses&conversation=${data.id}`)

  return data.id
}

/**
 * Send a single turn in a conversation using the Responses API
 * https://platform.openai.com/docs/api-reference/responses/create
 */
async function sendTurn(
  conversationId: string,
  input: Array<{role: string, content: string}>,
  turnNumber: number,
  temperature = 0.1
): Promise<{ id: string, outputText: string, tokens: number }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  // Add 90-second timeout to prevent infinite hangs
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 90000)

  try {
    console.log(`[OpenAI] 📤 Turn ${turnNumber} - Sending to Responses API`)
    console.log(`  - Conversation ID: ${conversationId}`)
    console.log(`  - Input messages: ${input.length}`)
    console.log(`  - Input length: ${JSON.stringify(input).length} chars`)

    const requestBody: any = {
      model: MODEL,
      conversation: conversationId,
      input: input,
      store: true,  // Save to OpenAI Dashboard for 30 days
      temperature: temperature,
      text: {
        format: {
          type: 'json_object'  // Responses API requires text.format to be an object with type property
        }
      }
    }

    const requestBodySize = JSON.stringify(requestBody).length
    console.log(`  - Request payload size: ${requestBodySize} bytes`)

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log(`[OpenAI] ✅ Turn ${turnNumber} - Fetch completed, status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[OpenAI] ❌ API ERROR (Turn ${turnNumber}):`, response.status, errorText)
      throw new Error(`OpenAI Responses API error (Turn ${turnNumber}): ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (!data.id) {
      console.error(`[OpenAI] ❌ No response ID returned (Turn ${turnNumber})`)
      throw new Error(`No response ID from OpenAI (Turn ${turnNumber})`)
    }

    // Extract output text (Responses API format)
    let outputText = ''

    // Debug: log the full response structure
    console.log(`[OpenAI] 🔍 Turn ${turnNumber} - Response structure:`, JSON.stringify(data, null, 2))

    if (data.output_text) {
      // Direct output_text property
      outputText = data.output_text
    } else if (data.output && Array.isArray(data.output) && data.output.length > 0) {
      // Output array format
      const firstOutput = data.output[0]

      if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
        // Content is an array of content parts
        const textContent = firstOutput.content.find((c: any) => c.type === 'output_text')
        if (textContent && textContent.text) {
          outputText = textContent.text
        } else {
          console.error(`[OpenAI] ❌ No text in content array (Turn ${turnNumber})`, firstOutput.content)
          throw new Error(`No text content in output array (Turn ${turnNumber})`)
        }
      } else if (typeof firstOutput.content === 'string') {
        // Content is a string
        outputText = firstOutput.content
      } else {
        console.error(`[OpenAI] ❌ Unexpected content structure (Turn ${turnNumber})`, firstOutput)
        throw new Error(`Unexpected content structure (Turn ${turnNumber})`)
      }
    } else {
      console.error(`[OpenAI] ❌ No output content in response (Turn ${turnNumber})`, data)
      throw new Error(`No output content from OpenAI (Turn ${turnNumber})`)
    }

    const tokens = data.usage?.total_tokens || 0

    console.log(`[OpenAI] 📥 Turn ${turnNumber} - Received response`)
    console.log(`  - Response ID: ${data.id}`)
    console.log(`  - Output length: ${outputText.length} chars`)
    console.log(`  - Tokens: ${tokens} (prompt: ${data.usage?.prompt_tokens || 0}, completion: ${data.usage?.completion_tokens || 0})`)

    return {
      id: data.id,
      outputText: outputText,
      tokens: tokens
    }

  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      console.error(`[OpenAI] ⏱️ TIMEOUT: Turn ${turnNumber} took >90 seconds`)
      throw new Error(`OpenAI API timeout on Turn ${turnNumber} after 90 seconds`)
    }

    // Re-throw with context
    throw new Error(`Turn ${turnNumber} failed: ${error.message}`)
  }
}

/**
 * Utility function to validate AI response structure
 */
export function validateResponse<T>(response: any, requiredFields: string[]): T {
  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new Error(`Missing required field in AI response: ${field}`)
    }
  }
  return response as T
}
