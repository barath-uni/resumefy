import { Link } from "react-router-dom"
import { ArrowLeft, Mail, MessageCircle, Clock } from "lucide-react"
import { Button } from "../components/ui/button"

export default function Support() {
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
        <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">Support Center</h1>
        <p className="text-gray-600 mb-12">We're here to help you get the most out of Resumefy</p>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-4">Get help via email</p>
            <a href="mailto:support@resumefy.com" className="text-emerald-600 hover:underline text-sm font-medium">
              support@resumefy.com
            </a>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-4">Chat with our team</p>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
            <p className="text-sm text-gray-600 mb-4">Average response</p>
            <p className="text-sm font-medium text-gray-900">Within 24 hours</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How does Resumefy work?</h3>
              <p className="text-gray-700 leading-relaxed">
                Upload your resume and paste job descriptions you're interested in. Our AI analyzes your resume, generates a role-fit score, and creates an optimized version tailored to each job posting. You'll receive ATS-friendly PDF and DOCX files ready for submission.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Is my data secure?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes! All data is encrypted in transit (TLS/SSL) and at rest (AES-256). Your resume files are automatically deleted after 30 days. We never sell or share your personal information. See our <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link> for details.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What's included in the free trial?</h3>
              <p className="text-gray-700 leading-relaxed">
                You get 20 free resume optimizations with no credit card required. This includes role-fit scoring, ATS analysis, and downloadable optimized resumes in PDF and DOCX formats.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How much does the Pro subscription cost?</h3>
              <p className="text-gray-700 leading-relaxed">
                After your 20 free optimizations, you can upgrade to Pro for <span className="line-through text-gray-500">$19.99</span> <strong>$14.99/month</strong>. This includes unlimited quick optimizations, priority support, and advanced analytics.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period. We also offer a 7-day money-back guarantee for first-time subscribers.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What file formats do you support?</h3>
              <p className="text-gray-700 leading-relaxed">
                We accept PDF and DOCX (Microsoft Word) files for upload, with a maximum file size of 5MB. Optimized resumes are provided in both PDF and DOCX formats.
              </p>
            </div>

            {/* FAQ 7 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How accurate is the ATS scoring?</h3>
              <p className="text-gray-700 leading-relaxed">
                Our ATS analysis is based on industry-standard parsing algorithms used by major applicant tracking systems. While we achieve high accuracy, we recommend reviewing all suggestions before submitting your resume.
              </p>
            </div>

            {/* FAQ 8 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Can I edit the optimized resume?</h3>
              <p className="text-gray-700 leading-relaxed">
                Yes! We provide downloadable DOCX files that you can edit in Microsoft Word, Google Docs, or any compatible word processor. We recommend reviewing and personalizing all AI-generated suggestions.
              </p>
            </div>

            {/* FAQ 9 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How long does resume optimization take?</h3>
              <p className="text-gray-700 leading-relaxed">
                Most resume optimizations are completed within 2-3 minutes. You'll receive an email notification when your optimized resume is ready to download.
              </p>
            </div>

            {/* FAQ 10 */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">I didn't receive my magic link email. What should I do?</h3>
              <p className="text-gray-700 leading-relaxed">
                First, check your spam/junk folder. Magic links expire after 15 minutes for security. If you still can't find it, try uploading your resume again to generate a new link. Contact us at <a href="mailto:support@resumefy.com" className="text-emerald-600 hover:underline">support@resumefy.com</a> if the issue persists.
              </p>
            </div>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-heading font-bold text-white mb-4">Still need help?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a href="mailto:support@resumefy.com">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold border-0">
              Contact Support
            </Button>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-gray-50 mt-16">
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
