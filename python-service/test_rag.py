from rag.skills_rag import get_required_skills

test_goals = [
    "Data Engineer",
    "Frontend Developer",
    "Machine Learning Engineer",
    "DevOps Engineer"
]

for goal in test_goals:
    skills = get_required_skills(goal)
    print(f"\n{goal}:")
    print(f"  {skills}")