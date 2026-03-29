from typing import TypedDict, Optional

class GraphState(TypedDict):
    # set before pipeline starts
    resume_text:      str
    career_goal:      str

    # set by Skill Agent
    current_skills:   list[str]

    # set by RAG Agent
    required_skills:  list[str]

    # set by Gap Agent
    skill_gaps:       list[str]

    # set by Course Agent
    course_resources: list[dict]

    # set by Planning Agent
    roadmap:          dict

    # carries errors through the pipeline without crashing
    error:            Optional[str]