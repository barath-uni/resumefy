import { ReactNode, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import { BlogPostFrontmatter, generateSEOMetadata } from '../../lib/mdx'

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

    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', seo.description)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = seo.description
      document.head.appendChild(meta)
    }

    // Update keywords meta tag
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-2xl font-heading font-bold">
              <span className="text-[#ff9f1c]">Resume</span>
              <span className="text-gray-900">fy</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/blog">
                <Button variant="ghost" size="sm">
                  All Guides
                </Button>
              </Link>
              <Link to="/">
                <Button size="sm" className="bg-[#ff9f1c] hover:bg-[#ffbf69] text-white">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2ec4b6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 mb-4 text-sm font-medium text-[#2ec4b6] bg-[#cbf3f0] rounded-full">
            {frontmatter.category}
          </div>
          <h1 className="text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
            {frontmatter.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Last updated: {frontmatter.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 pb-16">
        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-[#2ec4b6] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:my-6 prose-li:my-2 prose-code:text-[#ff9f1c] prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
          {children}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-[#cbf3f0] to-[#ffbf69]/20 rounded-2xl p-8 border border-[#2ec4b6]/20">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-3xl font-heading font-bold text-gray-900 mb-4">
              Ready to create your {frontmatter.jobTitle} resume?
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              Let AI tailor your resume to match any job description in seconds.
              Get your personalized, ATS-optimized resume now.
            </p>
            <Link to="/">
              <Button
                size="lg"
                className="bg-[#ff9f1c] hover:bg-[#ffbf69] text-white font-semibold px-8 py-6 text-lg"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-bold text-gray-900 mb-4">Resumefy</h4>
              <p className="text-sm text-gray-600">
                AI-powered resume tailoring to help you land your dream job.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/blog" className="text-sm text-gray-600 hover:text-[#2ec4b6]">Resume Guides</Link></li>
                <li><Link to="/support" className="text-sm text-gray-600 hover:text-[#2ec4b6]">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-sm text-gray-600 hover:text-[#2ec4b6]">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-gray-600 hover:text-[#2ec4b6]">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Resumefy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
