import Roadmap from '../models/Roadmap.js'

// GET /api/roadmap/:sessionId
// fetches the saved roadmap for a session
export const getRoadmap = async (req, res, next) => {
  try {
    const { sessionId } = req.params

    const roadmap = await Roadmap.findOne({ sessionId })

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        error: 'No roadmap found. Generate one first.'
      })
    }

    res.json({ success: true, roadmap })

  } catch (err) {
    next(err)
  }
}

// PATCH /api/roadmap/week
// marks a single week as complete or incomplete
export const updateWeek = async (req, res, next) => {
  try {
    const { sessionId, weekNumber, completed } = req.body

    if (!sessionId || weekNumber === undefined) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and weekNumber required'
      })
    }

    // find the roadmap and update the specific week's completed flag
    const roadmap = await Roadmap.findOneAndUpdate(
      {
        sessionId,
        'weeks.week': weekNumber        // match the specific week object
      },
      {
        $set: { 'weeks.$.completed': completed }  // $ = the matched week
      },
      { new: true }
    )

    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' })
    }

    // calculate overall progress
    const total     = roadmap.weeks.length
    const done      = roadmap.weeks.filter(w => w.completed).length
    const progress  = Math.round((done / total) * 100)

    res.json({
      success: true,
      progress,
      completedWeeks: done,
      totalWeeks:     total
    })

  } catch (err) {
    next(err)
  }
}