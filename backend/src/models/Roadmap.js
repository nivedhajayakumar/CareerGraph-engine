import mongoose from 'mongoose'

const weekSchema = new mongoose.Schema({
  week:      Number,
  focus:     String,
  skills:    [String],
  tasks:     [String],
  resources: [{ title: String, url: String, platform: String }],
  outcome:   String,
  completed: { type: Boolean, default: false }   // for Phase 5 progress tracking
})

const roadmapSchema = new mongoose.Schema(
  {
    sessionId:       { type: String, required: true },
    title:           String,
    goal:            String,
    totalWeeks:      Number,
    weeks:           [weekSchema],
    courseResources: [mongoose.Schema.Types.Mixed],
    skillGaps:       [String],
    requiredSkills:  [String]
  },
  { timestamps: true }
)

export default mongoose.model('Roadmap', roadmapSchema)