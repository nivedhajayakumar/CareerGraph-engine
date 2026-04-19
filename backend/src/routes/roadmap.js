import express from 'express'
import { getRoadmap, updateWeek } from '../controllers/roadmapController.js'

const router = express.Router()

router.get('/:sessionId',  getRoadmap)   // GET /api/roadmap/:sessionId
router.patch('/week',      updateWeek)   // PATCH /api/roadmap/week

export default router