import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { CheckCircle, Sparkles, Loader2, Crown, Zap, Star, ArrowRight } from 'lucide-react'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Give the webhook a moment to process
    const timer = setTimeout(() => {
      setLoading(false)
      // Trigger confetti when success screen appears
      triggerConfetti()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const triggerConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
      })

      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
      })
    }, 250)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-12 text-center border-2 shadow-2xl">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 animate-pulse"></div>
            <Loader2 className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto mb-6 animate-spin relative" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Processing your subscription...
          </h2>
          <p className="text-muted-foreground">
            Setting up your premium account
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-6 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="max-w-2xl w-full p-8 md:p-12 text-center relative border-2 shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
        {/* Success Icon with animated background */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-2xl opacity-30 animate-pulse"></div>
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 relative animate-scale-in shadow-lg">
            <CheckCircle className="w-14 h-14 text-white animate-bounce-once" />
          </div>
        </div>

        {/* Success Badge */}
        <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none text-sm font-semibold">
          PAYMENT SUCCESSFUL
        </Badge>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to Premium!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your subscription has been activated successfully 🎉
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">Unlimited PDF Generation</h3>
                <p className="text-xs text-muted-foreground">Create professional resumes without limits</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">Premium Templates</h3>
                <p className="text-xs text-muted-foreground">Access all professional ATS-friendly templates</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-pink-500 rounded-lg flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">AI-Powered Analysis</h3>
                <p className="text-xs text-muted-foreground">Get intelligent fit scores and suggestions</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">Priority Support</h3>
                <p className="text-xs text-muted-foreground">24/7 dedicated support for all your needs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="mb-8 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Session ID:</span> {sessionId.slice(0, 24)}...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            size="lg"
            onClick={() => navigate('/app/tailor')}
            className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
          >
            <span>Start Creating Amazing Resumes</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/app/billing')}
            className="w-full h-12 border-2"
          >
            View Subscription Details
          </Button>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Confirmation email sent to your inbox</span>
        </div>
      </Card>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes scale-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out 0.5s;
        }
      `}</style>
    </div>
  )
}
