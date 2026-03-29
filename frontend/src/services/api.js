import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

// Phase 2
export const uploadResume  = (formData) =>
  API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

// Phase 3
export const setCareerGoal = (sessionId, careerGoal) =>
  API.post('/resume/goal', { sessionId, careerGoal })

// Phase 4
export const generateRoadmap = (sessionId) =>
  API.post('/resume/roadmap', { sessionId })

// Phase 5 — fetch saved roadmap
export const getRoadmap = (sessionId) =>
  API.get(`/roadmap/${sessionId}`)

// Phase 5 — mark week complete or incomplete
export const updateWeek = (sessionId, weekNumber, completed) =>
  API.patch('/roadmap/week', { sessionId, weekNumber, completed })

export default API