import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { BlogLayout } from '../components/layout/BlogLayout'
import { BlogPostFrontmatter } from '../lib/mdx'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<{ Component: any; frontmatter: BlogPostFrontmatter } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const loadPost = async () => {
      try {
        // Dynamically import the MDX file
        const mdxModule = await import(`../content/resume-guides/${slug}.mdx`)

        setPost({
          Component: mdxModule.default,
          frontmatter: mdxModule.frontmatter || {
            title: 'Untitled',
            slug,
            category: 'Resume Guides',
            jobTitle: '',
            lastUpdated: new Date().toISOString().split('T')[0],
          },
        })
      } catch (error) {
        console.error(`Failed to load blog post: ${slug}`, error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff9f1c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return <Navigate to="/blog" replace />
  }

  const { Component, frontmatter } = post

  return (
    <BlogLayout frontmatter={frontmatter}>
      <Component />
    </BlogLayout>
  )
}
