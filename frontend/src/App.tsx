import { useEffect, useState } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import UploadModal from "./components/UploadModal"
import Dashboard from "./pages/Dashboard"
import Landing from "./pages/Landing"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import Support from "./pages/Support"
import { analytics, initGA } from "./lib/analytics"
import { supabase } from "./lib/supabase"

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
        <Route
          path="/dashboard"
          element={<Dashboard />} // Dashboard handles its own auth check
        />
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
    </>
  )
}

export default App
