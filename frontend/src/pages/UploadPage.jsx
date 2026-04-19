import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadResume, setCareerGoal, generateRoadmap, getRoadmap } from '../services/api'

// steps the user moves through on this page
const STEPS = {
  UPLOAD:    'upload',
  GOAL:      'goal',
  GAPS:      'gaps',
  GENERATE:  'generate'
}

export default function UploadPage() {
  const navigate = useNavigate()

  const [step,          setStep]          = useState(STEPS.UPLOAD)
  const [file,          setFile]          = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [sessionId,     setSessionId]     = useState(
    localStorage.getItem('sessionId') || ''
  )
  const [extractedData, setExtractedData] = useState(null)
  const [goal,          setGoal]          = useState('')
  const [gapData,       setGapData]       = useState(null)

  useEffect(() => {
  const saved = localStorage.getItem('sessionId')
  if (saved && window.location.pathname === '/') {
    getRoadmap(saved)
      .then(() => navigate('/dashboard'))
      .catch(() => {}) // no roadmap yet — stay here
  }
}, [])
  // ── step 1: upload resume ────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('resume', file)
      if (sessionId) formData.append('sessionId', sessionId)

      const res = await uploadResume(formData)
      localStorage.setItem('sessionId', res.data.sessionId)
      setSessionId(res.data.sessionId)
      setExtractedData(res.data.data)
      setStep(STEPS.GOAL)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  // ── step 2: set career goal ───────────────────────────────────────────────
  const handleGoal = async () => {
    if (!goal.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await setCareerGoal(sessionId, goal)
      setGapData(res.data.data)
      setStep(STEPS.GAPS)
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // ── step 3: generate roadmap ─────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      await generateRoadmap(sessionId)
      // roadmap saved to MongoDB — navigate to dashboard to display it
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg overflow-hidden">

        {/* progress indicator */}
        <div className="flex border-b border-gray-100">
          {['Upload', 'Goal', 'Gaps', 'Generate'].map((label, i) => {
            const stepKeys = Object.values(STEPS)
            const active   = stepKeys.indexOf(step) >= i
            return (
              <div key={label} className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-300'
              }`}>
                {label}
              </div>
            )
          })}
        </div>

        <div className="p-8">

          {/* ── step: upload ── */}
          {step === STEPS.UPLOAD && (
            <div>
              <h1 className="text-xl font-semibold text-gray-800 mb-1">
                Upload your resume
              </h1>
              <p className="text-sm text-gray-400 mb-6">PDF format only</p>

              <label
                htmlFor="resume-input"
                className={`flex flex-col items-center justify-center border-2 border-dashed
                  rounded-xl p-10 cursor-pointer transition-colors mb-4 ${
                  file
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0]
                    if (f?.type === 'application/pdf') {
                      setFile(f)
                      setError('')
                    } else {
                      setError('Please select a PDF file')
                    }
                  }}
                />
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                {file
                  ? <span className="text-sm font-medium text-blue-600">{file.name}</span>
                  : <span className="text-sm text-gray-400">Click to select PDF</span>
                }
              </label>

              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm
                           font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading ? 'Extracting skills...' : 'Continue'}
              </button>
            </div>
          )}

          {/* ── step: goal ── */}
          {step === STEPS.GOAL && extractedData && (
            <div>
              <h1 className="text-xl font-semibold text-gray-800 mb-1">
                Skills extracted
              </h1>
              <p className="text-sm text-gray-400 mb-4">
                {extractedData.currentRole} · {extractedData.experienceYears}yr
              </p>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {extractedData.skills.map(skill => (
                  <span key={skill}
                    className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>

              <p className="text-sm font-medium text-gray-700 mb-2">
                What role are you targeting?
              </p>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGoal()}
                placeholder="e.g. Data Engineer, ML Engineer, DevOps"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:border-blue-400 mb-4"
              />

              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

              <button
                onClick={handleGoal}
                disabled={!goal.trim() || loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm
                           font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading ? 'Analysing...' : 'Analyse gaps'}
              </button>
            </div>
          )}

          {/* ── step: gaps ── */}
          {step === STEPS.GAPS && gapData && (
            <div>
              <h1 className="text-xl font-semibold text-gray-800 mb-1">
                Your skill gaps
              </h1>
              <p className="text-sm text-gray-400 mb-5">
                {gapData.skillGaps.length} skills to learn for {goal}
              </p>

              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  You have
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gapData.currentSkills.map(s => (
                    <span key={s}
                      className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  You need to learn
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gapData.skillGaps.map(s => (
                    <span key={s}
                      className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm
                           font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors"
              >
                {loading
                  ? 'Generating your roadmap... (~15 sec)'
                  : 'Generate my roadmap'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}