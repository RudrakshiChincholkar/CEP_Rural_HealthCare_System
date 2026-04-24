"""
Swasthya Saathi - REST API Layer
=================================
Run:  uvicorn api:app --reload
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from symptom_checker import analyse

app = FastAPI(
    title="Swasthya Saathi API",
    description="AI Symptom Checker & Decision Engine for Rural Healthcare",
    version="1.0.0"
)

# Allow calls from frontend / React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Schemas ───────────────────────────────────────────────

class SymptomRequest(BaseModel):
    symptoms: list[str] = Field(..., example=["high_fever", "chills", "headache"])
    age: int            = Field(..., ge=1, le=119, example=28)
    gender: str         = Field(..., example="female")
    location: str       = Field(..., example="rural_odisha")
    lifestyle: Optional[dict] = Field(None, example={"smoker": False, "outdoor_worker": True})
    history: Optional[list[str]] = Field(None, example=["diabetes"])

class DiseaseMatch(BaseModel):
    disease: str
    confidence: float
    severity: str
    matched_symptoms: list[str]

class DiagnosisResponse(BaseModel):
    possible_diseases: list[DiseaseMatch]
    severity: str
    action: str
    action_message: str
    home_remedies: list[str]
    reasoning: str
    referral_note: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Swasthya Saathi Symptom Checker"}


@app.post("/analyse", response_model=DiagnosisResponse)
def analyse_symptoms(req: SymptomRequest):
    """
    Accepts patient symptoms + profile.
    Returns ranked diseases, severity, recommended action, and home remedies.
    """
    try:
        result = analyse(req.dict())
        return result
    except AssertionError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engine error: {str(e)}")


@app.get("/symptoms/list")
def list_known_symptoms():
    """Returns all symptoms the engine currently understands."""
    from symptom_checker import DISEASE_KB
    all_symptoms = set()
    for kb in DISEASE_KB.values():
        all_symptoms.update(kb["symptoms"])
    return {"symptoms": sorted(all_symptoms)}


@app.get("/diseases/list")
def list_diseases():
    """Returns all diseases in the knowledge base."""
    from symptom_checker import DISEASE_KB
    return {
        "diseases": [
            {"name": k.replace("_", " ").title(), "base_severity": v["base_severity"]}
            for k, v in DISEASE_KB.items()
        ]
    }