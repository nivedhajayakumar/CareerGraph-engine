# 🚀 AI-Powered Personalized Career Roadmap Generator

> Upload your resume. Pick a goal. Get a week-by-week learning plan with real courses — powered by RAG, FAISS, and a multi-agent LangGraph pipeline.

---

## 📸 Overview

Most people don't know what to learn next. They Google randomly, start 10 courses, finish none, and make no real progress toward their career goal.

This app solves that. It reads your resume, understands what you already know, finds what the job market actually requires for your target role, and generates a structured, personalized roadmap with real course links — in under 15 seconds.

---

## ✨ Features

- 📄 **Resume Parsing** — Upload a PDF and extract skills, role, experience, and education automatically
- 🎯 **Career Goal Analysis** — Semantic search over 2000+ real job postings to find what your target role truly requires
- 🔍 **Skill Gap Detection** — Deterministic set subtraction: required skills minus your skills = your exact gaps
- 📚 **Real Course Recommendations** — Tavily Search fetches live links from Coursera, Udemy, freeCodeCamp, YouTube per gap skill
- 🗺️ **Week-by-Week Roadmap** — LLM generates a structured, ordered learning plan with tasks, outcomes, and course links
- 💾 **Persistent Progress** — Roadmaps saved to MongoDB, progress tracked per user session
- ⚡ **Fast** — Only 2 LLM calls in the entire pipeline. Everything else is deterministic or local

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│              Upload · Goal Input · Roadmap View              │
└─────────────────────┬───────────────────────────────────────┘
                      │ axios (REST)
┌─────────────────────▼───────────────────────────────────────┐
│                   Node.js + Express                          │
│         multer · pdf-parse · routes · controllers            │
└─────────────────────┬───────────────────────────────────────┘
                      │ fetch (REST)
┌─────────────────────▼───────────────────────────────────────┐
│              Python FastAPI Microservice                      │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              LangGraph Pipeline                       │  │
│   │                                                       │  │
│   │  Skill Agent → RAG Agent → Gap Agent                 │  │
│   │       → Course Agent → Planning Agent                │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   FAISS Index          Tavily API        Groq LLM           │
│   (local vector DB)    (course search)   (2 calls only)     │
└─────────────────────┬───────────────────────────────────────┘
                      │ mongoose
┌─────────────────────▼───────────────────────────────────────┐
│                    MongoDB Atlas                              │
│         Users · Skills · Roadmaps · Progress                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent Pipeline

Each agent does exactly one job. State flows through all of them sequentially.

```
GraphState enters
       │
       ▼
┌─────────────┐     Groq LLM (call 1)
│ Skill Agent │  →  Normalises raw skills from resume
└──────┬──────┘
       │
       ▼
┌─────────────┐     FAISS + sentence-transformers (local)
│  RAG Agent  │  →  Semantic search over 2000+ job postings
└──────┬──────┘
       │
       ▼
┌─────────────┐     Pure Python set subtraction (no LLM)
│  Gap Agent  │  →  required_skills − current_skills = gaps
└──────┬──────┘
       │
       ▼
┌──────────────┐    Tavily async parallel search
│ Course Agent │  →  Real course links per gap skill
└──────┬───────┘
       │
       ▼
┌─────────────────┐  Groq LLM (call 2)
│ Planning Agent  │  →  Week-by-week structured roadmap
└─────────────────┘
       │
       ▼
  Roadmap JSON → MongoDB → React
```

### Why only 2 LLM calls?

| Step | Tool used | Why not LLM? |
|---|---|---|
| Text extraction | pdfjs-dist | Deterministic, free, instant |
| Skill normalisation | Groq LLM ✓ | Needs language understanding |
| Required skills | FAISS + embeddings | Real job data, no hallucination |
| Gap analysis | Python set math | 100% accurate, no creativity needed |
| Course search | Tavily API | Real URLs, LLM would hallucinate links |
| Roadmap generation | Groq LLM ✓ | Genuine language generation needed |

---

## 🛠️ Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client for API calls |
| React Router | Client-side navigation |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express | REST API server |
| multer | PDF file upload handling |
| pdfjs-dist | PDF bytes → plain text |
| Mongoose | MongoDB schema and queries |
| uuid | Session management |

### AI / Python Service
| Tool | Purpose |
|---|---|
| FastAPI | Python microservice exposing agents |
| LangGraph | Multi-agent state graph orchestration |
| LangChain Core | Prompt templates and output parsers |
| Groq LLM (llama-3.3-70b) | Skill extraction and roadmap generation |
| FAISS (faiss-cpu) | Vector similarity search |
| sentence-transformers | Local text embeddings (all-MiniLM-L6-v2) |
| Tavily API | Real-time course search |
| pandas + numpy | Dataset processing |

### Database & Deployment
| Tool | Purpose |
|---|---|
| MongoDB Atlas | Cloud document database |
| AWS EC2 | Backend hosting |
| AWS S3 + CloudFront | Frontend hosting |
| Docker | Containerisation |

---

## 📁 Project Structure

```
career-roadmap/
│
├── frontend/                      # React + Vite
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Home, Dashboard
│   │   ├── services/
│   │   │   └── api.js             # Axios instance + API calls
│   │   └── App.jsx
│   ├── .env                       # VITE_API_URL
│   └── tailwind.config.js
│
├── backend/                       # Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   │   └── resumeController.js
│   │   ├── middleware/
│   │   │   ├── upload.js          # multer config
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js            # Skills, resume data
│   │   │   └── Roadmap.js         # Week schema, progress
│   │   └── routes/
│   │       └── resume.js
│   ├── server.js                  # Entry point
│   └── .env                       # MONGO_URI, GROQ_API_KEY
│
└── python-service/                # FastAPI + LangGraph
    ├── agents/
    │   ├── state.py               # GraphState TypedDict
    │   ├── skill_agent.py         # LLM call 1
    │   ├── rag_agent.py           # FAISS retrieval
    │   ├── gap_agent.py           # Set subtraction
    │   ├── course_agent.py        # Tavily async search
    │   ├── planning_agent.py      # LLM call 2
    │   └── graph.py               # LangGraph wiring
    ├── rag/
    │   └── skills_rag.py          # FAISS query function
    ├── data/
    │   ├── jobs.csv               # Kaggle dataset
    │   ├── jobs.index             # FAISS binary index
    │   └── jobs_metadata.json     # Position → skills map
    ├── build_index.py             # One-time index builder
    ├── main.py                    # FastAPI app
    ├── requirements.txt
    └── .env                       # GROQ_API_KEY, TAVILY_API_KEY
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB Atlas account (free tier)
- Groq API key — [console.groq.com](https://console.groq.com)
- Tavily API key — [tavily.com](https://tavily.com)

---

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/career-roadmap.git
cd career-roadmap
```

---

### 2. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

---

### 3. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
```

```bash
npm run dev
```

---

### 4. Python service setup

```bash
cd python-service
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `python-service/.env`:
```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

---

### 5. Download the dataset and build FAISS index

Download the job descriptions dataset from Kaggle:
[Job Description Dataset](https://www.kaggle.com/datasets/ravindrasinghrana/job-description-dataset)

Place the CSV at `python-service/data/jobs.csv`, then run:

```bash
cd python-service
python build_index.py
```

This runs once and generates:
- `data/jobs.index` — FAISS binary vector index
- `data/jobs_metadata.json` — position → job skills map

---

### 6. Start the Python service

```bash
uvicorn main:app --reload --port 8000
```

---

### 7. Run everything together

Open 3 terminals:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd python-service && uvicorn main:app --reload --port 8000

# Terminal 3
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔄 How to use

1. **Upload your resume** — drag and drop a PDF
2. **See your extracted skills** — role, experience, education pulled automatically
3. **Enter your career goal** — e.g. "Data Engineer", "ML Engineer", "DevOps"
4. **View your skill gaps** — what you have vs what the market requires
5. **Generate your roadmap** — click once, wait ~15 seconds
6. **Follow the plan** — week-by-week with real course links attached

---

## 🧠 How the RAG Pipeline Works

```
BUILD TIME (once):

Job posting text  →  sentence-transformers  →  384-dim vector
                                                     ↓
                                              FAISS index (binary)
                                              metadata.json (text)

QUERY TIME (per user):

"Data Engineer"  →  same model  →  query vector
                                        ↓
                                  FAISS.search(k=5)
                                        ↓
                              5 closest job postings
                                        ↓
                              collect + count skills
                                        ↓
                         required_skills = ["python","spark","kafka"]
```

FAISS never stores text — only vectors. The metadata file is the bridge that maps vector positions back to readable skill lists.

---

## 📊 Why this architecture

| Approach | LLM calls | Cost per user | Hallucination risk |
|---|---|---|---|
| All-LLM (naive) | 5–7 | ~$0.25 | High |
| This system | 2 | ~$0.03 | Low |

Every step that doesn't need language understanding uses a deterministic or retrieval-based tool instead. The LLM is only called where genuine language generation is required — skill normalisation and roadmap writing.

---

## 🗺️ Roadmap (Project Phases)

- [x] Phase 1 — React + Express + MongoDB foundation
- [x] Phase 2 — PDF upload + skill extraction via Groq LLM
- [x] Phase 3 — FAISS index + RAG skill retrieval
- [x] Phase 4 — LangGraph multi-agent pipeline + Tavily course search
- [ ] Phase 5 — Roadmap UI polish + progress tracking
- [ ] Phase 6 — Docker + AWS EC2 + S3 deployment

---

## 🌐 API Reference

### Express (Node.js) — port 5000

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| POST | `/api/resume/upload` | Upload PDF, extract skills |
| POST | `/api/resume/goal` | Set career goal, compute gaps |
| POST | `/api/resume/roadmap` | Trigger full roadmap generation |

### FastAPI (Python) — port 8000

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |
| POST | `/required-skills` | FAISS skill retrieval |
| POST | `/generate-roadmap` | Run full LangGraph pipeline |

---

## 🔐 Environment Variables

### backend/.env
```env
PORT=5000
MONGO_URI=mongodb+srv://...
GROQ_API_KEY=gsk_...
```

### python-service/.env
```env
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
```

### frontend/.env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes please open an issue first.

1. Fork the repo
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request


## 👤 Author

Built by NIVEDHA J

> ⭐ If this project helped you, consider giving it a star!
