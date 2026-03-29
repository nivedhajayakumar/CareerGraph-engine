from fastapi import FastAPI
from pydantic import BaseModel
from rag.skills_rag import get_required_skills

app = FastAPI()

class GoalRequest(BaseModel):
    career_goal: str

class SkillsResponse(BaseModel):
    required_skills: list[str]

@app.post('/required-skills', response_model=SkillsResponse)
def required_skills(req: GoalRequest):
    skills = get_required_skills(req.career_goal)
    return { 'required_skills': skills }

@app.get('/health')
def health():
    return { 'status': 'ok' }