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
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data: OpenAIResponse = await response.json()

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenAI API')
  }

  const content = data.choices[0].message.content

  // Log token usage for cost tracking
  if (data.usage) {
    console.log(`[OpenAI] Tokens used: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`)
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

  console.log('[AI] Step 2 complete:', {
    blockCount: result.blocks?.length || 0,
    categories: result.detectedCategories || [],
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
