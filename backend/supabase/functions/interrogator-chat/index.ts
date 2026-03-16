import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { INTERROGATOR_PROMPTS } from '../_shared/prompts.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * INTERROGATOR CHAT - Chat-based resume tailoring
 *
 * Actions:
 * 1. POST /start - Analyze gaps and generate first question
 * 2. POST /answer - Process user answer and generate next question
 * 3. POST /generate - Build final resume with conversation data
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, jobId, userAnswer } = await req.json()

    console.log(`[interrogator-chat] Action: ${action}, Job ID: ${jobId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    switch (action) {
      case 'start':
        return await startInterrogation(supabase, jobId)
      case 'answer':
        return await processAnswer(supabase, jobId, userAnswer)
      case 'generate':
        return await generateFinalResume(supabase, jobId)
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error: any) {
    console.error('[interrogator-chat] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * START INTERROGATION
 * 1. Fetch job + resume data
 * 2. Run gap analysis (5 gaps)
 * 3. Calculate initial match score
 * 4. Generate first question
 * 5. Update job status to 'questioning'
 */
async function startInterrogation(supabase: any, jobId: string) {
  console.log('[start] Starting interrogation for job:', jobId)

  // Update status to analyzing
  await supabase
    .from('jobs')
    .update({ conversation_status: 'analyzing' })
    .eq('id', jobId)

  // Fetch job + resume
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, resumes(*)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    console.error('[start] Job not found:', jobError)
    await supabase
      .from('jobs')
      .update({ conversation_status: 'error' })
      .eq('id', jobId)

    throw new Error('Job not found')
  }

  const resume = job.resumes
  if (!resume || !resume.raw_text) {
    console.error('[start] Resume raw_text not found')
    await supabase
      .from('jobs')
      .update({ conversation_status: 'error' })
      .eq('id', jobId)

    throw new Error('Resume not parsed yet')
  }

  console.log('[start] Job title:', job.job_title)
  console.log('[start] Resume text length:', resume.raw_text.length)

  // Step 1: Run gap analysis
  console.log('[start] Running gap analysis...')
  const gapAnalysis = await callOpenAI(
    INTERROGATOR_PROMPTS.gapAnalysis.system,
    INTERROGATOR_PROMPTS.gapAnalysis.user(resume.raw_text, job.job_description, job.job_title)
  )

  console.log('[start] Gap analysis complete:', gapAnalysis.gaps.length, 'gaps found')
  console.log('[start] Initial match score:', gapAnalysis.initialMatchScore)

  // Extract company names from resume for personalized questions
  const companies = extractCompanyNames(resume.raw_text)
  console.log('[start] Extracted companies:', companies)

  // Step 2: Generate first question
  console.log('[start] Generating first question...')
  const firstGap = gapAnalysis.gaps[0]
  const questionResponse = await callOpenAI(
    INTERROGATOR_PROMPTS.generateQuestion.system,
    INTERROGATOR_PROMPTS.generateQuestion.user(firstGap, resume.raw_text, companies)
  )

  const firstQuestion = questionResponse.question

  // Step 3: Initialize conversation history
  const conversationHistory = [
    {
      role: 'ai',
      content: firstQuestion,
      timestamp: new Date().toISOString(),
      gap: firstGap.gap
    }
  ]

  // Step 4: Update job record
  await supabase
    .from('jobs')
    .update({
      conversation_status: 'questioning',
      conversation_history: conversationHistory,
      gaps_identified: gapAnalysis.gaps,
      current_question_index: 0,
      match_score_initial: gapAnalysis.initialMatchScore,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  console.log('[start] Interrogation started successfully')

  return new Response(
    JSON.stringify({
      success: true,
      question: firstQuestion,
      gaps: gapAnalysis.gaps,
      initialMatchScore: gapAnalysis.initialMatchScore,
      progress: { current: 1, total: 5 }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * PROCESS ANSWER (UPDATED: Multi-turn natural conversation)
 * 1. Append user answer to conversation history
 * 2. Use AI to decide: follow-up OR next gap OR finish
 * 3. Track total messages (limit: 10)
 * 4. Generate summary when done
 */
async function processAnswer(supabase: any, jobId: string, userAnswer: string) {
  console.log('[answer] Processing answer for job:', jobId)

  // Fetch current job state
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, resumes(*)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  const conversationHistory = job.conversation_history || []
  const gaps = job.gaps_identified || []
  const currentGapIndex = job.current_question_index || 0

  // Count total messages (user + AI)
  const totalMessages = conversationHistory.length

  console.log('[answer] Total messages so far:', totalMessages, '/10')
  console.log('[answer] Current gap index:', currentGapIndex, '/', gaps.length)

  // Append user answer
  conversationHistory.push({
    role: 'user',
    content: userAnswer,
    timestamp: new Date().toISOString()
  })

  // Check if we've hit message limit (10 total = 5 user + 5 AI)
  if (totalMessages >= 9) {
    console.log('[answer] Hit message limit (10), finishing conversation')

    // Generate summary
    const summary = await generateConversationSummary(supabase, job, conversationHistory, gaps)

    await supabase
      .from('jobs')
      .update({
        conversation_history: conversationHistory,
        conversation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({
        success: true,
        done: true,
        summary: summary,
        progress: { current: totalMessages + 1, total: 10 }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use AI to decide next action
  const currentGap = gaps[currentGapIndex]
  const remainingGaps = gaps.length - currentGapIndex - 1

  console.log('[answer] Calling AI to decide next action...')
  const decision = await callOpenAI(
    INTERROGATOR_PROMPTS.processAnswer.system,
    INTERROGATOR_PROMPTS.processAnswer.user(
      userAnswer,
      currentGap,
      conversationHistory,
      remainingGaps,
      totalMessages + 1
    )
  )

  console.log('[answer] AI decision:', decision.action)
  console.log('[answer] Acknowledgment:', decision.acknowledgment)

  // Append acknowledgment
  conversationHistory.push({
    role: 'ai',
    content: decision.acknowledgment,
    timestamp: new Date().toISOString(),
    type: 'acknowledgment'
  })

  // Update gap with user's answer if useful
  if (decision.shouldAddToResume && gaps[currentGapIndex]) {
    gaps[currentGapIndex].answered = true
    gaps[currentGapIndex].userAnswer = userAnswer
    gaps[currentGapIndex].willAddToResume = true
  }

  // Decide next action
  if (decision.action === 'finish' || (decision.action === 'next_gap' && currentGapIndex >= gaps.length - 1)) {
    // Conversation complete - generate summary
    console.log('[answer] Conversation complete, generating summary...')

    const summary = await generateConversationSummary(supabase, job, conversationHistory, gaps)

    await supabase
      .from('jobs')
      .update({
        conversation_history: conversationHistory,
        gaps_identified: gaps,
        conversation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({
        success: true,
        done: true,
        summary: summary,
        progress: { current: totalMessages + 2, total: 10 }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate next question
  let nextQuestion: string
  let nextGapIndex = currentGapIndex

  if (decision.action === 'follow_up' && decision.nextQuestion) {
    // Follow-up on same gap
    console.log('[answer] Following up on same gap')
    nextQuestion = decision.nextQuestion
  } else {
    // Move to next gap
    console.log('[answer] Moving to next gap')
    nextGapIndex = currentGapIndex + 1

    if (nextGapIndex >= gaps.length) {
      // No more gaps, finish
      const summary = await generateConversationSummary(supabase, job, conversationHistory, gaps)

      await supabase
        .from('jobs')
        .update({
          conversation_history: conversationHistory,
          gaps_identified: gaps,
          conversation_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return new Response(
        JSON.stringify({
          success: true,
          done: true,
          summary: summary,
          progress: { current: totalMessages + 2, total: 10 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nextGap = gaps[nextGapIndex]
    const companies = extractCompanyNames(job.resumes.raw_text)

    const questionResponse = await callOpenAI(
      INTERROGATOR_PROMPTS.generateQuestion.system,
      INTERROGATOR_PROMPTS.generateQuestion.user(nextGap, job.resumes.raw_text, companies)
    )

    nextQuestion = questionResponse.question
  }

  // Append next question
  conversationHistory.push({
    role: 'ai',
    content: nextQuestion,
    timestamp: new Date().toISOString(),
    gap: gaps[nextGapIndex]?.gap
  })

  // Update job
  await supabase
    .from('jobs')
    .update({
      conversation_history: conversationHistory,
      gaps_identified: gaps,
      current_question_index: nextGapIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  console.log('[answer] Next question generated')

  return new Response(
    JSON.stringify({
      success: true,
      question: nextQuestion,
      progress: { current: totalMessages + 3, total: 10 },
      done: false
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Generate Conversation Summary
 * Shows what will be added/changed in the resume
 */
async function generateConversationSummary(supabase: any, job: any, conversationHistory: any[], gaps: any[]) {
  console.log('[summary] Generating conversation summary...')

  const summary = await callOpenAI(
    INTERROGATOR_PROMPTS.generateSummary.system,
    INTERROGATOR_PROMPTS.generateSummary.user(conversationHistory, gaps, job.resumes.raw_text)
  )

  console.log('[summary] Summary generated:', summary.changes.length, 'changes')

  return summary
}

/**
 * GENERATE FINAL RESUME
 * 1. Fetch conversation history
 * 2. Call existing generate-tailored-resume function
 * 3. Calculate final match score
 */
async function generateFinalResume(supabase: any, jobId: string) {
  console.log('[generate] Generating final resume for job:', jobId)

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) {
    throw new Error('Job not found')
  }

  // Call existing generate-tailored-resume function
  // This will use the conversation_history stored in the job
  const generateUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-tailored-resume`

  console.log('[generate] Calling generate-tailored-resume...')

  const response = await fetch(generateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify({
      jobId: jobId,
      templateName: 'A', // Default to template A
      returnContentOnly: false
    })
  })

  const result = await response.json()

  if (!result.success) {
    console.error('[generate] Failed to generate resume:', result.error)

    await supabase
      .from('jobs')
      .update({ conversation_status: 'error' })
      .eq('id', jobId)

    throw new Error('Failed to generate resume: ' + result.error)
  }

  // Update job status to ready
  const finalMatchScore = result.aiInsights?.fitScore || job.match_score_initial + 15 // Estimate improvement

  await supabase
    .from('jobs')
    .update({
      conversation_status: 'ready',
      match_score_final: finalMatchScore,
      pdf_url: result.pdfUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  console.log('[generate] Resume generated successfully!')
  console.log('[generate] Match score:', job.match_score_initial, '→', finalMatchScore)

  return new Response(
    JSON.stringify({
      success: true,
      pdfUrl: result.pdfUrl,
      matchScoreImprovement: {
        initial: job.match_score_initial,
        final: finalMatchScore,
        improvement: finalMatchScore - job.match_score_initial
      }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Helper: Call OpenAI API
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<any> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

/**
 * Helper: Extract company names from resume text
 */
function extractCompanyNames(resumeText: string): string[] {
  // Simple heuristic: Look for lines with common job title patterns
  const lines = resumeText.split('\n')
  const companies: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Look for patterns like "Company Name | Job Title" or "Job Title at Company"
    if (line.includes(' at ') || line.includes(' | ') || line.includes(' - ')) {
      const parts = line.split(/\s+at\s+|\s+\|\s+|\s+-\s+/)
      if (parts.length > 1) {
        const potentialCompany = parts[parts.length - 1].trim()
        if (potentialCompany.length > 2 && potentialCompany.length < 50) {
          companies.push(potentialCompany)
        }
      }
    }
  }

  // Return up to 3 most recent companies
  return companies.slice(0, 3)
}
