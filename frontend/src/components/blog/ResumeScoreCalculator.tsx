import { useState } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Card } from '../ui/card'
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ResumeScoreCalculatorProps {
  jobTitle: string
}

interface ScoreResult {
  score: number
  feedback: string[]
  missingKeywords: string[]
  strengths: string[]
}

export function ResumeScoreCalculator({ jobTitle }: ResumeScoreCalculatorProps) {
  const [bullets, setBullets] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)

  const analyzeBullets = async () => {
    if (!bullets.trim()) return

    setIsAnalyzing(true)
    try {
      // Call OpenAI via edge function to analyze resume bullets
      const { data, error } = await supabase.functions.invoke('analyze-resume-bullets', {
        body: { bullets, jobTitle },
      })

      if (error) throw error

      setResult(data)
    } catch (error) {
      console.error('Error analyzing bullets:', error)
      // Fallback to simple scoring
      const bulletList = bullets.split('\n').filter(b => b.trim())
      const hasMetrics = bulletList.some(b => /\d+%|\$\d+|x\d+/i.test(b))
      const hasActionVerbs = bulletList.some(b => /^(led|managed|developed|increased|reduced|improved)/i.test(b.trim()))

      let score = 50
      if (hasMetrics) score += 20
      if (hasActionVerbs) score += 15
      if (bulletList.length >= 3) score += 15

      setResult({
        score,
        feedback: [
          hasMetrics ? 'Great use of metrics!' : 'Add quantifiable metrics to strengthen impact',
          hasActionVerbs ? 'Strong action verbs detected' : 'Start bullets with strong action verbs',
          bulletList.length >= 3 ? 'Good number of examples' : 'Add more specific examples',
        ],
        missingKeywords: [],
        strengths: hasMetrics ? ['Uses quantifiable metrics'] : [],
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  return (
    <Card className="p-6 my-8 border-2 border-[#2ec4b6]/20 bg-gradient-to-br from-white to-[#cbf3f0]/10">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-[#ff9f1c]" />
          <h3 className="text-xl font-heading font-bold text-gray-900">
            Resume Score Calculator
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Paste 3-5 of your resume bullets for {jobTitle} and get instant feedback
        </p>
      </div>

      <Textarea
        value={bullets}
        onChange={(e) => setBullets(e.target.value)}
        placeholder="Example:&#10;• Led team of 5 engineers to deliver product features ahead of schedule&#10;• Increased user engagement by 35% through A/B testing&#10;• Reduced bug count by 40% using automated testing"
        className="min-h-[150px] mb-4 font-mono text-sm"
      />

      <Button
        onClick={analyzeBullets}
        disabled={!bullets.trim() || isAnalyzing}
        className="w-full bg-[#ff9f1c] hover:bg-[#ffbf69] text-white"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze My Bullets'}
      </Button>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Score Display */}
          <div className="text-center p-6 bg-white rounded-lg border-2 border-[#2ec4b6]">
            <div className={`text-6xl font-bold ${getScoreColor(result.score)} mb-2`}>
              {result.score}
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {getScoreLabel(result.score)}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            {result.feedback.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-[#ff9f1c] mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 text-sm">Strengths:</h4>
              {result.strengths.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-4 p-4 bg-gradient-to-r from-[#cbf3f0] to-[#ffbf69]/20 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              Want a detailed analysis of your full resume? Upload it now and get AI-powered tailoring!
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#2ec4b6] hover:bg-[#2ec4b6]/90 text-white"
            >
              Upload Full Resume
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
