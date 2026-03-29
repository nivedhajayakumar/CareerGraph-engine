import { v4 as uuidv4 } from 'uuid'
import Groq from "groq-sdk"
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import User from '../models/User.js'
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
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText
}

// ─── helper: safe JSON parse ─────────────────────────────────────────────────
function safeParseJSON(text) {
  try {
    return JSON.parse(text)
  } catch (err) {
    try {
      const cleaned = text.replace(/```json|```/g, '').trim()
      return JSON.parse(cleaned)
    } catch (e) {
      throw new Error("AI returned invalid JSON:\n" + text)
    }
  }
}

// ─── helper: extract skills via Groq ─────────────────────────────────────────
async function extractSkillsFromText(resumeText) {
  const prompt = `
You are a resume parser. Extract structured data and return ONLY valid JSON.

{
  "skills": ["list of technical skills"],
  "currentRole": "most recent job title",
  "experienceYears": number,
  "education": "highest degree and field"
}

Resume:
${resumeText}
`

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // 🔥 best balance
    messages: [
      { role: "system", content: "You output only JSON. No explanation." },
      { role: "user", content: prompt }
    ],
    temperature: 0,
  })

  const text = completion.choices[0].message.content

  return safeParseJSON(text)
}
export const setCareerGoal = async (req, res, next) => {
  try {
    const { sessionId, careerGoal } = req.body

    if (!sessionId || !careerGoal) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and careerGoal are required'
      })
    }

    // call Python RAG service to get required skills
    const pythonRes = await fetch('http://localhost:8000/required-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ career_goal: careerGoal })
    })

    const pythonData = await pythonRes.json()
    const requiredSkills = pythonData.required_skills

    // compute gap = required - current
    const user = await User.findOne({ sessionId })
    const currentSkills = user?.extractedData?.skills?.map(s => s.toLowerCase()) || []
    const skillGaps = requiredSkills.filter(s => !currentSkills.includes(s.toLowerCase()))

    // save everything
    const updated = await User.findOneAndUpdate(
      { sessionId },
      { careerGoal, requiredSkills, skillGaps },
      { new: true }
    )

    res.json({
      success: true,
      data: {
        careerGoal,
        requiredSkills,
        skillGaps,
        currentSkills: user?.extractedData?.skills || []
      }
    })

  } catch (err) {
    next(err)
  }
}

// ─── route handler: POST /api/resume/upload ───────────────────────────────────
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      })
    }

    // Step 1: PDF → text
    const resumeText = await extractTextFromPDF(req.file.buffer)

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from PDF. Is it a scanned image?'
      })
    }

    // Step 2: text → structured JSON
    const extractedData = await extractSkillsFromText(resumeText)

    // Step 3: save in MongoDB
    const sessionId = req.body.sessionId || uuidv4()

    const user = await User.findOneAndUpdate(
      { sessionId },
      { resumeText, extractedData, sessionId },
      { upsert: true, new: true }
    )

    // Step 4: response
    res.json({
      success: true,
      sessionId: user.sessionId,
      data: extractedData
    })

  } catch (err) {
    console.error("Upload error:", err.message)

    res.status(500).json({
      success: false,
      error: err.message || "Something went wrong"
    })
  }
}

// ─── test route ──────────────────────────────────────────────────────────────
export const testRoute = (req, res) => {
  res.json({ success: true, message: 'Resume route working' })
}