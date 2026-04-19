import json
import os
from groq import Groq
from agents.state import GraphState

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def planning_agent(state: GraphState) -> GraphState:
    print("  [Planning Agent] generating roadmap...")

    skill_gaps       = state.get("skill_gaps", [])
    course_resources = state.get("course_resources", [])
    career_goal      = state.get("career_goal", "")
    current_skills   = state.get("current_skills", [])

    # build a readable summary of available courses per skill
    courses_summary = ""
    for item in course_resources:
        skill   = item["skill"]
        courses = item["courses"]
        if courses:
            course_lines = "\n".join(
                f"    - {c['title']} ({c['platform']}): {c['url']}"
                for c in courses
            )
            courses_summary += f"\n  {skill}:\n{course_lines}"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,   # slight creativity for natural language — not 0
        messages=[
            {
                "role": "system",
                "content": """You are a career coach that creates structured learning roadmaps.
                Return ONLY valid JSON — no explanation, no markdown, no code blocks.
                The JSON must follow the exact structure specified by the user."""
            },
            {
                "role": "user",
                "content": f"""
Create a week-by-week learning roadmap for someone who wants to become a {career_goal}.

Their current skills: {', '.join(current_skills)}
Skills they need to learn: {', '.join(skill_gaps)}

Available courses for each skill gap:
{courses_summary}

Return this exact JSON structure:
{{
  "title": "roadmap title",
  "total_weeks": <number>,
  "goal": "{career_goal}",
  "weeks": [
    {{
      "week": 1,
      "focus": "main topic for this week",
      "skills": ["skill1", "skill2"],
      "tasks": [
        "specific task or milestone to complete"
      ],
      "resources": [
        {{
          "title": "course title",
          "url": "course url",
          "platform": "platform name"
        }}
      ],
      "outcome": "what the learner can do after this week"
    }}
  ]
}}

Important:
- Order skills logically — fundamentals before advanced topics
- Assign 1-2 skills per week maximum
- Use the actual course URLs provided above, do not invent URLs
- Be specific in tasks — not 'learn Python' but 'complete Python basics: variables, loops, functions'
"""
            }
        ],
        max_tokens=3000
    )

    raw     = response.choices[0].message.content.strip()
    cleaned = raw.replace("```json", "").replace("```", "").strip()

    try:
        roadmap = json.loads(cleaned)
        state["roadmap"] = roadmap
        print(f"  [Planning Agent] done — {roadmap.get('total_weeks')} week roadmap generated")
    except json.JSONDecodeError as e:
        print(f"  [Planning Agent] JSON parse error: {e}")
        state["error"] = "Failed to parse roadmap from LLM"

    return state