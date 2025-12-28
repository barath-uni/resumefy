import matter from 'gray-matter'

export interface BlogPostFrontmatter {
  title: string
  slug: string
  category: string
  jobTitle: string
  lastUpdated: string
  description?: string
  keywords?: string[]
  image?: string
}

export interface BlogPost {
  frontmatter: BlogPostFrontmatter
  content: string
  slug: string
}

/**
 * Get all MDX blog posts from the content directory
 * This is a placeholder - in a real implementation, you'd dynamically import
 * all MDX files from the content directory at build time
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // In a real implementation, use Vite's import.meta.glob to load all MDX files
  // For now, return empty array - posts will be loaded individually
  return []
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // Dynamically import the MDX file
    const mdxModule = await import(`../content/resume-guides/${slug}.mdx`)
    return {
      frontmatter: mdxModule.frontmatter || {},
      content: '', // Content is rendered by MDX component itself
      slug,
    }
  } catch (error) {
    console.error(`Failed to load blog post: ${slug}`, error)
    return null
  }
}

/**
 * Parse MDX content and extract frontmatter
 */
export function parseMDX(content: string): { frontmatter: BlogPostFrontmatter; content: string } {
  const { data, content: mdxContent } = matter(content)
  return {
    frontmatter: data as BlogPostFrontmatter,
    content: mdxContent,
  }
}

/**
 * Generate SEO metadata for a blog post
 */
export function generateSEOMetadata(frontmatter: BlogPostFrontmatter) {
  return {
    title: `${frontmatter.title} | Resumefy`,
    description: frontmatter.description || `Learn how to create a winning ${frontmatter.jobTitle} resume with our comprehensive guide. Get expert tips, templates, and examples.`,
    keywords: frontmatter.keywords || [
      frontmatter.jobTitle,
      'resume',
      'resume guide',
      'resume template',
      'resume tips',
      'ATS optimization',
      'career advice',
    ],
    ogImage: frontmatter.image || '/og-image-default.jpg',
    canonical: `https://resumefy.ai/blog/${frontmatter.slug}`,
  }
}
