"""
Swasthya Saathi - AI Symptom Checker & Decision Engine
======================================================
A rule-based + weighted scoring engine designed to be
easily swapped with an ML model later.
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
import json


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

class Severity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    CRITICAL = "critical"

class Action(str, Enum):
    HOME_CARE = "home_care"
    VISIT_DOCTOR = "visit_doctor"
    EMERGENCY = "emergency"


# ─────────────────────────────────────────────
# DATA STRUCTURES
# ─────────────────────────────────────────────

@dataclass
class PatientInput:
    symptoms: list[str]
    age: int
    gender: str                          # "male" | "female" | "other"
    location: str                        # e.g. "rural_rajasthan"
    lifestyle: Optional[dict] = None     # {"smoker": True, "diabetic": False, ...}
    history: Optional[list[str]] = None  # ["hypertension", "asthma"]

@dataclass
class DiagnosisResult:
    possible_diseases: list[dict]        # [{name, confidence, severity}]
    severity: Severity
    action: Action
    home_remedies: list[str]
    reasoning: str
    referral_note: str                   # for doctor recommendation module


# ─────────────────────────────────────────────
# DISEASE KNOWLEDGE BASE
# (extend this — or replace with ML model)
# ─────────────────────────────────────────────

DISEASE_KB = {
    "common_cold": {
        "symptoms": ["runny_nose", "sneezing", "sore_throat", "cough", "mild_fever"],
        "base_severity": Severity.MILD,
        "age_risk": [],           # ages that raise severity
        "history_risk": [],
        "remedies": [
            "Rest and stay hydrated (8+ glasses of water/day)",
            "Steam inhalation twice daily",
            "Warm turmeric milk at bedtime",
            "Honey + ginger tea for sore throat",
            "Saline nasal drops for congestion"
        ]
    },
    "malaria": {
        "symptoms": ["high_fever", "chills", "sweating", "headache", "body_ache", "nausea", "vomiting"],
        "base_severity": Severity.MODERATE,
        "age_risk": [{"range": (0, 5), "bump": 1}, {"range": (60, 120), "bump": 1}],
        "history_risk": ["anemia", "immunocompromised"],
        "remedies": []   # requires medical treatment — no home remedy
    },
    "typhoid": {
        "symptoms": ["high_fever", "stomach_pain", "weakness", "headache", "loss_of_appetite", "diarrhea"],
        "base_severity": Severity.MODERATE,
        "age_risk": [{"range": (0, 10), "bump": 1}],
        "history_risk": [],
        "remedies": []
    },
    "dengue": {
        "symptoms": ["high_fever", "severe_headache", "joint_pain", "rash", "eye_pain", "bleeding_gums", "fatigue"],
        "base_severity": Severity.CRITICAL,
        "age_risk": [],
        "history_risk": ["dengue_history"],   # second infection is worse
        "remedies": []
    },
    "dehydration": {
        "symptoms": ["dizziness", "dry_mouth", "dark_urine", "fatigue", "headache", "weakness"],
        "base_severity": Severity.MILD,
        "age_risk": [{"range": (0, 5), "bump": 1}, {"range": (65, 120), "bump": 1}],
        "history_risk": ["diabetes"],
        "remedies": [
            "ORS (oral rehydration solution) — 1 sachet in 1L water",
            "Coconut water every 2 hours",
            "Avoid tea, coffee, alcohol",
            "Cool, shaded rest"
        ]
    },
    "hypertension_crisis": {
        "symptoms": ["severe_headache", "blurred_vision", "chest_pain", "shortness_of_breath", "nosebleed"],
        "base_severity": Severity.CRITICAL,
        "age_risk": [{"range": (40, 120), "bump": 1}],
        "history_risk": ["hypertension", "diabetes", "heart_disease"],
        "remedies": []
    },
    "gastroenteritis": {
        "symptoms": ["diarrhea", "vomiting", "stomach_pain", "nausea", "mild_fever", "weakness"],
        "base_severity": Severity.MILD,
        "age_risk": [{"range": (0, 5), "bump": 1}],
        "history_risk": [],
        "remedies": [
            "ORS after every loose stool",
            "Eat light — rice, banana, toast (BRAT diet)",
            "Avoid dairy, spicy food for 48 hours",
            "Boil drinking water"
        ]
    },
    "tuberculosis": {
        "symptoms": ["persistent_cough", "blood_in_sputum", "night_sweats", "weight_loss", "fatigue", "low_grade_fever"],
        "base_severity": Severity.CRITICAL,
        "age_risk": [],
        "history_risk": ["hiv", "immunocompromised", "tb_contact"],
        "remedies": []
    },
    "anemia": {
        "symptoms": ["fatigue", "pale_skin", "dizziness", "shortness_of_breath", "weakness", "cold_hands"],
        "base_severity": Severity.MILD,
        "age_risk": [],
        "history_risk": ["pregnancy"],
        "remedies": [
            "Iron-rich foods: spinach, lentils, jaggery, dates",
            "Vitamin C with meals to boost iron absorption",
            "Avoid tea/coffee immediately after meals",
            "Visit PHC for iron/folic acid tablets (free under govt scheme)"
        ]
    },
    "heat_stroke": {
        "symptoms": ["high_fever", "no_sweating", "confusion", "hot_dry_skin", "rapid_heartbeat", "unconsciousness"],
        "base_severity": Severity.CRITICAL,
        "age_risk": [{"range": (0, 5), "bump": 1}, {"range": (60, 120), "bump": 1}],
        "history_risk": [],
        "remedies": []
    }
}

# Severity ladder for bumping up
SEVERITY_LADDER = [Severity.MILD, Severity.MODERATE, Severity.CRITICAL]

# Action mapping
ACTION_MAP = {
    Severity.MILD: Action.HOME_CARE,
    Severity.MODERATE: Action.VISIT_DOCTOR,
    Severity.CRITICAL: Action.EMERGENCY
}


# ─────────────────────────────────────────────
# INPUT VALIDATOR
# ─────────────────────────────────────────────

class InputValidator:
    VALID_GENDERS = {"male", "female", "other"}

    @staticmethod
    def validate(data: dict) -> PatientInput:
        assert isinstance(data.get("symptoms"), list) and len(data["symptoms"]) > 0, \
            "symptoms must be a non-empty list"
        assert isinstance(data.get("age"), int) and 0 < data["age"] < 120, \
            "age must be an integer between 1 and 119"
        assert data.get("gender", "").lower() in InputValidator.VALID_GENDERS, \
            "gender must be male / female / other"
        assert isinstance(data.get("location"), str), \
            "location must be a string"

        # Normalise symptoms to lowercase + underscores
        symptoms = [s.lower().replace(" ", "_") for s in data["symptoms"]]

        return PatientInput(
            symptoms=symptoms,
            age=data["age"],
            gender=data["gender"].lower(),
            location=data["location"],
            lifestyle=data.get("lifestyle"),
            history=[h.lower() for h in data.get("history", [])] or []
        )


# ─────────────────────────────────────────────
# SCORING ENGINE
# ─────────────────────────────────────────────

class ScoringEngine:
    """
    Scores each disease by symptom overlap.
    Returns top-N matches with confidence %.

    TO UPGRADE: Replace score() with ML model predict_proba().
    The interface (input → ranked list) stays identical.
    """

    @staticmethod
    def score(patient: PatientInput, top_n: int = 3) -> list[dict]:
        scores = []

        for disease_name, kb in DISEASE_KB.items():
            kb_symptoms = set(kb["symptoms"])
            patient_symptoms = set(patient.symptoms)

            matched = kb_symptoms & patient_symptoms
            if not matched:
                continue

            # Jaccard-style confidence score
            union = kb_symptoms | patient_symptoms
            confidence = round(len(matched) / len(union) * 100, 1)

            # Severity bumping
            severity_idx = SEVERITY_LADDER.index(kb["base_severity"])

            # Age risk bump
            for risk in kb.get("age_risk", []):
                lo, hi = risk["range"]
                if lo <= patient.age <= hi:
                    severity_idx = min(severity_idx + risk["bump"], 2)

            # History risk bump
            for risk_condition in kb.get("history_risk", []):
                if patient.history and risk_condition in patient.history:
                    severity_idx = min(severity_idx + 1, 2)

            final_severity = SEVERITY_LADDER[severity_idx]

            scores.append({
                "disease": disease_name.replace("_", " ").title(),
                "confidence": confidence,
                "severity": final_severity.value,
                "matched_symptoms": [s.replace("_", " ") for s in matched]
            })

        # Sort by confidence descending
        scores.sort(key=lambda x: x["confidence"], reverse=True)
        return scores[:top_n]


# ─────────────────────────────────────────────
# DECISION ENGINE
# ─────────────────────────────────────────────

class DecisionEngine:
    """
    Determines overall severity + action from scored diseases.
    Applies critical overrides for red-flag symptoms.
    """

    RED_FLAG_SYMPTOMS = {
        "unconsciousness", "chest_pain", "difficulty_breathing",
        "blood_in_sputum", "bleeding_gums", "severe_headache", "confusion"
    }

    @staticmethod
    def decide(patient: PatientInput, scored: list[dict]) -> tuple[Severity, Action, str]:
        if not scored:
            return Severity.MILD, Action.HOME_CARE, "No matching disease found. Monitor symptoms."

        # Check red flags first — always escalate to CRITICAL
        red_flags_found = set(patient.symptoms) & DecisionEngine.RED_FLAG_SYMPTOMS
        if red_flags_found:
            flags_str = ", ".join(f.replace("_", " ") for f in red_flags_found)
            return (
                Severity.CRITICAL,
                Action.EMERGENCY,
                f"Red-flag symptoms detected: {flags_str}. Immediate emergency care required."
            )

        # Take the worst severity across top results
        severity_order = {Severity.MILD: 0, Severity.MODERATE: 1, Severity.CRITICAL: 2}
        worst = max(scored, key=lambda x: severity_order[Severity(x["severity"])])
        final_severity = Severity(worst["severity"])
        action = ACTION_MAP[final_severity]

        # Build reasoning string
        top = scored[0]
        reasoning = (
            f"Top match: {top['disease']} ({top['confidence']}% confidence) "
            f"based on symptoms: {', '.join(top['matched_symptoms'])}. "
            f"Severity classified as {final_severity.value.upper()}."
        )
        if len(scored) > 1:
            others = [s["disease"] for s in scored[1:]]
            reasoning += f" Other possibilities: {', '.join(others)}."

        return final_severity, action, reasoning


# ─────────────────────────────────────────────
# OUTPUT FORMATTER
# ─────────────────────────────────────────────

class OutputFormatter:

    ACTION_MESSAGES = {
        Action.HOME_CARE:     "✅ Manage at home with remedies below. Visit a doctor if symptoms worsen after 2 days.",
        Action.VISIT_DOCTOR:  "⚠️  Visit the nearest doctor or PHC within 24 hours.",
        Action.EMERGENCY:     "🚨 EMERGENCY — Call ambulance or go to nearest hospital IMMEDIATELY."
    }

    REFERRAL_TEMPLATES = {
        Action.HOME_CARE:    "Monitor patient. Schedule PHC visit if no improvement in 48 hrs.",
        Action.VISIT_DOCTOR: "Refer to nearest PHC/CHC. Suspected: {diseases}.",
        Action.EMERGENCY:    "URGENT referral to district hospital. Suspected: {diseases}. Patient profile: age {age}, {gender}."
    }

    @staticmethod
    def format(patient: PatientInput, scored: list[dict],
               severity: Severity, action: Action, reasoning: str) -> dict:

        # Home remedies only for top mild disease
        remedies = []
        if action == Action.HOME_CARE and scored:
            top_disease_key = scored[0]["disease"].lower().replace(" ", "_")
            remedies = DISEASE_KB.get(top_disease_key, {}).get("remedies", [])

        disease_names = ", ".join(d["disease"] for d in scored)

        referral = OutputFormatter.REFERRAL_TEMPLATES[action].format(
            diseases=disease_names,
            age=patient.age,
            gender=patient.gender
        )

        return {
            "possible_diseases": scored,
            "severity": severity.value,
            "action": action.value,
            "action_message": OutputFormatter.ACTION_MESSAGES[action],
            "home_remedies": remedies,
            "reasoning": reasoning,
            "referral_note": referral   # consumed by doctor recommendation module
        }


# ─────────────────────────────────────────────
# PUBLIC API  ← frontend / other modules call this
# ─────────────────────────────────────────────

def analyse(raw_input: dict) -> dict:
    """
    Main entry point.
    Accepts a raw dict (from API / frontend) → returns diagnosis dict.

    Integration:
      - REST API: pass request.json() directly
      - Doctor module: read result["referral_note"]
      - Frontend: render result["action_message"] + result["possible_diseases"]
    """
    patient = InputValidator.validate(raw_input)
    scored = ScoringEngine.score(patient)
    severity, action, reasoning = DecisionEngine.decide(patient, scored)
    return OutputFormatter.format(patient, scored, severity, action, reasoning)


# ─────────────────────────────────────────────
# DEMO — run directly to test
# ─────────────────────────────────────────────

if __name__ == "__main__":

    test_cases = [
        {
            "label": "Rural child — possible malaria",
            "input": {
                "symptoms": ["high_fever", "chills", "sweating", "headache", "nausea"],
                "age": 7,
                "gender": "male",
                "location": "rural_odisha",
                "history": []
            }
        },
        {
            "label": "Elderly woman — dehydration",
            "input": {
                "symptoms": ["dizziness", "dry_mouth", "fatigue", "weakness"],
                "age": 68,
                "gender": "female",
                "location": "rural_rajasthan",
                "lifestyle": {"outdoor_worker": True},
                "history": ["diabetes"]
            }
        },
        {
            "label": "Adult man — common cold",
            "input": {
                "symptoms": ["runny_nose", "sneezing", "sore_throat", "mild_fever"],
                "age": 32,
                "gender": "male",
                "location": "rural_mp",
            }
        },
        {
            "label": "EMERGENCY — possible dengue with red flags",
            "input": {
                "symptoms": ["high_fever", "severe_headache", "bleeding_gums", "rash", "joint_pain"],
                "age": 25,
                "gender": "female",
                "location": "rural_kerala",
                "history": ["dengue_history"]
            }
        }
    ]

    for case in test_cases:
        print(f"\n{'='*60}")
        print(f"TEST: {case['label']}")
        print(f"{'='*60}")
        result = analyse(case["input"])
        print(json.dumps(result, indent=2))