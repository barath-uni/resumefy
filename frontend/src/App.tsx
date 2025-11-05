import { useEffect, useState } from "react"
import { Routes, Route, useNavigate, Navigate } from "react-router-dom"
import UploadModal from "./components/UploadModal"
import DashboardPage from "./pages/DashboardPage"
import MyResumesPage from "./pages/MyResumesPage"
import TailorResumePage from "./pages/TailorResumePage"
import TailoringPageV2 from "./pages/TailoringPageV2"
import GeneratedResumesPage from "./pages/GeneratedResumesPage"
import BillingPage from "./pages/BillingPage"
import BillingDetailsPage from "./pages/BillingDetailsPage"
import PaymentSuccessPage from "./pages/PaymentSuccessPage"
import Landing from "./pages/Landing"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import Support from "./pages/Support"
import AppLayout from "./components/layout/AppLayout"
import { analytics, initGA } from "./lib/analytics"
import { supabase } from "./lib/supabase"
import { Toaster } from "./components/ui/toaster"

function App() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 [App] Checking auth state...')
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setIsLoading(false)
      console.log('✅ [App] Auth state:', !!session ? 'authenticated' : 'not authenticated')
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 [App] Auth state changed:', _event)
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  // Initialize analytics on app load
  useEffect(() => {
    initGA()
    analytics.trackLandingPageView()
  }, [])

  console.log('🎨 [App] Rendering...', {
    path: window.location.pathname,
    hash: window.location.hash,
    isAuthenticated,
    isLoading
  })

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              isAuthenticated={isAuthenticated}
            />
          }
        />

        {/* Redirect /dashboard to /app/dashboard */}
        <Route
          path="/dashboard"
          element={<Navigate to="/app/dashboard" replace />}
        />

        {/* V2.5 App Routes with AppLayout */}
        <Route
          path="/app/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/my-resumes"
          element={
            <AppLayout>
              <MyResumesPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/tailor-resume"
          element={
            <AppLayout>
              <TailorResumePage />
            </AppLayout>
          }
        />
        <Route
          path="/app/tailor/:resumeId"
          element={
            <AppLayout>
              <TailoringPageV2 />
            </AppLayout>
          }
        />
        <Route
          path="/app/generated-resumes/:resumeId"
          element={
            <AppLayout>
              <GeneratedResumesPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/billing"
          element={<BillingPage />}
        />
        <Route
          path="/app/billing-details"
          element={
            <AppLayout>
              <BillingDetailsPage />
            </AppLayout>
          }
        />
        <Route
          path="/app/billing/success"
          element={<PaymentSuccessPage />}
        />

        {/* Static Pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<Support />} />
      </Routes>

      {/* Upload Modal - Show on Landing page, handle auth inside modal */}
      {window.location.pathname === '/' && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
      <Toaster />
    </>
  )
}

export default App
