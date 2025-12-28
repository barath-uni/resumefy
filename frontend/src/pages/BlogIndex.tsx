import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import jobTemplates from '../data/jobTemplates.json'
import { motion } from 'framer-motion'

interface BlogPostCard {
  slug: string
  title: string
  category: string
  jobTitle: string
  lastUpdated: string
  description: string
  icon: string
  gradient: string
}

// Job-specific emojis and gradients
const jobThemes: Record<string, { icon: string; gradient: string }> = {
  'software-engineer': { icon: '💻', gradient: 'from-blue-500 to-blue-600' },
  'data-analyst': { icon: '📊', gradient: 'from-purple-500 to-indigo-600' },
  'product-manager': { icon: '🎯', gradient: 'from-emerald-500 to-green-600' },
  'registered-nurse': { icon: '🏥', gradient: 'from-pink-500 to-rose-600' },
  'marketing-manager': { icon: '📱', gradient: 'from-orange-500 to-red-500' },
  'teacher': { icon: '📚', gradient: 'from-yellow-500 to-orange-500' },
  'accountant': { icon: '💰', gradient: 'from-green-500 to-teal-600' },
  'sales-representative': { icon: '💼', gradient: 'from-blue-600 to-indigo-700' },
  'customer-service': { icon: '🎧', gradient: 'from-cyan-500 to-blue-600' },
  'hr-manager': { icon: '👥', gradient: 'from-violet-500 to-purple-600' },
}

export default function BlogIndex() {
  // Generate blog post cards from job templates with themes
  const blogPosts: BlogPostCard[] = Object.entries(jobTemplates).map(([slug, data]) => ({
    slug,
    title: `How to Write a ${data.title} Resume in 2025`,
    category: data.category,
    jobTitle: data.title,
    lastUpdated: '2025-01-15',
    description: `Complete guide to writing a winning ${data.title} resume with examples, templates, and ATS optimization tips.`,
    icon: jobThemes[slug]?.icon || '📄',
    gradient: jobThemes[slug]?.gradient || 'from-gray-500 to-gray-600',
  }))

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/10 to-white" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-50 rounded-3xl rotate-12 opacity-60" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-emerald-50 rounded-2xl -rotate-12 opacity-40" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-100 relative z-10 bg-white/80 backdrop-blur-sm sticky top-0">
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
            <Link to="/">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 hover:opacity-90 text-white border-0 shadow-sm">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-50 rounded-full mb-6 border border-emerald-200">
              <span className="text-3xl">📚</span>
              <span className="text-sm font-semibold text-emerald-700">Free Resume Guides</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6 leading-tight">
              Resume Writing Guides
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Expert tips, templates, and ATS optimization strategies for every profession.
              Learn how to create resumes that get interviews.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid - Vibrant colorful cards */}
      <section className="pb-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.slug}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/blog/${post.slug}`} className="block group h-full">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group-hover:-translate-y-1 h-full">
                    {/* Emoji icon with gradient background */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${post.gradient} rounded-xl flex items-center justify-center text-3xl shadow-sm`}>
                        {post.icon}
                      </div>
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                        {post.category}
                      </span>
                    </div>

                    <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
                      {post.jobTitle} Resume Guide
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      {post.description}
                    </p>

                    {/* Read more link */}
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                      <span>Read Guide</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative group cursor-pointer"
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
                <h2 className="text-4xl font-heading font-bold text-gray-900 mb-6">
                  Ready to Create Your Perfect Resume?
                </h2>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Let AI tailor your resume to match any job description in seconds.
                  Get started for free today.
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
        </div>
      </section>

      {/* Footer */}
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
