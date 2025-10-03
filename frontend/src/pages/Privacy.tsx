import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "../components/ui/button"

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/icons/logo-500.png"
                alt="Resumefy Logo"
                className="w-8 h-8"
              />
              <div className="text-xl font-heading font-semibold text-gray-900">Resumefy</div>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Resumefy, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume optimization service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Email Address:</strong> Used for authentication and sending you your resume analysis results</li>
              <li><strong>Resume Files:</strong> PDF or DOCX files you upload for optimization</li>
              <li><strong>Job Descriptions:</strong> Job posting URLs or pasted text you provide for resume tailoring</li>
              <li><strong>Usage Analytics:</strong> Anonymous data about how you use our service to improve our platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Process and optimize your resume for specific job postings</li>
              <li>Generate role-fit scores and ATS compatibility analysis</li>
              <li>Send you magic link authentication emails</li>
              <li>Provide customer support</li>
              <li>Improve our service through anonymous analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">4. Data Storage & Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Encryption:</strong> All data is encrypted in transit using TLS/SSL and at rest using AES-256 encryption.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Storage:</strong> Your resume files are stored securely on our servers for 30 days by default, after which they are automatically deleted. You can request earlier deletion at any time.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Access Control:</strong> Only authorized personnel have access to your data, and all access is logged for audit purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By default, we retain your resume files and analysis for 30 days. After this period, all files are permanently deleted from our servers. Your email address is retained for account management purposes unless you request account deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">6. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>We do not sell, trade, or rent your personal information to third parties.</strong>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your information only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (e.g., cloud hosting, email delivery)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">7. Your Rights (GDPR/CCPA)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@resumefy.com" className="text-emerald-600 hover:underline">privacy@resumefy.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">8. Cookies & Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use minimal cookies for essential functionality (authentication) and anonymous analytics (Google Analytics). You can disable cookies in your browser settings, though this may affect service functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: <a href="mailto:privacy@resumefy.com" className="text-emerald-600 hover:underline">privacy@resumefy.com</a></li>
              <li>Support: <Link to="/support" className="text-emerald-600 hover:underline">Visit our Support page</Link></li>
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="/icons/logo-500.png"
                alt="Resumefy Logo"
                className="w-8 h-8"
              />
              <div className="text-lg font-heading font-semibold text-gray-900">Resumefy</div>
            </div>
            <div className="flex items-center space-x-8 text-sm text-gray-700">
              <Link to="/privacy" className="hover:text-gray-900 transition-colors font-medium">Privacy</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors font-medium">Terms</Link>
              <Link to="/support" className="hover:text-gray-900 transition-colors font-medium">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
