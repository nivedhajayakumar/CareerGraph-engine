import multer from 'multer'

const upload = multer({
  // memoryStorage means the file never touches the disk
  // it lives as a Buffer in req.file.buffer(RAM) — perfect for passing to pdf-parse
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024   // 5MB max — resumes are never this big
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)    // accept the file
    } else {
      // reject with a proper error — goes to your errorHandler
      cb(Object.assign(new Error('Only PDF files are allowed'), { statusCode: 400 }))
    }
  }
})

export default upload