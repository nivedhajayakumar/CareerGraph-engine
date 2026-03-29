import { v4 as uuidv4 } from 'uuid'
import Groq from "groq-sdk"
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import User from '../models/User.js'
import Roadmap from '../models/Roadmap.js'

// ─── Groq client ─────────────────────────────────────────────────────────────
const groq = new Groq({
  apiKey: GROQ_API_KEY
})

// ─── helper: extract text from PDF buffer ────────────────────────────────────
async function extractTextFromPDF(buffer) {
  const uint8Array = new Uint8Array(buffer)
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }
  return fullText
}

// ─── helper: safe JSON parse ──────────────────────────────────────────────────
function safeParseJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    try {
      const cleaned = text.replace(/```json|```/g, '').trim()
      return JSON.parse(cleaned)
    } catch {
      throw new Error("AI returned invalid JSON:\n" + text)
    }
  }
}

// ─── helper: extract skills via Groq ─────────────────────────────────────────
async function extractSkillsFromText(resumeText) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "You output only JSON. No explanation. No markdown."
      },
      {
        role: "user",
        content: `Extract structured data from this resume and return ONLY valid JSON:
{
  "skills": ["list of technical skills only"],
  "currentRole": "most recent job title or student",
  "experienceYears": 0,
  "education": "highest degree and field"
}

Resume:
${resumeText}`
      }
    ]
  })

  const text = completion.choices[0].message.content
  return safeParseJSON(text)
}

// ─── helper: compute skill gaps ───────────────────────────────────────────────
function computeGaps(requiredSkills, currentSkills) {
  const current = new Set(currentSkills.map(s => s.toLowerCase().trim()))
  return requiredSkills.filter(s => !current.has(s.toLowerCase().trim()))
}

// ─── POST /api/resume/upload ──────────────────────────────────────────────────
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const resumeText = await extractTextFromPDF(req.file.buffer)

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from PDF. Is it a scanned image?'
      })
    }

    const extractedData = await extractSkillsFromText(resumeText)
    const sessionId     = req.body.sessionId || uuidv4()

    const user = await User.findOneAndUpdate(
      { sessionId },
      { resumeText, extractedData, sessionId },
      { upsert: true, returnDocument: 'after' }
    )

    res.json({
      success:   true,
      sessionId: user.sessionId,
      data:      extractedData
    })

  } catch (err) {
    console.error("Upload error:", err.message)
    next(err)
  }
}

// ─── POST /api/resume/goal ────────────────────────────────────────────────────
export const setCareerGoal = async (req, res, next) => {
  try {
    const { sessionId, careerGoal } = req.body

    if (!sessionId || !careerGoal) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and careerGoal are required'
      })
    }

    // fetch required skills from Python RAG service
    const pythonRes = await fetch('http://localhost:8000/required-skills', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ career_goal: careerGoal })
    })

    if (!pythonRes.ok) {
      throw new Error('Failed to fetch required skills from Python service')
    }

    const pythonData     = await pythonRes.json()
    const requiredSkills = pythonData.required_skills || []

    // get current user skills
    const user         = await User.findOne({ sessionId })
    const currentSkills = user?.extractedData?.skills || []

    // compute gaps
    const skillGaps = computeGaps(requiredSkills, currentSkills)

    // save to MongoDB
    await User.findOneAndUpdate(
      { sessionId },
      { careerGoal, requiredSkills, skillGaps },
      { returnDocument: 'after' }
    )

    res.json({
      success: true,
      data: {
        careerGoal,
        requiredSkills,
        skillGaps,
        currentSkills
      }
    })

  } catch (err) {
    console.error("setCareerGoal error:", err.message)
    next(err)
  }
}

// ─── POST /api/resume/roadmap ─────────────────────────────────────────────────
export const generateRoadmap = async (req, res, next) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId required' })
    }

    const user = await User.findOne({ sessionId })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Upload resume first.'
      })
    }

    // ── safety check: recompute skillGaps if missing ──────────────────────────
    // this handles the case where setCareerGoal was called but skillGaps
    // didn't save correctly, or the user skipped to generate directly
    let skillGaps = user.skillGaps || []

    if (skillGaps.length === 0 && user.requiredSkills?.length > 0) {
      console.log("skillGaps empty — recomputing from requiredSkills...")
      skillGaps = computeGaps(
        user.requiredSkills,
        user.extractedData?.skills || []
      )
      // save the recomputed gaps
      await User.findOneAndUpdate(
        { sessionId },
        { skillGaps },
        { returnDocument: 'after' }
      )
    }

    // ── if still empty, fetch required skills fresh from Python ──────────────
    if (skillGaps.length === 0 && user.careerGoal) {
      console.log("Still empty — fetching required skills fresh from Python...")
      try {
        const ragRes = await fetch('http://localhost:8000/required-skills', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ career_goal: user.careerGoal })
        })
        const ragData      = await ragRes.json()
        const requiredFresh = ragData.required_skills || []
        skillGaps           = computeGaps(requiredFresh, user.extractedData?.skills || [])

        await User.findOneAndUpdate(
          { sessionId },
          { requiredSkills: requiredFresh, skillGaps },
          { returnDocument: 'after' }
        )
      } catch (e) {
        console.error("Fresh RAG fetch failed:", e.message)
      }
    }

    console.log(`Sending to Python — goal: ${user.careerGoal}, gaps: ${skillGaps}`)

    // ── call Python LangGraph service ─────────────────────────────────────────
    const pythonRes = await fetch('http://localhost:8000/generate-roadmap', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text:    user.resumeText    || '',
        career_goal:    user.careerGoal    || '',
        current_skills: user.extractedData?.skills || [],
        skill_gaps:     skillGaps
      })
    })

    if (!pythonRes.ok) {
      const errorBody    = await pythonRes.json().catch(() => ({ detail: 'Python service error' }))
      const errorMessage = typeof errorBody.detail === "string"
        ? errorBody.detail
        : JSON.stringify(errorBody.detail, null, 2)
      throw Object.assign(new Error(errorMessage), { statusCode: 500 })
    }

    const pythonData = await pythonRes.json()

    // ── save roadmap to MongoDB ───────────────────────────────────────────────
    const roadmap = await Roadmap.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        title:           pythonData.roadmap.title,
        goal:            pythonData.roadmap.goal,
        totalWeeks:      pythonData.roadmap.total_weeks,
        weeks:           pythonData.roadmap.weeks,
        courseResources: pythonData.course_resources,
        skillGaps:       pythonData.skill_gaps,
        requiredSkills:  pythonData.required_skills
      },
      { upsert: true, returnDocument: 'after' }
    )

    res.json({ success: true, roadmap })

  } catch (err) {
    console.error("🔥 generateRoadmap error:", err.message)
    next(err)
  }
}

// ─── GET /api/resume/test ─────────────────────────────────────────────────────
export const testRoute = (req, res) => {
  res.json({ success: true, message: 'Resume route working' })
}