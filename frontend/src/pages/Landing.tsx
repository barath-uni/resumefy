import { Button } from "../components/ui/button"
import { Upload, Star, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { analytics } from "../lib/analytics"
import { TypeAnimation } from 'react-type-animation'

interface LandingProps {
  onOpenUploadModal: () => void
  isAuthenticated?: boolean | null
}

export default function Landing({ onOpenUploadModal, isAuthenticated }: LandingProps) {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/app/dashboard')
    } else {
      onOpenUploadModal()
    }
  }

  const handleSignIn = () => {
    if (isAuthenticated) {
      navigate('/app/dashboard')
    } else {
      onOpenUploadModal()
    }
  }
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Clean Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/10 to-white" />

        {/* Geometric shapes inspired by the screenshots */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-50 rounded-3xl rotate-12 opacity-60" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-indigo-50 rounded-2xl -rotate-12 opacity-40" />

        {/* Subtle dots pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }} />
        </div>
      </div>

      {/* Clean Navigation */}
      <nav className="border-b border-gray-100 relative z-10 bg-white backdrop-blur-sm fix-compositing-text">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between"
          >
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/icons/logo-500.png"
                alt="Resumefy Logo"
                className="w-8 h-8"
              />
              <div className="text-xl font-heading font-semibold text-gray-900">Resumefy</div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">How it works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Pricing</a>
              <Button
                onClick={handleSignIn}
                variant="outline"
                className="border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign in
              </Button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-left">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-6"
              >
                <h1 className="text-5xl md:text-6xl font-heading font-bold leading-tight text-gray-900 min-h-[160px] md:min-h-[180px]">
                  This resume gets you{' '}
                  <span className="text-emerald-600 inline-block min-w-[280px] md:min-w-[400px]">
                    <TypeAnimation
                      sequence={[
                        '3x interviews',
                        2000,
                        'past ATS bots',
                        2000,
                        'hired faster',
                        2000,
                      ]}
                      wrapper="span"
                      speed={50}
                      repeat={Infinity}
                    />
                  </span>
                </h1>
                <p className="text-xl text-gray-700 mt-4 font-medium">
                  Only 2% of resumes pass ATS. Yours will be one of them.
                </p>
              </motion.div>

              {/* Social Proof Badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-gray-700 font-medium">4.8/5</span>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-1 text-gray-700">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">1,200+ resumes tailored this week</span>
                </div>
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg text-gray-600 font-body leading-relaxed mb-8 max-w-lg"
              >
                Get 3x more interview callbacks. Beat the ATS. Land the job.
              </motion.p>

              {/* Primary CTA - Simple Upload Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-4"
              >
                <Button
                  onClick={() => {
                    analytics.trackSimplifiedCTAClick('hero')
                    analytics.trackUploadAttempt()
                    handleGetStarted()
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white border-0 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl group"
                >
                  <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Upload Resume - Get Started Free
                </Button>

                <p className="text-sm text-gray-500">
                  PDF or DOCX • No credit card • Results in 60 seconds
                </p>
              </motion.div>
            </div>

            {/* Right side - Demo Video */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative lg:pl-12"
            >
              {/* Bunny Stream Demo Video - Extra Large */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl mx-auto"
                style={{ paddingBottom: '75%', height: 0 }}
                onClick={() => analytics.trackDemoVideoPlayed()}
              >
                <iframe
                  src="https://player.mediadelivery.net/embed/607025/315d1b96-8849-4d8b-b2d6-cb40475965cc?autoplay=true&loop=false&muted=false&preload=true&responsive=true&volume=20"
                  loading="lazy"
                  style={{ border: 0, position: 'absolute', top: 0, height: '100%', width: '100%' }}
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Background decorative elements */}
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-100 rounded-full opacity-60 -z-10"></div>
              <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-blue-100 rounded-lg rotate-45 opacity-60 -z-10"></div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-20"
          >
            <p className="text-sm text-gray-500">
              Privacy-first • Auto-delete in 30 days • No data sharing
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 fix-compositing-text" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6 force-dark-text">
              From hours of frustration to
              <span className="text-emerald-600"> instant optimization</span>
            </h2>
            <p className="text-xl text-gray-900 max-w-2xl mx-auto leading-relaxed force-gray-text">
              Skip the guesswork. Get role-fit scores, readability analysis, and ATS-optimized resumes that actually get past the bots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "⏱️",
                iconBg: "from-blue-500 to-blue-600",
                title: "Save 5+ hours per application",
                desc: "Stop manually tweaking resumes for each job. Upload once, get optimized versions for every role in your pipeline.",
                delay: 0,
                stats: "Save 5+ hours"
              },
              {
                icon: "🎯",
                iconBg: "from-indigo-500 to-purple-600",
                title: "Know which roles fit you best",
                desc: "Get role-fit scores that show exactly which positions match your skills. No more applying blindly to jobs you're underqualified for.",
                delay: 0.2,
                stats: "94% accuracy"
              },
              {
                icon: "📊",
                iconBg: "from-green-500 to-green-600",
                title: "ATS-friendly & readable resumes",
                desc: "Get readability scores and ATS optimization that actually gets past the bots and into human hands.",
                delay: 0.4,
                stats: "3x more interviews"
              },
              {
                icon: "🌍",
                iconBg: "from-orange-500 to-red-500",
                title: "Apply in the language that gets you hired",
                desc: "Tailored resumes in your language for local opportunities, or English for international roles. You control the language.",
                delay: 0.6,
                stats: "50+ languages"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                viewport={{ once: true }}
                className="group relative cursor-pointer"
                onClick={() => {
                  analytics.trackUploadAttempt()
                  handleGetStarted()
                }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group-hover:-translate-y-1 h-full">
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.iconBg} rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4`}>
                      {feature.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Success Rate</div>
                      <div className="text-sm font-bold text-black">{feature.stats}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-black group-hover:text-emerald-600 transition-colors">{feature.title}</h3>
                  <p className="text-gray-800 leading-relaxed">{feature.desc}</p>

                  {/* Hover indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white relative overflow-hidden" id="how-it-works">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
              From upload to
              <span className="text-emerald-600"> interview-ready</span>
            </h2>
            <p className="text-xl text-gray-900 max-w-2xl mx-auto">
              Our streamlined process takes you from generic resume to job-tailored perfection in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                step: "01",
                title: "Upload Resume",
                desc: "Drop your PDF or DOCX in any language. We detect your language and keep everything consistent - no unwanted translations.",
                icon: "📄",
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "02",
                title: "Get Magic Link",
                desc: "Receive a secure link via email to access your personalized analysis dashboard.",
                icon: "✨",
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "03",
                title: "Add Job Description",
                desc: "Paste the job posting you want to apply for and watch the magic happen.",
                icon: "🎯",
                color: "from-green-500 to-green-600"
              },
              {
                step: "04",
                title: "Download & Apply",
                desc: "Get your optimized resume in PDF format, ready for submission. Choose from 4 professional templates.",
                icon: "🚀",
                color: "from-orange-500 to-red-500"
              },
              {
                step: "05",
                title: "Scale to Multiple Jobs (Pro)",
                desc: "Applying to 14 jobs? Upgrade to Pro for bulk generation - create tailored resumes for all roles at once.",
                icon: "⚡",
                color: "from-indigo-500 to-purple-600"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative cursor-pointer"
                onClick={() => {
                  analytics.trackUploadAttempt()
                  handleGetStarted()
                }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 h-full">
                  {/* Step number */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center text-white text-lg font-bold`}>
                      {item.icon}
                    </div>
                    <div className="text-xs text-gray-400 font-mono font-bold">{item.step}</div>
                  </div>

                  <h3 className="text-lg font-semibold mb-3 text-gray-900 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>

                  {/* Connection line for larger screens */}
                  {index < 4 && (
                    <div className="hidden lg:block absolute top-12 -right-3 w-6 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Call to action */}
          <div className="text-center mt-16">
            <Button
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-medium text-lg border-0 shadow-lg hover:shadow-xl transition-all group"
              onClick={() => {
                analytics.trackSimplifiedCTAClick('how_it_works')
                analytics.trackUploadAttempt()
                handleGetStarted()
              }}
            >
              Start Your Free Analysis
              <motion.div
                className="ml-2 group-hover:translate-x-1 transition-transform"
                whileHover={{ x: 4 }}
              >
                →
              </motion.div>
            </Button>
            <p className="text-sm text-gray-500 mt-3">No signup required • Results in 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Pricing Section - NEW */}
      <section className="py-24 bg-gray-50 fix-compositing-text" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6 force-dark-text">
              Simple, Transparent
              <span className="text-emerald-600"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto force-gray-text">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Trial */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all force-dark-text"
            >
              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2 force-dark-text">Free</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 force-dark-text">$0</div>
                <div className="text-gray-600 text-sm mt-1 force-gray-text">5 tailorings total</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700 force-gray-text">AI-powered tailoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700 force-gray-text">Role-fit score (0-100%)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700 force-gray-text">ATS-friendly optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700 force-gray-text">All 4 professional templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700 force-gray-text">No credit card required</span>
                </li>
              </ul>

              <Button
                onClick={() => {
                  analytics.trackUploadAttempt()
                  onOpenUploadModal()
                }}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 force-dark-text hover:force-dark-text"
              >
                Get Started Free
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 shadow-lg border-2 border-emerald-200 hover:shadow-xl transition-all relative force-dark-text"
            >
              <div className="absolute -top-4 right-8 bg-emerald-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </div>

              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2 force-dark-text">Pro</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 force-dark-text">
                  <span className="line-through text-gray-400 text-2xl">$8.99</span>
                  <span className="ml-2">$4.99</span>
                  <span className="text-lg text-gray-600 font-normal">/month</span>
                </div>
                <div className="text-emerald-600 text-sm mt-1 font-medium force-dark-text">44% off - Launch pricing!</div>
                <div className="text-gray-700 text-xs mt-1 force-gray-text">30 tailorings • Cancel anytime</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">30 tailorings</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">All Free features included</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">Bulk template generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">Priority email support (48h)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">Early access to new templates</span>
                </li>
              </ul>

              <Button
                onClick={() => {
                  analytics.trackUploadAttempt()
                  onOpenUploadModal()
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                Upgrade to Pro
              </Button>
            </motion.div>

            {/* Max Plan */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all relative force-dark-text"
            >
              <div className="absolute -top-4 right-8 bg-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Best Value
              </div>

              <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2 force-dark-text">Max</h3>
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 force-dark-text">
                  <span className="line-through text-gray-400 text-2xl">$14.99</span>
                  <span className="ml-2">$8.99</span>
                  <span className="text-lg text-gray-600 font-normal">/month</span>
                </div>
                <div className="text-purple-600 text-sm mt-1 font-medium force-dark-text">40% off - Best for power users!</div>
                <div className="text-gray-700 text-xs mt-1 force-gray-text">100 tailorings • Cancel anytime</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">100 tailorings</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">All Pro features included</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">Priority email support (24h)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">Analytics dashboard (coming soon)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-gray-900 font-medium force-dark-text">Priority feature requests</span>
                </li>
              </ul>

              <Button
                onClick={() => {
                  analytics.trackUploadAttempt()
                  onOpenUploadModal()
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
              >
                Upgrade to Max
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-blue-400/20 via-indigo-500/10 to-transparent rounded-full"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-radial from-indigo-400/15 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-radial from-blue-400/12 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Ready to land more
              <span className="text-emerald-400"> interviews</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of job seekers who've transformed their career prospects with Resumefy.
            </p>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-8"
            >
              <Button
                className="bg-emerald-500 text-white hover:bg-emerald-600 px-12 py-4 rounded-xl font-semibold text-lg border-0 shadow-lg hover:shadow-xl transition-all group"
                onClick={() => {
                  analytics.trackUploadAttempt()
                  onOpenUploadModal()
                }}
              >
                Start Your Free Analysis
                <Upload className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-2xl font-bold text-white mb-1">2 minutes</div>
                <div className="text-gray-300 text-sm">Average analysis time</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-2xl font-bold text-white mb-1">3x</div>
                <div className="text-gray-300 text-sm">More interviews</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="text-2xl font-bold text-white mb-1">94%</div>
                <div className="text-gray-300 text-sm">Role fit accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50 fix-compositing-text">
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
              <Link to="/privacy" className="hover:text-gray-900 transition-colors font-medium force-gray-text">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors font-medium force-gray-text">Terms</Link>
              <Link to="/support" className="hover:text-gray-900 transition-colors font-medium force-gray-text">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
