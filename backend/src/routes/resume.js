import express from 'express'
import upload from '../middleware/upload.js'
import {
  uploadResume,
  testRoute,
  setCareerGoal,
  generateRoadmap
} from '../controllers/resumeController.js'
import {
  getRoadmap,
  updateWeek
} from '../controllers/roadmapController.js'

const router = express.Router()

router.get('/test',                        testRoute)
router.post('/upload', upload.single('resume'), uploadResume)
router.post('/goal',                       setCareerGoal)
router.post('/roadmap',                    generateRoadmap)

export default router