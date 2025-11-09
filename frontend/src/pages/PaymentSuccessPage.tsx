import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { CheckCircle, Sparkles, Loader2, Crown, Zap, Star, ArrowRight } from 'lucide-react'

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Give the webhook time to process (increased to 3 seconds)
    const timer = setTimeout(() => {
      setLoading(false)
      // Trigger confetti when success screen appears
      triggerConfetti()
    }, 3000)

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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-12 text-center border-2 shadow-2xl">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-primary mx-auto mb-6 animate-spin relative" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center relative border-2 shadow-2xl">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 relative animate-scale-in shadow-lg">
            <CheckCircle className="w-14 h-14 text-primary-foreground animate-bounce-once" />
          </div>
        </div>

        {/* Success Badge */}
        <Badge className="mb-4 px-4 py-1.5 bg-primary text-primary-foreground border-none text-sm font-semibold">
          PAYMENT SUCCESSFUL
        </Badge>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
          Welcome to Premium!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your subscription has been activated successfully 🎉
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-muted border rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">Unlimited PDF Generation</h3>
                <p className="text-xs text-muted-foreground">Create professional resumes without limits</p>
              </div>
            </div>
          </div>

          <div className="bg-muted border rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">Premium Templates</h3>
                <p className="text-xs text-muted-foreground">Access all professional ATS-friendly templates</p>
              </div>
            </div>
          </div>

          <div className="bg-muted border rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">AI-Powered Analysis</h3>
                <p className="text-xs text-muted-foreground">Get intelligent fit scores and suggestions</p>
              </div>
            </div>
          </div>

          <div className="bg-muted border rounded-xl p-5 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                <Star className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground mb-1">Priority Support</h3>
                <p className="text-xs text-muted-foreground">24/7 dedicated support for all your needs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            size="lg"
            onClick={() => {
              // Force full page reload to refresh tier in AppLayout
              window.location.href = '/app/dashboard'
            }}
            className="w-full text-lg h-14"
          >
            <span>Start Creating Amazing Resumes</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              // Force full page reload to refresh tier in AppLayout
              window.location.href = '/app/billing-details'
            }}
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
