import pandas as pd
import numpy as np
import faiss
import json
import os
from sentence_transformers import SentenceTransformer

print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Loading dataset...")
df = pd.read_csv('data/job_market.csv')

# keep only required columns (cleaner + faster)
df = df[['job_title', 'skills']]

# drop missing values
df = df.dropna(subset=['job_title', 'skills'])

print(f"Processing {len(df)} job postings...")

vectors = []
metadata = []

for i, row in df.iterrows():
    # normalize job title
    job_title = str(row['job_title']).strip().lower()

    # raw skills string
    raw_skills = str(row['skills']).strip()

    # split + normalize skills
    skills_list = [
        s.strip().lower() for s in raw_skills.split(',')
        if s.strip()
    ]

    # text used for embedding
    text_to_embed = f"Job: {job_title}. Skills: {raw_skills}"

    vector = model.encode(text_to_embed)
    vectors.append(vector)

    metadata.append({
        'title': job_title,
        'skills': skills_list
    })

    if i % 50 == 0:
        print(f"embedded {i}")

print("Building FAISS index...")

vectors_np = np.array(vectors).astype('float32')
dimension = vectors_np.shape[1]

index = faiss.IndexFlatL2(dimension)
index.add(vectors_np)

print(f"Index contains {index.ntotal} vectors")

# save files
os.makedirs('data', exist_ok=True)

faiss.write_index(index, 'data/jobs.index')

with open('data/jobs_metadata.json', 'w') as f:
    json.dump(metadata, f)

print("✅ Done! Saved:")
print("data/jobs.index")
print("data/jobs_metadata.json")