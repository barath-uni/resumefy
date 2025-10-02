import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "../components/ui/button"

export default function Terms() {
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
        <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using Resumefy ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Resumefy is an AI-powered resume optimization platform that helps job seekers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Analyze and optimize resumes for specific job postings</li>
              <li>Generate role-fit scores and ATS compatibility assessments</li>
              <li>Tailor resume content to match job descriptions</li>
              <li>Download optimized resumes in PDF and DOCX formats</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">3. User Accounts & Authentication</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Magic Link Authentication:</strong> You authenticate using magic links sent to your email address. You are responsible for maintaining the confidentiality of your email account.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Account Security:</strong> You agree to notify us immediately of any unauthorized access to your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">4. Pricing & Payment Terms</h2>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">Free Trial</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All users receive 20 free resume optimizations. No credit card is required to start your free trial.
            </p>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">Pro Subscription</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              After using your 20 free optimizations, you may upgrade to a Pro subscription at <span className="line-through text-gray-500">$19.99</span> <strong>$14.99/month</strong> for unlimited quick optimizations.
            </p>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">Billing</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Subscriptions are billed monthly in advance</li>
              <li>Payments are processed through Stripe</li>
              <li>Prices are in USD unless otherwise stated</li>
              <li>You may cancel your subscription at any time</li>
            </ul>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">Refund Policy</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We offer a 7-day money-back guarantee for first-time Pro subscribers. If you're not satisfied within 7 days of your initial subscription, contact us for a full refund.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">5. User Responsibilities & Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Upload malicious files or content that violates laws</li>
              <li>Attempt to reverse engineer or exploit the Service</li>
              <li>Use the Service to create fraudulent or misleading resumes</li>
              <li>Share your account credentials with others</li>
              <li>Scrape, crawl, or automate access to the Service</li>
              <li>Upload resumes containing false information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">Your Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain ownership of all resume content you upload. By using the Service, you grant us a limited license to process, analyze, and optimize your content solely for the purpose of providing the Service.
            </p>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-3 mt-6">Our Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All Service features, algorithms, UI/UX design, and branding are owned by Resumefy and protected by intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">7. Data & Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your use of the Service is also governed by our <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>. Key points:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Resume files are automatically deleted after 30 days</li>
              <li>All data is encrypted in transit and at rest</li>
              <li>We do not sell or share your personal information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">8. Service Availability & Modifications</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Uptime:</strong> While we strive for 99.9% uptime, we do not guarantee uninterrupted service availability.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Changes:</strong> We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your resume will result in job offers or interviews</li>
              <li>ATS scores will guarantee applicant tracking system success</li>
              <li>AI-generated suggestions are always accurate or appropriate</li>
              <li>The Service will meet all your specific requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RESUMEFY SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages exceeding the amount you paid in the last 12 months</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Your Rights:</strong> You may terminate your account at any time by contacting support.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Our Rights:</strong> We may suspend or terminate your access if you violate these Terms or engage in fraudulent activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">12. Governing Law & Disputes</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through binding arbitration in accordance with [Arbitration Rules].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms. Material changes will be announced via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-heading font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these Terms, contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: <a href="mailto:legal@resumefy.com" className="text-emerald-600 hover:underline">legal@resumefy.com</a></li>
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
