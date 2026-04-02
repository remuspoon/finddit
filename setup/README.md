# Supabase vector DB setup for Reddit mental health posts

This folder builds a vector database of r/mentalhealth submissions and uploads them to Supabase (via `vecs`) for semantic search.

## Data Source

Reddit archive from 2005 - 2025 (The VDB only contains entries from the last 2 years)

Filename: mentalhealth_submissions.jsonl

From: https://academictorrents.com/details/3e3f64dee22dc304cdd2546254ca1f8e8ae542b4

## How it works

1. **Load data** — Reads `data/mentalhealth_submissions.jsonl` (Reddit submission dump, one JSON object per line).
2. **Filter** — Keeps only the last 2 years; drops `[deleted]`/`[removed]` posts and authors; keeps only posts with 100+ words in the body.
3. **Truncate** — Any post where `title + " | " + selftext` exceeds 16,000 characters has its body truncated to fit.
4. **Embed & upload** — Each document is `title | selftext`. They're embedded with OpenAI `text-embedding-3-small` and upserted into a Supabase `vecs` collection (`docs`, dimension=512) with an HNSW cosine index. Upload runs in batches with progress saved so you can resume after errors.

Outputs: `data/clean_df.csv` (cleaned dataframe), `data/vecs_upload_progress.txt` (last uploaded batch index).

## Setup

### 1. Dependencies

From the project root (or this folder), use a venv and install:

```bash
pip install -r requirements.txt
```

### 2. Data

Put the Reddit submissions dump at:

```
data/mentalhealth_submissions.jsonl
```

Each line must be a single JSON object with at least: `title`, `selftext`, `author`, `created_utc`, `permalink`, `id`, `subreddit`, `subreddit_id`, `link_flair_text`, `retrieved_on`.

### 3. Environment variables

Create a `.env` in the project root (or where `dotenv.load_dotenv()` is run) with:

- **`DB_CONNECTION`** — Supabase PostgreSQL connection string.
- **`OPENAI_API_KEY`** — Used to generate embeddings via `text-embedding-3-small`.

### 4. Supabase collection

The notebook connects to a Supabase `vecs` collection named `docs` (dimension=512). Create it with `vx.get_or_create_collection(name="docs", dimension=512)` — this is already in the notebook.

### 5. Run the notebook

Open `setup.ipynb` and run all cells. For the batch upsert, if it stops (e.g. network/API error), run the upload cell again; it will resume from the index stored in `data/vecs_upload_progress.txt`.
