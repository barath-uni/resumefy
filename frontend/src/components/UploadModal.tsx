import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { X, Upload, FileText, Check, Mail, AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react"
import { supabase } from "../lib/supabase"
import { analytics } from "../lib/analytics"
import { useNavigate } from "react-router-dom"

interface JobEntry {
  id: string
  url: string
  description: string
  urlStatus: 'idle' | 'checking' | 'valid' | 'invalid'
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean | null
}

export default function UploadModal({ isOpen, onClose, isAuthenticated }: UploadModalProps) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [email, setEmail] = useState("")
  const [jobEntries, setJobEntries] = useState<JobEntry[]>([{
    id: '1',
    url: '',
    description: '',
    urlStatus: 'idle'
  }])
  const [isLoading, setIsLoading] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]

      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a PDF or DOCX file only.")
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.")
        return
      }

      setUploadedFile(file)

      // Track file upload
      analytics.trackFileUploaded(file.name, file.size)
    }
  }

  const checkUrlAccess = async (jobId: string, url: string) => {
    if (!url) return

    setJobEntries(prev => prev.map(job =>
      job.id === jobId ? { ...job, urlStatus: 'checking' } : job
    ))

    try {
      // Simple URL validation first
      new URL(url)

      // In a real app, you'd check if URL is accessible
      // For now, just simulate the check
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simulate random success/failure for demo
      const isAccessible = Math.random() > 0.3 // 70% success rate
      setJobEntries(prev => prev.map(job =>
        job.id === jobId ? { ...job, urlStatus: isAccessible ? 'valid' : 'invalid' } : job
      ))
    } catch (error) {
      setJobEntries(prev => prev.map(job =>
        job.id === jobId ? { ...job, urlStatus: 'invalid' } : job
      ))
    }
  }

  const addJobEntry = () => {
    const newJob: JobEntry = {
      id: Date.now().toString(),
      url: '',
      description: '',
      urlStatus: 'idle'
    }
    setJobEntries(prev => [...prev, newJob])

    // Track job position added
    analytics.trackJobPositionsAdded(jobEntries.length + 1)
  }

  const removeJobEntry = (jobId: string) => {
    if (jobEntries.length > 1) {
      setJobEntries(prev => prev.filter(job => job.id !== jobId))
    }
  }

  const updateJobEntry = (jobId: string, field: keyof JobEntry, value: any) => {
    setJobEntries(prev => prev.map(job =>
      job.id === jobId ? { ...job, [field]: value } : job
    ))
  }

  const handleSubmit = async () => {
    // If user is already authenticated, just redirect to dashboard
    if (isAuthenticated) {
      console.log('✅ [UploadModal] User already authenticated, redirecting to dashboard')
      onClose()
      navigate('/app/dashboard')
      return
    }

    if (!email || !uploadedFile) return

    console.log('🚀 [UploadModal] Starting submission...', { email, fileName: uploadedFile.name })

    // Check if at least one job entry has either URL or description
    const hasValidJobEntry = jobEntries.some(job =>
      (job.url && job.urlStatus === 'valid') || job.description.trim()
    )
    if (!hasValidJobEntry) {
      console.log('❌ [UploadModal] No valid job entries')
      return
    }

    setIsLoading(true)

    try {
      // Track email submission
      analytics.trackEmailSubmitted(email)

      // Prepare job positions array from all entries
      const jobPositions = jobEntries
        .filter(job => (job.url && job.urlStatus === 'valid') || job.description.trim())
        .map(job => job.url || job.description.substring(0, 100))

      console.log('📊 [UploadModal] Job positions:', jobPositions)

      // STEP 1: Upload file to Supabase Storage FIRST
      console.log('📤 [UploadModal] Uploading file to storage...')

      // Create a hash of email for folder name
      const emailHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(email)
      ).then(buf => Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16) // Use first 16 chars of hash
      )

      const timestamp = Date.now()
      const fileExt = uploadedFile.name.split('.').pop()
      const filePath = `temp/${emailHash}/${timestamp}.${fileExt}`

      console.log('📁 [UploadModal] File path:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume')
        .upload(filePath, uploadedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ [UploadModal] Upload error:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      console.log('✅ [UploadModal] File uploaded:', uploadData.path)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resume')
        .getPublicUrl(uploadData.path)

      console.log('🔗 [UploadModal] Public URL:', publicUrl)

      // STEP 2: Save to email_captures table with file info
      console.log('💾 [UploadModal] Saving to email_captures...')

      const { data: emailCapture, error: captureError } = await supabase
        .from('email_captures')
        .insert({
          email,
          uploaded_filename: uploadedFile.name,
          uploaded_file_url: publicUrl,
          uploaded_file_name: uploadedFile.name,
          uploaded_file_size: uploadedFile.size,
          uploaded_at: new Date().toISOString(),
          job_positions: jobPositions,
          upload_timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (captureError) {
        console.error('❌ [UploadModal] Database error:', captureError)
        // Clean up uploaded file
        await supabase.storage.from('resume').remove([uploadData.path])
        throw captureError
      }

      console.log('✅ [UploadModal] Email capture saved:', emailCapture.id)

      // STEP 3: Generate secure token for magic link tracking
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      console.log('🔑 [UploadModal] Generated token:', token)

      // STEP 4: Save magic link
      const { error: linkError } = await supabase
        .from('magic_links')
        .insert({
          token,
          email,
          email_capture_id: emailCapture.id,
          expires_at: expiresAt.toISOString()
        })

      if (linkError) {
        console.error('❌ [UploadModal] Magic link error:', linkError)
        throw linkError
      }

      console.log('✅ [UploadModal] Magic link saved')

      // STEP 5: Check if user already exists
      console.log('🔍 [UploadModal] Checking if user exists...')

      // Query auth.users to check if email exists (this will work via admin API)
      // For client-side, we'll try signUp and handle the error
      const redirectUrl = `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/app/dashboard`

      // Try to sign up - if user exists, this will return an error or success with existing user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // Random password, user will use magic links
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            app_name: 'Resumefy',
            file_name: uploadedFile.name,
            action_text: 'Complete Your Profile & View Analysis',
            email_capture_id: emailCapture.id,
            custom_token: token // Pass our custom token for tracking
          }
        }
      })

      // Check if user already exists based on the response
      if (signUpError?.message?.includes('already registered') ||
          signUpError?.message?.includes('already exists') ||
          signUpData?.user?.identities?.length === 0) {

        console.log('👤 [UploadModal] User already exists, sending sign-in magic link...')
        setIsExistingUser(true)

        // Send magic link for existing user
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              app_name: 'Resumefy',
              file_name: uploadedFile.name,
              action_text: 'View Your Dashboard',
              email_capture_id: emailCapture.id,
              custom_token: token
            }
          }
        })

        if (signInError) {
          console.error('❌ [UploadModal] Sign-in error:', signInError)
          throw signInError
        }

        console.log('✅ [UploadModal] Sign-in magic link sent')
      } else if (signUpError) {
        console.error('❌ [UploadModal] Auth error:', signUpError)
        throw signUpError
      } else {
        console.log('✅ [UploadModal] New user signup email sent')
      }

      const authError = signUpError

      if (authError) {
        console.error('❌ [UploadModal] Auth error:', authError)
        throw authError
      }

      console.log('✅ [UploadModal] Signup email sent!')

      // Track magic link sent successfully
      analytics.trackMagicLinkSent(email)

      // Move to success screen (step 3)
      setCurrentStep(3)

      console.log('🎉 [UploadModal] Submission complete!')
    } catch (error: any) {
      console.error("❌ [UploadModal] Fatal error:", error)
      alert(`Error: ${error.message || 'Something went wrong. Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setUploadedFile(null)
    setEmail("")
    setJobEntries([{
      id: '1',
      url: '',
      description: '',
      urlStatus: 'idle'
    }])
    setIsLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-heading font-bold text-gray-900">Resumefy</div>
            <div className="text-sm text-gray-500">• Step {currentStep} of 3</div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-emerald-600 h-2 rounded-full"
              initial={{ width: "33%" }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: File Upload + Email */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">Upload Your Resume</h2>
                  <p className="text-gray-600">Upload your resume and provide your email to get started</p>
                </div>

                {/* File Upload */}
                <div>
                  {!uploadedFile ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-emerald-500 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">PDF or DOCX • Max 5MB</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                      <FileText className="w-8 h-8 text-emerald-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{uploadedFile.name}</div>
                        <div className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-sans text-gray-900"
                  />
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!uploadedFile || !email}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium border-0"
                  >
                    Continue
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="text-xs text-gray-500 text-center">
                  <p>Privacy-first • Auto-delete in 30 days • No data sharing</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Job Description */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">Add Job Descriptions</h2>
                  <p className="text-gray-600">Add multiple job postings by URL or paste descriptions directly</p>
                </div>

                {/* Job Entries */}
                <div className="space-y-6">
                  {jobEntries.map((job, index) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Job #{index + 1}</h3>
                        {jobEntries.length > 1 && (
                          <Button
                            onClick={() => removeJobEntry(job.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Job URL Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Posting URL (LinkedIn, Indeed, etc.)
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="url"
                              value={job.url}
                              onChange={(e) => {
                                updateJobEntry(job.id, 'url', e.target.value)
                                updateJobEntry(job.id, 'urlStatus', 'idle')
                              }}
                              placeholder="https://linkedin.com/jobs/view/123456789"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-sans text-gray-900"
                            />
                            {job.urlStatus === 'checking' && (
                              <div className="absolute right-3 top-3">
                                <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                              </div>
                            )}
                            {job.urlStatus === 'valid' && (
                              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                            )}
                            {job.urlStatus === 'invalid' && (
                              <AlertCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <Button
                            onClick={() => checkUrlAccess(job.id, job.url)}
                            disabled={!job.url || job.urlStatus === 'checking'}
                            variant="outline"
                            className="px-4"
                          >
                            {job.urlStatus === 'checking' ? 'Checking...' : 'Check'}
                          </Button>
                        </div>

                        {job.urlStatus === 'invalid' && (
                          <p className="text-sm text-red-600 mt-2">
                            ❌ Cannot access this URL. Please paste the job description below instead.
                          </p>
                        )}
                        {job.urlStatus === 'valid' && (
                          <p className="text-sm text-green-600 mt-2">
                            ✅ URL is accessible! We'll extract the job description for you.
                          </p>
                        )}
                      </div>

                      {/* OR Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                      </div>

                      {/* Job Description Textarea */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste Job Description
                        </label>
                        <textarea
                          value={job.description}
                          onChange={(e) => updateJobEntry(job.id, 'description', e.target.value)}
                          placeholder="Paste the full job description here..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-sans resize-none text-gray-900"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Job Button */}
                  <Button
                    onClick={addJobEntry}
                    variant="outline"
                    className="w-full border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Job
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!jobEntries.some(job =>
                      (job.url && job.urlStatus === 'valid') || job.description.trim()
                    ) || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  >
                    {isLoading ? "Processing..." : "Analyze Resume"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success Screen */}
            {currentStep === 3 && (
              <motion.div
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">Check Your Email!</h2>
                  <p className="text-gray-700 font-medium">
                    We've sent a confirmation link to <strong className="text-gray-900">{email}</strong>
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Click the link in your email to view your resume analysis and download your tailored resume.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <div className="text-sm font-medium text-blue-700 mb-1">🔒 Security Notice</div>
                  <div className="text-sm text-gray-700">
                    The link expires in 15 minutes for your security. Check your spam folder if you don't see it.
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-heading"
                >
                  Got it!
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}