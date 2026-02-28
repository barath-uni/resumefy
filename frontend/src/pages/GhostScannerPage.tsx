import { useState } from 'react'
import { Search, AlertTriangle, CheckCircle, HelpCircle, Loader2, Ghost, Zap, FileText, Clock, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'

interface GhostSignal {
  score: number
  detail: string
  max: number
}

interface ScanResult {
  success: boolean
  ghostScore: number
  verdict: 'likely_real' | 'uncertain' | 'likely_ghost'
  verdictLabel: string
  fastFacts: string[]
  signals: {
    postAge: GhostSignal
    keywordDensity: GhostSignal
    descriptionQuality: GhostSignal
    platformTrust: GhostSignal
  }
  jobTitle: string
  company: string
  postDate: string | null
  error?: string
}

const SIGNAL_META = {
  postAge: { label: 'Post Age', icon: Clock, description: 'How old is the listing?' },
  keywordDensity: { label: 'Ghost Language', icon: Ghost, description: 'Vague "talent pool" phrases' },
  descriptionQuality: { label: 'Description Detail', icon: FileText, description: 'Specific vs. generic copy' },
  platformTrust: { label: 'Platform Trust', icon: Shield, description: 'Source reliability' },
}

function getVerdictStyle(verdict: ScanResult['verdict']) {
  switch (verdict) {
    case 'likely_real':
      return {
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        ring: 'stroke-emerald-500',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        label: 'Gold Opportunity',
      }
    case 'uncertain':
      return {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        ring: 'stroke-amber-400',
        icon: HelpCircle,
        iconColor: 'text-amber-500',
        label: 'Proceed with Caution',
      }
    case 'likely_ghost':
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800 border-red-300',
        ring: 'stroke-red-500',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        label: 'Ghost Job Risk',
      }
  }
}

function getScoreColor(verdict: ScanResult['verdict']) {
  switch (verdict) {
    case 'likely_real': return '#2ec4b6'    // light_sea_green
    case 'uncertain': return '#ff9f1c'      // orange_peel
    case 'likely_ghost': return '#ef4444'   // red-500
  }
}

function getSignalColor(score: number, max: number) {
  const pct = score / max
  if (pct < 0.35) return 'bg-emerald-500'
  if (pct < 0.65) return 'bg-amber-400'
  return 'bg-red-500'
}

/** Circular score ring using SVG */
function ScoreRing({ score, verdict }: { score: number; verdict: ScanResult['verdict'] }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const filled = circumference * (score / 100)
  const color = getScoreColor(verdict)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-gray-900 leading-none">{score}</div>
        <div className="text-xs text-gray-400 mt-0.5">/ 100</div>
      </div>
    </div>
  )
}

export default function GhostScannerPage() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    setIsScanning(true)
    setResult(null)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ghost-job-scanner', {
        body: { url: trimmed },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.success) throw new Error(data?.error || 'Scan failed — the page may block automated access.')

      setResult(data as ScanResult)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsScanning(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning && url.trim()) handleScan()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ghost className="w-6 h-6 text-[#ff9f1c]" />
            <h1 className="text-2xl font-bold text-gray-900 font-heading">Ghost Job Scanner</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Paste any job board URL to get a <span className="font-medium text-gray-700">Ghost Score</span> — and 3 fast facts about the listing's legitimacy.
          </p>
        </div>

        {/* ── URL Input ── */}
        <Card className="border shadow-sm">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 text-sm"
                  disabled={isScanning}
                />
              </div>
              <Button
                onClick={handleScan}
                disabled={isScanning || !url.trim()}
                className="shrink-0 bg-[#ff9f1c] hover:bg-[#e8900a] text-white font-semibold px-5"
              >
                {isScanning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning…</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Scan Job</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Works with LinkedIn, Indeed, Greenhouse, Lever, Workday, and most company career pages.
            </p>
          </CardContent>
        </Card>

        {/* ── Error ── */}
        {error && (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Scan failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Score + Verdict */}
            {(() => {
              const style = getVerdictStyle(result.verdict)
              const VerdictIcon = style.icon
              return (
                <Card className={`border ${style.bg}`}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-center gap-6">
                      <ScoreRing score={result.ghostScore} verdict={result.verdict} />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${style.badge}`}>
                            <VerdictIcon className="w-3.5 h-3.5" />
                            {result.verdictLabel}
                          </span>
                          <span className={`text-sm font-medium ${style.text}`}>{style.label}</span>
                        </div>
                        {(result.jobTitle || result.company) && (
                          <div className="text-sm text-gray-700 truncate">
                            {result.jobTitle && <span className="font-semibold">{result.jobTitle}</span>}
                            {result.jobTitle && result.company && <span className="text-gray-400"> · </span>}
                            {result.company && <span>{result.company}</span>}
                          </div>
                        )}
                        {result.postDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {result.postDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Fast Facts */}
            <Card>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  3 Fast Facts
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 space-y-3">
                {result.fastFacts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{fact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Signal Breakdown */}
            <Card>
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Signal Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 space-y-4">
                {(Object.entries(result.signals) as [keyof typeof SIGNAL_META, GhostSignal][]).map(([key, signal]) => {
                  const meta = SIGNAL_META[key]
                  const MetaIcon = meta.icon
                  const pct = Math.round((signal.score / signal.max) * 100)
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MetaIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {signal.score}/{signal.max}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getSignalColor(signal.score, signal.max)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{signal.detail}</p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <p className="text-xs text-center text-muted-foreground pb-4">
              Ghost Score is a heuristic estimate — not a guarantee. Always verify by checking the company's official careers page.
            </p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!result && !error && !isScanning && (
          <div className="text-center py-12 space-y-3">
            <Ghost className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-muted-foreground">Paste a job URL above to check if it's real or a ghost listing.</p>
          </div>
        )}
      </div>
    </div>
  )
}
