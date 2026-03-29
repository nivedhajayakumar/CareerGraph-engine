import json
import os
from groq import Groq
from agents.state import GraphState

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def skill_agent(state: GraphState) -> GraphState:
    print("  [Skill Agent] normalising skills...")

    current_skills = state.get("current_skills", [])

    # if skills came in empty, return early
    if not current_skills:
        state["error"] = "No skills found in resume"
        return state

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": """You are a technical skills normaliser.
                Given a list of skills from a resume, return ONLY a JSON array
                of clean technical skills. Remove soft skills, tools like MS Word,
                and vague entries. Standardise names (e.g. 'ReactJS' → 'React').
                Return only the JSON array, nothing else."""
            },
            {
                "role": "user",
                "content": f"Normalise these skills: {json.dumps(current_skills)}"
            }
        ],
        max_tokens=500
    )

    raw = response.choices[0].message.content.strip()
    cleaned = raw.replace("```json", "").replace("```", "").strip()

    try:
        normalised = json.loads(cleaned)
        state["current_skills"] = [s.lower().strip() for s in normalised]
    except json.JSONDecodeError:
        # if parsing fails keep the original list rather than crashing
        state["current_skills"] = [s.lower().strip() for s in current_skills]

    print(f"  [Skill Agent] done — {len(state['current_skills'])} skills")
    return state