import { ReactNode, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import { BlogPostFrontmatter, generateSEOMetadata } from '../../lib/mdx'
import { motion } from 'framer-motion'

interface BlogLayoutProps {
  children: ReactNode
  frontmatter: BlogPostFrontmatter
}

export function BlogLayout({ children, frontmatter }: BlogLayoutProps) {
  const navigate = useNavigate()

  // Update SEO metadata
  useEffect(() => {
    const seo = generateSEOMetadata(frontmatter)
    document.title = seo.title

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', seo.description)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = seo.description
      document.head.appendChild(meta)
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords.setAttribute('content', seo.keywords.join(', '))
    } else {
      const meta = document.createElement('meta')
      meta.name = 'keywords'
      meta.content = seo.keywords.join(', ')
      document.head.appendChild(meta)
    }
  }, [frontmatter])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements matching landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/10 to-white" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-50 rounded-3xl rotate-12 opacity-60" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-emerald-50 rounded-2xl -rotate-12 opacity-40" />
      </div>

      {/* Navigation matching landing page */}
      <nav className="border-b border-gray-100 relative z-10 bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/icons/logo-500.png"
                alt="Resumefy Logo"
                className="w-8 h-8"
              />
              <div className="text-xl font-heading font-semibold text-gray-900">Resumefy</div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/blog">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  All Guides
                </Button>
              </Link>
              <Link to="/">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 hover:opacity-90 text-white border-0 shadow-sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 py-4 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
      </div>

      {/* Article Header */}
      <div className="max-w-5xl mx-auto px-6 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-block px-4 py-2 mb-6 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
            {frontmatter.category}
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6 leading-tight">
            {frontmatter.title}
          </h1>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">Last updated: {frontmatter.lastUpdated}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Article Content */}
      <article className="max-w-5xl mx-auto px-6 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:font-bold
            prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-gray-900
            prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-6 prose-h3:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-lg
            prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:my-6 prose-li:my-3 prose-li:text-gray-700
            prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono prose-code:text-sm
            prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:text-gray-100
            prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700"
        >
          {children}
        </motion.div>

        {/* CTA Section - Vibrant and eye-catching */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 relative group cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 rounded-3xl p-12 border border-emerald-200">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block text-6xl mb-6"
              >
                🚀
              </motion.div>
              <h3 className="text-4xl font-heading font-bold text-gray-900 mb-4">
                Ready to create your {frontmatter.jobTitle} resume?
              </h3>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Let AI tailor your resume to match any job description in seconds.
                Get your personalized, ATS-optimized resume now.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 hover:opacity-90 text-white text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-0"
              >
                Get Started Free →
              </Button>
              <p className="text-sm text-gray-600 mt-4">
                No credit card required • 2-minute setup
              </p>
            </div>
          </div>
        </motion.div>
      </article>

      {/* Footer matching landing page style */}
      <footer className="border-t border-gray-100 bg-gray-50 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1">
              <Link to="/" className="flex items-center space-x-3 mb-4">
                <img
                  src="/icons/logo-500.png"
                  alt="Resumefy Logo"
                  className="w-8 h-8"
                />
                <div className="text-xl font-heading font-semibold text-gray-900">Resumefy</div>
              </Link>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI-powered resume tailoring to help you land your dream job.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Features</Link></li>
                <li><Link to="/" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Pricing</Link></li>
                <li><Link to="/blog" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Resume Guides</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Support</h4>
              <ul className="space-y-3">
                <li><Link to="/support" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Help Center</Link></li>
                <li><Link to="/support" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Resumefy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
