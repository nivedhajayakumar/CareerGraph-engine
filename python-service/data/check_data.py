import pandas as pd

df = pd.read_csv('./job_market.csv')

print(df.columns)
print(df[['job_title', 'skills']].head(3))