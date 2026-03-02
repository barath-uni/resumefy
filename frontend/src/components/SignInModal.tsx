import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { X, Mail } from "lucide-react"
import { supabase } from "../lib/supabase"
import { analytics } from "../lib/analytics"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToUpload: () => void
}

export default function SignInModal({ isOpen, onClose, onSwitchToUpload }: SignInModalProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)

    try {
      const redirectUrl = `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/app/dashboard`

      // Try to send magic link for sign-in
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            app_name: 'Resumefy',
            action_text: 'Sign In to Your Dashboard'
          }
        }
      })

      if (error) {
        // If error indicates user doesn't exist, switch to upload modal
        if (error.message?.includes('not found') ||
            error.message?.includes('User not found') ||
            error.message?.includes('Invalid login credentials')) {
          console.log('👤 [SignInModal] User not found, switching to UploadModal')
          onClose()
          onSwitchToUpload()
          return
        }
        throw error
      }

      // Track successful sign-in attempt
      analytics.trackMagicLinkSent(email)

      // Show success screen
      setShowSuccess(true)
    } catch (error: unknown) {
      console.error("❌ [SignInModal] Error:", error)
      alert(`Error: ${(error as Error).message || 'Something went wrong. Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setEmail("")
    setShowSuccess(false)
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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-heading font-bold text-gray-900">Sign In</div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!showSuccess ? (
              <motion.div
                key="signin-form"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-xl font-heading font-medium text-gray-900 mb-2">Welcome back!</h2>
                  <p className="text-gray-600">Enter your email to receive a magic link</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                      autoFocus
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!email || isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium border-0"
                  >
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        onClose()
                        onSwitchToUpload()
                      }}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Get Started
                    </button>
                  </p>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <p>Passwordless sign-in • Secure magic link authentication</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">Check your email!</h2>
                  <p className="text-gray-700 font-medium">
                    We've sent a magic link to <strong className="text-gray-900">{email}</strong>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <div className="text-sm font-medium text-blue-700 mb-1">🔒 Security Notice</div>
                  <div className="text-sm text-gray-700">
                    The link expires in 1 hour for your security. Check your spam folder if you don't see it.
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
