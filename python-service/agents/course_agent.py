import asyncio
import os
from tavily import AsyncTavilyClient
from agents.state import GraphState

tavily = AsyncTavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))

def extract_platform(url: str) -> str:
    if "coursera"     in url: return "Coursera"
    if "udemy"        in url: return "Udemy"
    if "freecodecamp" in url: return "freeCodeCamp"
    if "youtube"      in url: return "YouTube"
    if "roadmap.sh"   in url: return "Roadmap.sh"
    if "linkedin"     in url: return "LinkedIn Learning"
    if "pluralsight"  in url: return "Pluralsight"
    if "edx"          in url: return "edX"
    return "Web"

async def fetch_courses_for_skill(skill: str) -> dict:
    query = (
        f"best free course to learn {skill} for beginners "
        f"site:coursera.org OR site:udemy.com OR site:freecodecamp.org "
        f"OR site:youtube.com OR site:roadmap.sh"
    )
    try:
        results = await tavily.search(
            query=query,
            max_results=3,
            search_depth="basic"
        )
        courses = [
            {
                "title":    r["title"],
                "url":      r["url"],
                "snippet":  r["content"][:200],
                "platform": extract_platform(r["url"])
            }
            for r in results.get("results", [])
        ]
    except Exception as e:
        print(f"  [Course Agent] Tavily error for {skill}: {e}")
        courses = []

    return { "skill": skill, "courses": courses }

def course_agent(state: GraphState) -> GraphState:
    print("  [Course Agent] fetching courses for skill gaps...")

    skill_gaps = state.get("skill_gaps", [])

    if not skill_gaps:
        state["course_resources"] = []
        return state

    # run all Tavily searches in parallel — much faster than sequential
    async def fetch_all():
        tasks = [fetch_courses_for_skill(skill) for skill in skill_gaps]
        return await asyncio.gather(*tasks)

    results = asyncio.run(fetch_all())
    state["course_resources"] = list(results)

    print(f"  [Course Agent] done — courses found for {len(results)} skills")
    return state