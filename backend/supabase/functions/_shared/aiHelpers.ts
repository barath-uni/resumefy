/**
 * AI Helper Functions for Resume Tailoring
 * Reusable functions for making OpenAI API calls with proper error handling
 */

import {
  PROMPTS,
  type CompatibilityAnalysis,
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
 * STEP 2: Extract and tailor content blocks
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
 * NEW CONVERSATIONAL FLOW: Single conversation with 6 steps maintaining full context
 * This replaces the 6 separate API calls to prevent information loss between steps
 */
export async function conversationalTailoring(params: {
  resumeText: string
  jobDescription: string
  jobTitle: string
  templateName: string
  templateConstraints: any
}): Promise<{
  compatibility: CompatibilityAnalysis
  blocks: ExtractedBlocks
  fitScore: FitScore
  missingSkills: MissingSkillsAnalysis
  recommendations: RecommendationsAnalysis
  layout: LayoutDecision
}> {
  console.log('🚀 [CONVERSATIONAL TAILORING] Starting single conversation with 6 steps...')

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const messages: OpenAIMessage[] = []

  // Master system prompt that stays consistent throughout conversation
  const masterSystemPrompt = `You are an expert resume tailoring AI assistant. You will help analyze a resume against a job description and tailor it through 6 sequential steps.

CRITICAL RULES THROUGHOUT ALL STEPS:
1. PRESERVE ALL CONTENT - Do not remove sections, skills, projects, or education
2. MAINTAIN CONTEXT - Remember what you extracted in previous steps
3. BE CONSISTENT - If you extract a block in Step 2, include it in Step 6 layout
4. PRESERVE 85%+ of original content - Reorder and rewrite, don't delete

You will be asked to complete these steps in order:
- Step 1: Analyze compatibility between resume and job
- Step 2: Extract ALL sections from resume (contact, experience, education, skills, projects, etc.)
- Step 3: Calculate fit score based on tailored blocks
- Step 4: Identify missing skills with learning suggestions
- Step 5: Generate recommendations for improvement
- Step 6: Create layout including ALL blocks from Step 2

Each step builds on the previous ones. Maintain consistency across all steps.`

  messages.push({ role: 'system', content: masterSystemPrompt })

  // ============================================================================
  // STEP 1: Analyze Compatibility
  // ============================================================================
  console.log('🧠 [STEP 1/6] Analyzing compatibility...')

  const step1Prompt = PROMPTS.analyzeCompatibility.user(
    params.resumeText,
    params.jobDescription,
    params.jobTitle
  )

  messages.push({ role: 'user', content: step1Prompt })

  const step1Response = await callOpenAIWithMessages(messages, 0.1, true)
  const compatibility: CompatibilityAnalysis = JSON.parse(step1Response)

  messages.push({ role: 'assistant', content: step1Response })

  console.log('✅ [STEP 1/6] Complete:', {
    overlaps: compatibility.overlapAreas?.length || 0,
    gaps: compatibility.gapAreas?.length || 0,
    focus: compatibility.strategicFocus?.length || 0
  })

  // ============================================================================
  // STEP 2: Extract and Tailor Blocks (MOST CRITICAL - PRESERVES CONTENT)
  // ============================================================================
  console.log('🧠 [STEP 2/6] Extracting and tailoring content blocks...')

  // Log resume analysis
  console.log('🔍 [DEBUG] RESUME TEXT ANALYSIS:')
  console.log(`  - Resume length: ${params.resumeText.length} chars`)
  console.log(`  - Has skills: ${params.resumeText.toLowerCase().includes('skill')}`)
  console.log(`  - Has projects: ${params.resumeText.toLowerCase().includes('project')}`)
  console.log(`  - Has education: ${params.resumeText.toLowerCase().includes('education')}`)

  const step2Prompt = `${PROMPTS.extractAndTailorBlocks.system}

Now, complete Step 2:

${PROMPTS.extractAndTailorBlocks.user(
    params.resumeText,
    params.jobDescription,
    params.jobTitle,
    compatibility
  )}`

  messages.push({ role: 'user', content: step2Prompt })

  const step2Response = await callOpenAIWithMessages(messages, 0.1, true)
  const blocks: ExtractedBlocks = JSON.parse(step2Response)

  messages.push({ role: 'assistant', content: step2Response })

  // Validation logging
  const experienceBlocks = blocks.blocks?.filter(b => b.category === 'experience') || []
  const totalBullets = experienceBlocks.reduce((sum, exp) => sum + (exp.content.bullets?.length || 0), 0)
  const projectBlocks = blocks.blocks?.filter(b => b.category === 'projects') || []
  const skillBlocks = blocks.blocks?.filter(b => b.category === 'skills') || []
  const educationBlocks = blocks.blocks?.filter(b => b.category === 'education') || []

  console.log('✅ [STEP 2/6] Complete:', {
    totalBlocks: blocks.blocks?.length || 0,
    categories: blocks.detectedCategories,
    experienceBlocks: experienceBlocks.length,
    experienceBullets: totalBullets,
    projectBlocks: projectBlocks.length,
    skillBlocks: skillBlocks.length,
    educationBlocks: educationBlocks.length
  })

  if (totalBullets < 5) {
    console.warn(`⚠️ Low bullet count: ${totalBullets}`)
  }
  if (params.resumeText.toLowerCase().includes('skill') && skillBlocks.length === 0) {
    console.error('❌ CRITICAL: Resume has SKILLS but none extracted!')
  }
  if (params.resumeText.toLowerCase().includes('project') && projectBlocks.length === 0) {
    console.error('❌ CRITICAL: Resume has PROJECTS but none extracted!')
  }

  // ============================================================================
  // STEP 3: Calculate Fit Score
  // ============================================================================
  console.log('🧠 [STEP 3/6] Calculating fit score...')

  const step3Prompt = `${PROMPTS.calculateFitScore.system}

Now, complete Step 3 using the blocks you just extracted:

${PROMPTS.calculateFitScore.user(
    params.resumeText,
    blocks.blocks,
    params.jobDescription
  )}`

  messages.push({ role: 'user', content: step3Prompt })

  const step3Response = await callOpenAIWithMessages(messages, 0.1, true)
  const fitScore: FitScore = JSON.parse(step3Response)

  messages.push({ role: 'assistant', content: step3Response })

  console.log('✅ [STEP 3/6] Complete:', {
    score: fitScore.score,
    breakdown: fitScore.breakdown
  })

  // ============================================================================
  // STEP 4: Detect Missing Skills
  // ============================================================================
  console.log('🧠 [STEP 4/6] Detecting missing skills...')

  const step4Prompt = `${PROMPTS.detectMissingSkills.system}

Now, complete Step 4:

${PROMPTS.detectMissingSkills.user(
    skillBlocks,
    params.jobDescription,
    params.jobTitle
  )}`

  messages.push({ role: 'user', content: step4Prompt })

  const step4Response = await callOpenAIWithMessages(messages, 0.2, true)
  const missingSkills: MissingSkillsAnalysis = JSON.parse(step4Response)

  messages.push({ role: 'assistant', content: step4Response })

  console.log('✅ [STEP 4/6] Complete:', {
    missingSkillsCount: missingSkills.missingSkills?.length || 0
  })

  // ============================================================================
  // STEP 5: Generate Recommendations
  // ============================================================================
  console.log('🧠 [STEP 5/6] Generating recommendations...')

  const step5Prompt = `${PROMPTS.generateRecommendations.system}

Now, complete Step 5:

${PROMPTS.generateRecommendations.user(
    fitScore.score,
    missingSkills,
    blocks.blocks
  )}`

  messages.push({ role: 'user', content: step5Prompt })

  const step5Response = await callOpenAIWithMessages(messages, 0.2, true)
  const recommendations: RecommendationsAnalysis = JSON.parse(step5Response)

  messages.push({ role: 'assistant', content: step5Response })

  console.log('✅ [STEP 5/6] Complete:', {
    recommendationCount: recommendations.recommendations?.length || 0
  })

  // ============================================================================
  // STEP 6: Decide Layout (CRITICAL - MUST INCLUDE ALL BLOCKS FROM STEP 2)
  // ============================================================================
  console.log('🧠 [STEP 6/6] Deciding layout for all extracted blocks...')

  const step6Prompt = `${PROMPTS.decideLayout.system}

Now, complete Step 6 - CRITICAL: You MUST include ALL ${blocks.blocks?.length || 0} blocks you extracted in Step 2.

🚨 REMINDER: In Step 2, you extracted these block IDs:
${blocks.blocks?.map(b => `- ${b.id} (${b.category})`).join('\n')}

Your layout output MUST reference ALL of these block IDs.

${PROMPTS.decideLayout.user(
    blocks.blocks,
    params.templateName,
    params.templateConstraints
  )}`

  messages.push({ role: 'user', content: step6Prompt })

  const step6Response = await callOpenAIWithMessages(messages, 0.1, true)
  const layout: LayoutDecision = JSON.parse(step6Response)

  messages.push({ role: 'assistant', content: step6Response })

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

  console.log('✅ [STEP 6/6] Complete:', {
    sections: Object.keys(layout.layout),
    totalBlocksInLayout: layoutBlockIds.length,
    expectedBlocks: extractedBlockIds.length,
    allBlocksIncluded: missingInLayout.length === 0
  })

  console.log('🎉 [CONVERSATIONAL TAILORING] All 6 steps complete!')

  return {
    compatibility,
    blocks,
    fitScore,
    missingSkills,
    recommendations,
    layout
  }
}

/**
 * Helper function to call OpenAI with message history
 */
async function callOpenAIWithMessages(
  messages: OpenAIMessage[],
  temperature = 0.1,
  requireJSON = true
): Promise<string> {
  const requestBody: OpenAIRequest = {
    model: MODEL,
    messages: messages,
    temperature,
  }

  if (requireJSON) {
    requestBody.response_format = { type: 'json_object' }
  }

  // Log conversation turn
  const turnNumber = Math.floor((messages.length - 1) / 2) + 1
  console.log(`[OpenAI] 📤 Turn ${turnNumber} - Sending message to API`)
  console.log(`  - Total messages in conversation: ${messages.length}`)
  console.log(`  - Latest user message length: ${messages[messages.length - 1].content.length} chars`)

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

  console.log(`[OpenAI] 📥 Turn ${turnNumber} - Received response`)
  console.log(`  - Response length: ${content.length} chars`)

  // Log token usage
  if (data.usage) {
    console.log(`[OpenAI] 💰 Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`)
  }

  return content
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
