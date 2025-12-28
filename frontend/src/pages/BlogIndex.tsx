import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { ArrowRight, BookOpen, Calendar } from 'lucide-react'
import jobTemplates from '../data/jobTemplates.json'

interface BlogPostCard {
  slug: string
  title: string
  category: string
  jobTitle: string
  lastUpdated: string
  description: string
}

export default function BlogIndex() {
  // Generate blog post cards from job templates
  const blogPosts: BlogPostCard[] = Object.entries(jobTemplates).map(([slug, data]) => ({
    slug,
    title: `How to Write a ${data.title} Resume in 2025`,
    category: data.category,
    jobTitle: data.title,
    lastUpdated: '2025-01-15',
    description: `Complete guide to writing a winning ${data.title} resume with examples, templates, and ATS optimization tips.`,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-2xl font-heading font-bold">
              <span className="text-[#ff9f1c]">Resume</span>
              <span className="text-gray-900">fy</span>
            </Link>
            <Link to="/">
              <Button size="sm" className="bg-[#ff9f1c] hover:bg-[#ffbf69] text-white">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#cbf3f0] rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-[#2ec4b6]" />
            <span className="text-sm font-medium text-[#2ec4b6]">Free Resume Guides</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
            Resume Writing Guides
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert tips, templates, and ATS optimization strategies for every profession.
            Learn how to create resumes that get interviews.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="h-full p-6 hover:shadow-lg transition-shadow border-2 hover:border-[#2ec4b6] group">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium text-[#2ec4b6] bg-[#cbf3f0] rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-heading font-bold text-gray-900 mb-3 group-hover:text-[#2ec4b6] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{post.lastUpdated}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#ff9f1c] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-[#cbf3f0] to-[#ffbf69]/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-heading font-bold text-gray-900 mb-6">
            Ready to Create Your Perfect Resume?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Let AI tailor your resume to match any job description in seconds.
            Get started for free today.
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
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
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
