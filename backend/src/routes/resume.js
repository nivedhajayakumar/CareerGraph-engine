import express from 'express'
import upload from '../middleware/upload.js'
import { uploadResume, testRoute, setCareerGoal } from '../controllers/resumeController.js'

const router = express.Router()

router.get('/test', testRoute)
router.post('/upload', upload.single('resume'), uploadResume)
router.post('/goal', setCareerGoal)       // new — Phase 3

export default router