from agents.state import GraphState
from rag.skills_rag import get_required_skills

def rag_agent(state: GraphState) -> GraphState:
    print("  [RAG Agent] fetching required skills...")

    career_goal = state.get("career_goal", "")

    if not career_goal:
        state["error"] = "No career goal provided"
        return state

    required = get_required_skills(career_goal, top_k=5)
    state["required_skills"] = required

    print(f"  [RAG Agent] done — {len(required)} required skills found")
    return state