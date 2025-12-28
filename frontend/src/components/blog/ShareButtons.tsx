import { useState } from 'react'
import { Button } from '../ui/button'
import { Share2, Twitter, Linkedin, Facebook, Link, Check } from 'lucide-react'
import { analytics } from '../../lib/analytics'

interface ShareButtonsProps {
  title: string
  url?: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || window.location.href

  const handleShare = (platform: string) => {
    analytics.trackEvent('content_shared', {
      platform,
      title,
      url: shareUrl,
    })

    let shareLink = ''
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)

    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        break
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      default:
        return
    }

    window.open(shareLink, '_blank', 'width=600,height=400')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      analytics.trackEvent('content_shared', {
        platform: 'copy_link',
        title,
        url: shareUrl,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <div className="my-8 p-6 bg-gradient-to-r from-[#cbf3f0] to-[#ffbf69]/20 rounded-lg border border-[#2ec4b6]/20">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-[#2ec4b6]" />
        <h3 className="text-lg font-heading font-bold text-gray-900">
          Share This Guide
        </h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Help others by sharing this resume guide
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleShare('twitter')}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </Button>
        <Button
          onClick={() => handleShare('linkedin')}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
        >
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </Button>
        <Button
          onClick={() => handleShare('facebook')}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
        >
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </Button>
        <Button
          onClick={copyLink}
          variant="outline"
          size="sm"
          className={`border-gray-300 ${
            copied
              ? 'bg-green-500 text-white border-green-500'
              : 'hover:bg-[#2ec4b6] hover:text-white hover:border-[#2ec4b6]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
