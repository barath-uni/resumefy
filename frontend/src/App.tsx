import { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"
import UploadModal from "./components/UploadModal"
import Dashboard from "./pages/Dashboard"
import Landing from "./pages/Landing"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import Support from "./pages/Support"
import { analytics, initGA } from "./lib/analytics"

function App() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Initialize analytics on app load
  useEffect(() => {
    initGA()
    analytics.trackLandingPageView()
  }, [])

  // Check if we're on dashboard route (legacy support)
  const urlParams = new URLSearchParams(window.location.search)
  const isDashboard = urlParams.has('token')

  if (isDashboard) {
    return (
      <>
        <Dashboard />
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing onOpenUploadModal={() => setIsUploadModalOpen(true)} />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<Support />} />
      </Routes>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  )
}

export default App
