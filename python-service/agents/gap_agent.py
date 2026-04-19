from agents.state import GraphState

def gap_agent(state: GraphState) -> GraphState:
    print("  [Gap Agent] computing skill gaps...")

    required = set(state.get("required_skills", []))
    current  = set(state.get("current_skills",  []))

    # set subtraction — skills required but not in current
    gaps = list(required - current)

    state["skill_gaps"] = gaps

    print(f"  [Gap Agent] done — {len(gaps)} gaps found: {gaps}")
    return state