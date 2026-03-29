import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoadmap, updateWeek } from '../services/api'

export default function Dashboard() {
  const navigate  = useNavigate()
  const sessionId = localStorage.getItem('sessionId')

  const [roadmap,  setRoadmap]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [progress, setProgress] = useState(0)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!sessionId) {
      navigate('/')
      return
    }
    fetchRoadmap()
  }, [])

  const fetchRoadmap = async () => {
    try {
      const res = await getRoadmap(sessionId)
      setRoadmap(res.data.roadmap)
      calculateProgress(res.data.roadmap.weeks)
    } catch (err) {
      setError('Could not load roadmap. Go back and generate one.')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (weeks) => {
    if (!weeks?.length) return
    const done = weeks.filter(w => w.completed).length
    setProgress(Math.round((done / weeks.length) * 100))
  }

  const handleWeekToggle = async (weekNumber, currentlyCompleted) => {
    setUpdating(weekNumber)
    try {
      const res = await updateWeek(sessionId, weekNumber, !currentlyCompleted)
      setRoadmap(prev => ({
        ...prev,
        weeks: prev.weeks.map(w =>
          w.week === weekNumber
            ? { ...w, completed: !currentlyCompleted }
            : w
        )
      }))
      setProgress(res.data.progress)
    } catch (err) {
      console.error('Failed to update week:', err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-gray-400">Loading your roadmap...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm"
        >
          Go back
        </button>
      </div>
    </div>
  )

  const completedCount = roadmap?.weeks?.filter(w => w.completed).length || 0
  const totalWeeks     = roadmap?.weeks?.length || 0

  return (
    <div className="min-h-screen bg-slate-50">

      {/* header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-800">{roadmap?.title}</h1>
            <p className="text-xs text-gray-400">{roadmap?.goal} · {totalWeeks} weeks</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            New resume
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-2xl font-semibold text-gray-800">{progress}%</p>
              <p className="text-sm text-gray-400">
                {completedCount} of {totalWeeks} weeks completed
              </p>
            </div>
            {progress === 100 && (
              <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">
                Roadmap complete
              </span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* skill gaps summary */}
        {roadmap?.skillGaps?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              Skills you're learning
            </p>
            <div className="flex flex-wrap gap-1.5">
              {roadmap.skillGaps.map(skill => (
                <span key={skill}
                  className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* week cards */}
        <div className="space-y-4">
          {roadmap?.weeks?.map(week => (
            <WeekCard
              key={week.week}
              week={week}
              onToggle={handleWeekToggle}
              isUpdating={updating === week.week}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

// ── WeekCard ─────────────────────────────────────────────────────────────────
function WeekCard({ week, onToggle, isUpdating }) {
  const [expanded, setExpanded] = useState(!week.completed)

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 ${
      week.completed ? 'border-green-100 opacity-75' : 'border-gray-100'
    }`}>

      {/* header row */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* complete toggle button */}
        <button
          onClick={e => {
            e.stopPropagation()
            onToggle(week.week, week.completed)
          }}
          disabled={isUpdating}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                      flex-shrink-0 transition-all ${
            week.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-purple-400'
          } ${isUpdating ? 'opacity-50' : ''}`}
        >
          {week.completed && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Week {week.week}
            </span>
            {week.completed && (
              <span className="text-xs text-green-600">Completed</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">{week.focus}</p>
        </div>

        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={`text-gray-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* expanded body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">

          {/* skill chips */}
          {week.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {week.skills.map(skill => (
                <span key={skill}
                  className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* tasks */}
          {week.tasks?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Tasks</p>
              <ul className="space-y-1.5">
                {week.tasks.map((task, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-purple-300 mt-0.5 flex-shrink-0">›</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* outcome */}
          {week.outcome && (
            <div className="bg-amber-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-amber-600 font-medium mb-0.5">By end of week</p>
              <p className="text-sm text-amber-800">{week.outcome}</p>
            </div>
          )}

          {/* resources */}
          {week.resources?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Resources</p>
              <div className="space-y-2">
                {week.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100
                               hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md
                                     flex-shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700
                                     transition-colors">
                      {r.platform}
                    </span>
                    <span className="text-sm text-blue-600 truncate group-hover:underline">
                      {r.title}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      className="text-gray-300 flex-shrink-0 ml-auto">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}