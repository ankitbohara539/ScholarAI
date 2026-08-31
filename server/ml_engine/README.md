# ScholarAI PyTorch Hybrid University Recommender

This module trains a PyTorch artificial neural network (ANN) on applicant profiles, then combines three signals:

1. **ANN score (50%)** — learned from GRE, TOEFL, university rating, SOP, LOR, GPA, and research.
2. **Similar-applicant score (25%)** — a user-neighborhood estimate from the 25 closest historical applicants.
3. **Content score (25%)** — preferred region/country, desired university tier, and QS academic reputation.

QS rank calibrates the ANN and cohort scores for selectivity. Results are grouped as `reach`, `target`, or `safety`, and the default strategy returns a balanced list.

## Important data limitation

The admission file has no university name/ID, and the QS file has no applicant interactions. Therefore this is **not a true user-item collaborative filter**, and `selectivity_adjusted_fit` is **not an admission probability**. It is a ranking estimate derived from two unrelated public-style datasets. Add real `(student_id, university_id, applied/admitted/enrolled)` events to train true collaborative embeddings and to calibrate admission probabilities.

Do not use this output as the only basis for an application decision.

## Project layout

```text
server/ml_engine/
|-- data/raw/                  # both source CSVs
|-- artifacts/                 # generated checkpoint and metrics
|-- api.py                     # FastAPI service
|-- data.py                    # validated ingestion and rank parsing
|-- model.py                   # PyTorch MLP
|-- train.py                   # split, scale, train, evaluate, save
|-- recommender.py             # hybrid ranking implementation
|-- recommend.py               # command-line interface
`-- tests/test_engine.py
```

The QS loader automatically handles the source file's Windows encoding.

## Step 1: create an environment

From the project root in PowerShell:

```powershell
cd server
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r ml_engine\requirements.txt
```

From Command Prompt (`cmd.exe`):

```bat
cd server
py -m venv .venv
.venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r ml_engine\requirements.txt
```

If PowerShell blocks activation, either run `Set-ExecutionPolicy -Scope Process Bypass` for the current shell or call `.venv\Scripts\python.exe` directly.

## Step 2: train and evaluate

```powershell
python -m ml_engine.train --epochs 300 --patience 35
```

Generated files:

- `artifacts/admission_mlp.pt` — PyTorch checkpoint
- `artifacts/metadata.json` — scaler and historical cohort
- `artifacts/metrics.json` — held-out MAE, RMSE, and R²

The reproducible run already performed for this project used seed 42 and produced:

```json
{
  "mae": 0.0368918031,
  "rmse": 0.0575436025,
  "r2": 0.8277764320,
  "epochs_run": 182,
  "train_rows": 640,
  "validation_rows": 160,
  "test_rows": 200
}
```

## Step 3: get recommendations from the CLI

```powershell
python -m ml_engine.recommend `
  --gre 325 `
  --toefl 112 `
  --sop 4.0 `
  --lor 4.0 `
  --gpa 3.70 `
  --research 1 `
  --desired-rating 4 `
  --regions "Europe,Americas" `
  --strategy balanced `
  --top-k 12 `
  --output recommendations.json
```

For Command Prompt, put the command on one line or use `^` instead of PowerShell's backtick. Output may be `.json` or `.csv`.

Strategies are `balanced`, `reach`, `target`, `safety`, and `all`. Country preferences use exact dataset names, for example `--countries "United States,Canada"`.

## Step 4: run the API

```powershell
python -m uvicorn ml_engine.api:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs`, or call:

```powershell
$body = @{
  gre_score = 325
  toefl_score = 112
  sop = 4.0
  lor = 4.0
  gpa = 3.7
  research = 1
  desired_university_rating = 4
  preferred_regions = @("Europe", "Americas")
  preferred_countries = @()
  strategy = "balanced"
  top_k = 12
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/recommend -ContentType application/json -Body $body
```

## Step 5: verify

```powershell
python -m pytest ml_engine\tests -q
```

## Using it from Python

```python
from ml_engine.recommender import HybridUniversityRecommender, StudentProfile

engine = HybridUniversityRecommender()
student = StudentProfile(
    gre_score=325,
    toefl_score=112,
    sop=4.0,
    lor=4.0,
    gpa=3.7,
    research=1,
    desired_university_rating=4,
    preferred_regions=("Europe", "Americas"),
)

recommendations = engine.recommend(student, top_k=12, strategy="balanced")
```

## Retraining with updated data

Replace the two files under `data/raw/` without changing their column names, then rerun training and tests. The ingestion layer rejects missing columns and invalid empty numeric data instead of silently producing a model.
