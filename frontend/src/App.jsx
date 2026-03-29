import { useState } from 'react'
import API from './services/api'

export default function App() {
  const [file,       setFile]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState('')
  const [sessionId,  setSessionId]  = useState(
    localStorage.getItem('sessionId') || ''
  )

  const [goal,        setGoal]        = useState('')
  const [goalResult,  setGoalResult]  = useState(null)
  const [goalLoading, setGoalLoading] = useState(false)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setError('')
    } else {
      setError('Please select a PDF file')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)
    setGoalResult(null) // reset goal results

    try {
      const formData = new FormData()
      formData.append('resume', file)
      if (sessionId) formData.append('sessionId', sessionId)

      const res = await API.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      localStorage.setItem('sessionId', res.data.sessionId)
      setSessionId(res.data.sessionId)
      setResult(res.data.data)

    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }
  const handleGoalSubmit = async () => {
    if (!goal || !sessionId) return

    setGoalLoading(true)

    try {
      const res = await API.post('/resume/goal', {
        sessionId,
        careerGoal: goal
      })

      setGoalResult(res.data.data)

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyse goal')
    } finally {
      setGoalLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">

        <h1 className="text-2xl font-semibold text-gray-800 mb-1">
          Career Roadmap Generator
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Upload your resume to extract your skills
        </p>

        {/* upload area */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="resume-input"
          />
          <label
            htmlFor="resume-input"
            className="cursor-pointer text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            {file
              ? <span className="text-blue-600 font-medium">{file.name}</span>
              : 'Click to select your resume PDF'
            }
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors mb-6"
        >
          {loading ? 'Extracting skills...' : 'Upload and extract skills'}
        </button>

        {/* results */}
        {result && (
          <div className="border-t border-gray-100 pt-6">

            {/* USER INFO */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-800">{result.currentRole}</p>
                <p className="text-sm text-gray-400">
                  {result.experienceYears} year{result.experienceYears !== 1 ? 's' : ''} experience
                </p>
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                Extracted
              </span>
            </div>

            {result.education && (
              <p className="text-sm text-gray-500 mb-4">{result.education}</p>
            )}

            {/* SKILLS */}
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              Skills found ({result.skills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {result.skills.map(skill => (
                <span
                  key={skill}
                  className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* ✅ PHASE 3 — CAREER GOAL */}
            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Career goal
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="e.g. Data Engineer, ML Engineer"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:border-blue-400"
                />

                <button
                  onClick={handleGoalSubmit}
                  disabled={!goal || goalLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm
                             hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {goalLoading ? 'Analysing...' : 'Analyse'}
                </button>
              </div>

              {/* RESULTS */}
              {goalResult && (
                <div className="mt-4 space-y-4">

                  {/* REQUIRED SKILLS */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                      Required skills ({goalResult.requiredSkills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {goalResult.requiredSkills.map(skill => (
                        <span key={skill} className="bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SKILL GAPS */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                      Your skill gaps ({goalResult.skillGaps.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {goalResult.skillGaps.map(skill => (
                        <span key={skill} className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}