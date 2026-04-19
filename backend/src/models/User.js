import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    // We'll add proper auth in Phase 5
    // For now a sessionId ties requests together
    sessionId: {
      type: String,
      required: true,
      unique: true
    },

    // Raw text extracted from the PDF
    resumeText: {
      type: String,
      default: ''
    },

    // What the LLM pulled out of the resume
    extractedData: {
      skills:           { type: [String], default: [] },
      currentRole:      { type: String,   default: '' },
      experienceYears:  { type: Number,   default: 0  },
      education:        { type: String,   default: '' }
    },

    // What the user typed as their goal
    careerGoal: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true   // automatically adds createdAt and updatedAt fields
  }
)

export default mongoose.model('User', userSchema)