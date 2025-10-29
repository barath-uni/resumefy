import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { FileText, Clock, CheckCircle, AlertCircle, Sparkles, TrendingUp, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../components/ui/button'
import { analytics } from '../lib/analytics'
import ResumeUpload from '../components/ResumeUpload'
import { getUserResumes } from '../lib/uploadResume'
import { extractResumeText } from '../lib/parseResume'
import { generatePDF, downloadPDF } from '../lib/generatePDF'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [emailData, setEmailData] = useState<any>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(1) // Simulate progress
  const [currentResume, setCurrentResume] = useState<any>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [extractMetadata, setExtractMetadata] = useState<{ pages?: number; wordCount?: number } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [showFullText, setShowFullText] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [generatedPDFUrl, setGeneratedPDFUrl] = useState<string | null>(null)
  const [pdfWarnings, setPDFWarnings] = useState<string[]>([])
  const [pdfOverflow, setPDFOverflow] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    experience_years: '',
    target_roles: ''
  })

  useEffect(() => {
    const handleAuthFlow = async () => {
      try {
        console.log('🔐 [Dashboard] Starting auth flow...')

        // Check URL for error parameters (expired links, etc.)
        const urlParams = new URLSearchParams(window.location.hash.substring(1))
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        console.log('🔍 [Dashboard] URL params:', { error, errorDescription, hash: window.location.hash })

        if (error === 'access_denied' && errorDescription?.includes('expired')) {
          console.log('❌ [Dashboard] Link expired')
          setError('Your email link has expired. Please upload your resume again to get a new link.')
          setLoading(false)
          return
        }

        // Handle auth state changes from URL (signup confirmation)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 [Dashboard] Auth state changed:', event, session?.user?.email)

          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            await handleUserSession(session.user)
            setLoading(false)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setError('Please check your email and click the confirmation link to access your dashboard.')
            setLoading(false)
          }
        })

        // Also check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        console.log('🔑 [Dashboard] Current session:', session?.user?.email)

        if (sessionError) {
          console.error('❌ [Dashboard] Session error:', sessionError)
          throw sessionError
        }

        if (session?.user) {
          setUser(session.user)
          await handleUserSession(session.user)

          // Track dashboard reached - KEY METRIC!
          analytics.trackDashboardReached()
          console.log('✅ [Dashboard] Auth complete!')
        } else {
          console.log('⚠️ [Dashboard] No active session')
          setError('Please check your email and click the confirmation link to access your dashboard.')
        }

        return () => {
          authListener?.subscription?.unsubscribe()
        }
      } catch (error: any) {
        console.error('Auth error:', error)
        setError('Authentication failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    const handleUserSession = async (user: any) => {
      console.log('👤 [Dashboard] Handling user session...', user.email)

      // Get the email capture data using the custom token from user metadata
      const customToken = user.user_metadata?.custom_token
      console.log('🔑 [Dashboard] Custom token:', customToken)

      if (customToken) {
        // Update our custom magic link tracking
        const { data: magicLink, error: linkError } = await supabase
          .from('magic_links')
          .select('*, email_captures(*)')
          .eq('token', customToken)
          .single()

        console.log('🔗 [Dashboard] Magic link data:', magicLink)

        if (!linkError && magicLink) {
          // Mark as clicked
          await supabase
            .from('magic_links')
            .update({ clicked: true })
            .eq('token', customToken)

          await supabase
            .from('email_captures')
            .update({
              magic_link_clicked: true,
              magic_link_clicked_at: new Date().toISOString()
            })
            .eq('id', magicLink.email_capture_id)

          setEmailData(magicLink.email_captures)

          console.log('📄 [Dashboard] Email capture data:', magicLink.email_captures)

          // Load uploaded resume if it exists
          if (magicLink.email_captures?.uploaded_file_url) {
            console.log('📎 [Dashboard] Found uploaded file:', magicLink.email_captures.uploaded_file_url)
            setCurrentResume({
              id: magicLink.email_captures.id,
              file_name: magicLink.email_captures.uploaded_file_name,
              file_url: magicLink.email_captures.uploaded_file_url,
              file_size: magicLink.email_captures.uploaded_file_size,
              created_at: magicLink.email_captures.uploaded_at
            })
          }

          // Track magic link clicked - KEY METRIC!
          analytics.trackMagicLinkClicked()
        }
      } else {
        // Fallback: Try to fetch email_captures by user email
        console.log('⚠️ [Dashboard] No custom token, fetching by email...')
        const { data: emailCaptures, error: captureError } = await supabase
          .from('email_captures')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)

        if (!captureError && emailCaptures && emailCaptures.length > 0) {
          console.log('📧 [Dashboard] Found email capture:', emailCaptures[0])
          setEmailData(emailCaptures[0])

          // Load uploaded resume if it exists
          if (emailCaptures[0].uploaded_file_url) {
            console.log('📎 [Dashboard] Found uploaded file:', emailCaptures[0].uploaded_file_url)
            setCurrentResume({
              id: emailCaptures[0].id,
              file_name: emailCaptures[0].uploaded_file_name,
              file_url: emailCaptures[0].uploaded_file_url,
              file_size: emailCaptures[0].uploaded_file_size,
              created_at: emailCaptures[0].uploaded_at
            })
          }
        }
      }

      // Check if user needs to complete profile setup
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!existingProfile) {
        setShowProfileSetup(true)
      }

      // Load user's resumes
      await loadResumes(user.id)
    }

    const loadResumes = async (userId: string) => {
      const resumes = await getUserResumes(userId)
      if (resumes && resumes.length > 0) {
        setCurrentResume(resumes[0]) // Use most recent resume
      }
    }

    handleAuthFlow()

    // Simulate analysis progress for demo
    const progressTimer = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= 4) {
          clearInterval(progressTimer)
          return 4
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(progressTimer)
  }, [])

  const handleProfileSubmit = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          experience_years: parseInt(profile.experience_years),
          target_roles: profile.target_roles.split(',').map(role => role.trim())
        })

      if (error) throw error

      setShowProfileSetup(false)
    } catch (error: any) {
      console.error('Profile creation error:', error)
      alert('Failed to create profile. Please try again.')
    }
  }

  const handleUploadSuccess = async (resumeId: string, fileUrl: string) => {
    // Reload resumes to get the new one
    if (user) {
      const resumes = await getUserResumes(user.id)
      if (resumes && resumes.length > 0) {
        setCurrentResume(resumes[0])
      }

      // Phase 3A: Automatically trigger text extraction
      setIsExtracting(true)
      console.log('🚀 [Dashboard] Triggering text extraction for:', resumeId)

      const result = await extractResumeText(resumeId, fileUrl)

      if (result.success && result.text) {
        console.log('✅ [Dashboard] Text extracted successfully')
        setExtractedText(result.text)
        setExtractMetadata({ pages: result.pages, wordCount: result.wordCount })
        setIsExtracting(false)
      } else {
        console.error('❌ [Dashboard] Extraction failed:', result.error)
        setError(result.error || 'Failed to extract text from resume')
        setIsExtracting(false)
      }
    }
  }

  const handleGeneratePDF = async () => {
    if (!currentResume?.id) {
      alert('No resume found. Please upload a resume first.')
      return
    }

    setIsGeneratingPDF(true)
    setGeneratedPDFUrl(null)
    setPDFWarnings([])
    setPDFOverflow(null)

    console.log('🎨 [Dashboard] Starting PDF generation for resumeId:', currentResume.id)

    const result = await generatePDF(currentResume.id)

    if (result.success && result.pdfUrl) {
      console.log('✅ [Dashboard] PDF generated successfully:', result.pdfUrl)
      setGeneratedPDFUrl(result.pdfUrl)
      setPDFWarnings(result.warnings || [])
      setPDFOverflow(result.overflow || null)
    } else {
      console.error('❌ [Dashboard] PDF generation failed:', result.error)
      alert(`Failed to generate PDF: ${result.error}`)
    }

    setIsGeneratingPDF(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-6"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-12 h-12 border border-emerald-500/30 rounded-full mx-auto"
            />
          </div>
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gray-700 text-lg font-medium"
          >
            Loading your resume analysis...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center max-w-md mx-4"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-red-500 text-5xl mb-4"
          >
            ⚠️
          </motion.div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium border-0"
          >
            Return to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full opacity-60" />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4 relative z-10"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few details to personalize your experience</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              <select
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                required
              >
                <option value="">Select experience level</option>
                <option value="0">Entry Level (0-1 years)</option>
                <option value="2">Junior (2-3 years)</option>
                <option value="4">Mid-level (4-6 years)</option>
                <option value="7">Senior (7-10 years)</option>
                <option value="11">Lead/Principal (10+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Roles</label>
              <input
                type="text"
                value={profile.target_roles}
                onChange={(e) => setProfile({ ...profile, target_roles: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                placeholder="Software Engineer, Product Manager, Data Analyst"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple roles with commas</p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Complete Profile
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Clean Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-white" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-50 rounded-3xl rotate-12 opacity-60" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-emerald-50 rounded-2xl -rotate-12 opacity-40" />
      </div>

      {/* Navigation - Matching Landing Page */}
      <nav className="border-b border-gray-100 relative z-10 bg-white/90 backdrop-blur-sm fix-compositing-text">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/icons/logo-500.png"
                alt="Resumefy Logo"
                className="w-8 h-8"
              />
              <div>
                <div className="text-xl font-heading font-semibold text-gray-900">Resumefy</div>
                <div className="text-xs text-gray-500">Dashboard</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  ✓ Free Plan
                </div>
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <Button
                onClick={() => supabase.auth.signOut()}
                variant="outline"
                className="border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-3">
              Welcome back,
              <span className="text-emerald-600 block md:inline">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">Your resume analysis is in progress...</p>

            {/* Status indicators */}
            <div className="flex flex-col md:flex-row items-center gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-2 border border-gray-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700">Analysis in progress</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Started {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              {currentResume ? 'Your Resume' : 'Upload Your Resume'}
            </h2>
            <p className="text-gray-600 mb-6">
              {currentResume
                ? 'Your resume is ready. You can replace it anytime.'
                : 'Get started by uploading your resume in PDF or DOCX format'
              }
            </p>
            {user && (
              <ResumeUpload
                userId={user.id}
                onUploadSuccess={handleUploadSuccess}
                existingResume={currentResume}
              />
            )}

            {/* Phase 3A: Text Extraction Progress */}
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-blue-900 font-medium">Extracting text from your resume...</p>
                </div>
                <p className="text-blue-700 text-sm mt-2">Using PDF.js library (no AI, fast & reliable)</p>
              </motion.div>
            )}

            {/* Phase 3A: Extracted Text Display */}
            {extractedText && !isExtracting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Text Extracted Successfully!</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullText(!showFullText)}
                    className="flex items-center gap-2"
                  >
                    {showFullText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showFullText ? 'Hide' : 'Show'} Full Text
                  </Button>
                </div>

                {/* Metadata */}
                <div className="flex gap-4 mb-4 text-sm text-gray-700">
                  {extractMetadata?.pages && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span><strong>{extractMetadata.pages}</strong> {extractMetadata.pages === 1 ? 'page' : 'pages'}</span>
                    </div>
                  )}
                  {extractMetadata?.wordCount && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span><strong>{extractMetadata.wordCount.toLocaleString()}</strong> words</span>
                    </div>
                  )}
                </div>

                {/* Text Preview/Full Display */}
                {showFullText ? (
                  <div className="bg-white p-4 rounded border border-green-300 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {extractedText}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded border border-green-300">
                    <p className="text-sm text-gray-700">
                      {extractedText.substring(0, 300)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Click "Show Full Text" to see complete extraction
                    </p>
                  </div>
                )}

                {/* Phase 3C: Generate PDF Button */}
                <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">🎨 Phase 3C: Template Engine (THE MONEY MAKER)</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    AI will intelligently structure your resume into a professional template, handling spacing, overflow, and layout decisions automatically.
                  </p>

                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium border-0 flex items-center gap-2"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate PDF (Template A)
                      </>
                    )}
                  </Button>

                  {isGeneratingPDF && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-600">⏳ Step 1: Extracting flexible blocks with AI (~$0.01)</p>
                      <p className="text-xs text-gray-600">⏳ Step 2: Deciding optimal layout with AI (~$0.005)</p>
                      <p className="text-xs text-gray-600">⏳ Step 3: Rendering PDF with React-PDF ($0)</p>
                    </div>
                  )}
                </div>

                {/* Generated PDF Display */}
                {generatedPDFUrl && !isGeneratingPDF && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-emerald-50 border border-emerald-300 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-emerald-900">PDF Generated Successfully!</h3>
                    </div>

                    <div className="flex gap-3 mb-4">
                      <Button
                        onClick={() => window.open(generatedPDFUrl, '_blank')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-medium border-0"
                      >
                        View PDF
                      </Button>
                      <Button
                        onClick={() => downloadPDF(generatedPDFUrl, 'resume_template_a.pdf')}
                        variant="outline"
                        className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded font-medium"
                      >
                        Download PDF
                      </Button>
                    </div>

                    {/* Warnings */}
                    {pdfWarnings && pdfWarnings.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-medium text-yellow-900 mb-1">⚠️ Warnings:</p>
                        <ul className="text-xs text-yellow-800 list-disc list-inside">
                          {pdfWarnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Overflow Recommendations */}
                    {pdfOverflow?.hasOverflow && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm font-medium text-orange-900 mb-1">💡 Overflow Detected ({pdfOverflow.overflowLines} lines)</p>
                        <p className="text-xs text-orange-800 mb-2">Recommendations:</p>
                        <ul className="text-xs text-orange-800 list-disc list-inside">
                          {pdfOverflow.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Success Message */}
                    {!pdfOverflow?.hasOverflow && (
                      <div className="mt-4 p-3 bg-emerald-100 border border-emerald-200 rounded">
                        <p className="text-sm text-emerald-900">✅ Perfect fit! Your resume fits perfectly in 1 page with Template A.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Upload Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Upload Details</h2>
                  <p className="text-xs text-gray-500">File information</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Filename</span>
                <span className="text-gray-900 font-medium truncate">{emailData?.uploaded_filename || 'resume.pdf'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Target Role</span>
                <span className="text-gray-900 font-medium">
                  {emailData?.job_positions?.[0] || 'General Analysis'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Uploaded</span>
                <span className="text-gray-900 font-medium">
                  {emailData?.upload_timestamp ? new Date(emailData.upload_timestamp).toLocaleDateString() : 'Today'}
                </span>
              </div>
            </div>
          </div>

          {/* Analysis Progress Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
                  <p className="text-xs text-gray-500">Processing status</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-600">{analysisStep}/4</div>
                <div className="text-xs text-gray-500">Steps</div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { step: 1, label: 'Resume parsing', status: analysisStep >= 1 ? 'complete' : 'pending' },
                { step: 2, label: 'Role matching', status: analysisStep >= 2 ? 'complete' : analysisStep === 1 ? 'active' : 'pending' },
                { step: 3, label: 'Optimization analysis', status: analysisStep >= 3 ? 'complete' : analysisStep === 2 ? 'active' : 'pending' },
                { step: 4, label: 'Report generation', status: analysisStep >= 4 ? 'complete' : analysisStep === 3 ? 'active' : 'pending' }
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + item.step * 0.1 }}
                  className="flex items-center gap-3"
                >
                  {item.status === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : item.status === 'active' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="w-5 h-5 text-blue-500" />
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`${item.status === 'complete' ? 'text-green-500' : item.status === 'active' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Next Steps</h2>
                  <p className="text-xs text-gray-500">What's coming</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-semibold text-xs">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Resume Review</div>
                  <div className="text-xs text-gray-500">Check parsed content & make edits</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-600 font-semibold text-xs">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Role Optimization</div>
                  <div className="text-xs text-gray-500">Get tailored recommendations</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 font-semibold text-xs">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">Download Results</div>
                  <div className="text-xs text-gray-500">Export optimized resume files</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results / Error State */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-all"
        >
          {analysisStep < 4 ? (
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Analysis in Progress...</h3>
              <p className="text-gray-600">Our AI is analyzing your resume and generating personalized recommendations.</p>
            </div>
          ) : (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <AlertCircle className="w-8 h-8 text-red-500" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Feature Not Available</h3>
              <p className="text-gray-600 mb-6">
                Resume analysis and optimization features are currently under development.
                We're working hard to bring you AI-powered insights soon!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Target className="w-5 h-5 text-blue-600 mb-2" />
                  <h4 className="text-gray-900 font-medium mb-1">Coming Next</h4>
                  <p className="text-gray-600 text-sm">Resume parsing & role matching</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
                  <h4 className="text-gray-900 font-medium mb-1">MVP Features</h4>
                  <p className="text-gray-600 text-sm">AI optimization & file generation</p>
                </div>
              </div>

              <Button
                onClick={() => window.location.href = '/'}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium border-0"
              >
                Back to Home
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer - Matching Landing Page */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50 relative z-10 fix-compositing-text">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="/icons/logo-500.png"
                alt="Resumefy Logo"
                className="w-8 h-8"
              />
              <div className="text-lg font-heading font-semibold text-gray-900 force-dark-text">Resumefy</div>
            </div>
            <div className="flex items-center space-x-8 text-sm text-gray-700">
              <a href="#" className="hover:text-gray-900 transition-colors font-medium force-gray-text">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors font-medium force-gray-text">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors font-medium force-gray-text">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}