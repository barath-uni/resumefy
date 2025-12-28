import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Search, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ATSKeywordExtractorProps {
  jobTitle: string
}

interface ExtractedKeywords {
  technical: string[]
  soft: string[]
  tools: string[]
  certifications: string[]
}

export function ATSKeywordExtractor({ jobTitle }: ATSKeywordExtractorProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [keywords, setKeywords] = useState<ExtractedKeywords | null>(null)
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null)

  const extractKeywords = async () => {
    if (!jobDescription.trim()) return

    setIsExtracting(true)
    try {
      // Call edge function to extract keywords using AI
      const { data, error } = await supabase.functions.invoke('extract-ats-keywords', {
        body: { jobDescription, jobTitle },
      })

      if (error) throw error

      setKeywords(data)
    } catch (error) {
      console.error('Error extracting keywords:', error)
      // Fallback to simple keyword extraction
      const text = jobDescription.toLowerCase()
      const commonSkills = ['python', 'javascript', 'react', 'sql', 'aws', 'docker', 'git', 'agile', 'api', 'testing']
      const foundSkills = commonSkills.filter(skill => text.includes(skill))

      setKeywords({
        technical: foundSkills.slice(0, 5),
        soft: ['communication', 'teamwork', 'problem-solving'].filter(skill => text.includes(skill)),
        tools: ['jira', 'slack', 'github'].filter(tool => text.includes(tool)),
        certifications: [],
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const copyKeywords = (category: string, words: string[]) => {
    const text = words.join(', ')
    navigator.clipboard.writeText(text)
    setCopiedCategory(category)
    setTimeout(() => setCopiedCategory(null), 2000)
  }

  const allKeywords = keywords
    ? [...keywords.technical, ...keywords.soft, ...keywords.tools, ...keywords.certifications]
    : []

  return (
    <Card className="p-6 my-8 border-2 border-[#ff9f1c]/20 bg-gradient-to-br from-white to-[#ffbf69]/10">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-[#ff9f1c]" />
          <h3 className="text-xl font-heading font-bold text-gray-900">
            ATS Keyword Extractor
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Paste a job description to extract important keywords for your {jobTitle} resume
        </p>
      </div>

      <Textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the job description here...&#10;&#10;We're looking for a talented Software Engineer to join our team. You'll work with React, Node.js, and AWS to build scalable applications..."
        className="min-h-[150px] mb-4 text-sm"
      />

      <Button
        onClick={extractKeywords}
        disabled={!jobDescription.trim() || isExtracting}
        className="w-full bg-[#ff9f1c] hover:bg-[#ffbf69] text-white"
      >
        {isExtracting ? 'Extracting Keywords...' : 'Extract ATS Keywords'}
      </Button>

      {keywords && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-[#cbf3f0]/30 rounded-lg border border-[#2ec4b6]">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              ✨ Found {allKeywords.length} important keywords
            </p>
            <p className="text-xs text-gray-600">
              Include these keywords naturally in your resume to pass ATS screening
            </p>
          </div>

          {/* Technical Skills */}
          {keywords.technical.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">Technical Skills</h4>
                <button
                  onClick={() => copyKeywords('technical', keywords.technical)}
                  className="text-xs text-[#2ec4b6] hover:text-[#2ec4b6]/80 flex items-center gap-1"
                >
                  {copiedCategory === 'technical' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.technical.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#2ec4b6] text-white text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {keywords.soft.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">Soft Skills</h4>
                <button
                  onClick={() => copyKeywords('soft', keywords.soft)}
                  className="text-xs text-[#2ec4b6] hover:text-[#2ec4b6]/80 flex items-center gap-1"
                >
                  {copiedCategory === 'soft' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.soft.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#ffbf69] text-gray-900 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {keywords.tools.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">Tools & Technologies</h4>
                <button
                  onClick={() => copyKeywords('tools', keywords.tools)}
                  className="text-xs text-[#2ec4b6] hover:text-[#2ec4b6]/80 flex items-center gap-1"
                >
                  {copiedCategory === 'tools' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.tools.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-200 text-gray-900 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {keywords.certifications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">Certifications</h4>
                <button
                  onClick={() => copyKeywords('certifications', keywords.certifications)}
                  className="text-xs text-[#2ec4b6] hover:text-[#2ec4b6]/80 flex items-center gap-1"
                >
                  {copiedCategory === 'certifications' ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.certifications.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#ff9f1c] text-white text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#cbf3f0] to-[#ffbf69]/20 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              Let AI automatically optimize your resume with these keywords!
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#2ec4b6] hover:bg-[#2ec4b6]/90 text-white"
            >
              Tailor My Resume
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
