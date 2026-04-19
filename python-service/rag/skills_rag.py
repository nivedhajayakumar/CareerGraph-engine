import faiss
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from collections import Counter

# load once at module import — not inside the function
# this means it loads when FastAPI starts, not on every request
print("Loading FAISS index and model...")
model    = SentenceTransformer('all-MiniLM-L6-v2')
index    = faiss.read_index('data/jobs.index')
metadata = json.load(open('data/jobs_metadata.json'))

print(f"RAG ready — {index.ntotal} job postings indexed")


def get_required_skills(career_goal: str, top_k: int = 5) -> list[str]:
    """
    Given a career goal like 'Data Engineer',
    returns a deduplicated list of skills required for that role
    based on real job postings in the index.
    """

    # embed the user's career goal using the SAME model used to build the index
    query_vector = model.encode(career_goal)
    query_np     = np.array([query_vector], dtype='float32')

    # search for top_k most similar job postings
    distances, indices = index.search(query_np, k=top_k)
    # indices[0] = array of position numbers in the index
    # distances[0] = how similar each result is (lower = more similar)

    # collect all skills from matched job postings
    all_skills = []
    for idx in indices[0]:
        if idx < len(metadata):
            job = metadata[idx]
            all_skills.extend(job['skills'])

    # count how often each skill appears across the top_k results
    skill_counts = Counter(skill.lower().strip() for skill in all_skills if skill.strip())

    # keep skills that appear in at least 2 of the matched postings
    # this filters out skills that only one unusual job listing mentioned
    required = [
        skill for skill, count
        in skill_counts.most_common(20)   # max 20 skills
        if count >= 2
    ]

    return required