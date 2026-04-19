import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()   # load .env before importing agents that need API keys

from rag.skills_rag import get_required_skills
from agents.graph   import roadmap_graph

app = FastAPI()

# ── existing Phase 3 endpoint ─────────────────────────────────────────────────
class GoalRequest(BaseModel):
    career_goal: str

@app.post("/required-skills")
def required_skills(req: GoalRequest):
    skills = get_required_skills(req.career_goal)
    return { "required_skills": skills }

# ── new Phase 4 endpoint ──────────────────────────────────────────────────────
class RoadmapRequest(BaseModel):
    resume_text:    str
    career_goal:    str
    current_skills: list[str]
    skill_gaps:     list[str]

@app.post("/generate-roadmap")
def generate_roadmap(req: RoadmapRequest):
    print(f"\nGenerating roadmap for goal: {req.career_goal}")

    # initial state — pre-populate what we already know from Phases 2 and 3
    initial_state = {
        "resume_text":      req.resume_text,
        "career_goal":      req.career_goal,
        "current_skills":   req.current_skills,
        "required_skills":  [],
        "skill_gaps":       req.skill_gaps,
        "course_resources": [],
        "roadmap":          {},
        "error":            None
    }

    # run the graph — blocks until all agents complete
    final_state = roadmap_graph.invoke(initial_state)

    if final_state.get("error"):
        raise HTTPException(status_code=500, detail=final_state["error"])

    return {
        "success":          True,
        "roadmap":          final_state["roadmap"],
        "course_resources": final_state["course_resources"],
        "skill_gaps":       final_state["skill_gaps"],
        "required_skills":  final_state["required_skills"]
    }

@app.get("/health")
def health():
    return { "status": "ok" }