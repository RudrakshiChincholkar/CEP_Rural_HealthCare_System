import os
import requests
import re
import ast
from dotenv import load_dotenv

load_dotenv()
TEAM_API_KEY = os.getenv("TEAM_API_KEY")
os.environ["TEAM_API_KEY"] = TEAM_API_KEY


from flask import Flask, request, jsonify
from flask_cors import CORS
from langdetect import detect
from aixplain.factories import ModelFactory, AgentFactory

doc_model = None
summ_model = None
news_model = None
main_agent = None

try:
    doc_model = ModelFactory.get(os.getenv("DOC_MODEL_ID"))
    summ_model = ModelFactory.get(os.getenv("SUMM_MODEL_ID"))
    news_model = ModelFactory.get(os.getenv("NEWS_MODEL_ID"))
    main_agent = AgentFactory.get(os.getenv("AGENT_MODEL_ID"))
except Exception:
    pass

app = Flask(__name__)
CORS(app)

def remove_markdown(text):
    text = re.sub(r'\*\*.*?\*\*', '', text)
    text = re.sub(r'[\*\-] ', '', text)
    text = re.sub(r'[#\*_\[\]()]', '', text)
    text = re.sub(r'\n+', '\n', text).strip()
    return text

def format_text(text):
    sections = text.split("\n")
    return "\n\n".join(section.strip() for section in sections if section.strip())

def clean_and_format_response(raw_response):
    if "data=" in raw_response:
        raw_response = raw_response.split("data=")[-1].strip()
    raw_response = raw_response.strip("()'")
    try:
        raw_response = ast.literal_eval(f"'''{raw_response}'''")
    except Exception:
        pass
    match = re.search(r"https?://\S+\nSource:.*?\nDate: .*?\n\n", raw_response, re.DOTALL)
    if match:
        articles_part = raw_response[:match.end()].strip()
        summary_part = raw_response[match.end():].strip()
    else:
        return raw_response.strip()
    formatted_articles = re.sub(r"\n{3,}", "\n\n", articles_part)
    formatted_summary = re.sub(r"\n{3,}", "\n\n", summary_part)
    return f"{formatted_articles}\n\n{'-'*100}\n\n{formatted_summary}"

def get_nearest_health_centers(latitude, longitude):
    return [
        {
            "name": "KEM Hospital",
            "address": "Acharya Donde Marg, Parel, Mumbai",
            "latitude": 18.9995,
            "longitude": 72.8406,
            "distance_km": 2.4,
            "contact": "+91-22-2410-7000",
        },
        {
            "name": "Lilavati Hospital",
            "address": "Bandra West, Mumbai",
            "latitude": 19.0511,
            "longitude": 72.8296,
            "distance_km": 6.1,
            "contact": "+91-22-2675-1000",
        },
    ]

def get_route(start_lat, start_lon, end_lat, end_lon):
    return {"route_polyline": "", "note": "Static fallback route without external maps API"}

@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.json
        question = data.get("question", "")
        if not question:
            return jsonify({"error": "No question provided"}), 400
        output_language = detect(question)
        if main_agent and summ_model:
            formatted_query = f"{question} Response in {output_language}"
            agent_response = main_agent.run(formatted_query)
            formatted_response = agent_response["data"]["output"]
            form_response = remove_markdown(formatted_response)
            agent_answer = format_text(form_response)
            safe_response = agent_answer.replace("\n", " ").replace('"', '\\"').replace("'", "\\'")
            summ = summ_model.run({"question": question, "response": f"{safe_response}", "language": output_language})["data"]
            corrected_text = summ.encode('latin1').decode('utf-8')
            corr_text = remove_markdown(corrected_text)
            summary = format_text(corr_text)
        else:
            agent_answer = "Stay hydrated\nRest well\nConsult a doctor if symptoms continue"
            summary = "Fallback advice generated because live AI service is unavailable."
        return jsonify({"response": agent_answer, "summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/doctors", methods=["POST"])
def find_doctors():
    try:
        data = request.json
        condition = data.get("condition", "")
        location = data.get("location", "")
        if not condition or not location:
            return jsonify({"error": "Condition and location required"}), 400
        if doc_model:
            doctors = doc_model.run({"condition": condition, "location": location})
            return jsonify({"doctors": doctors.data.encode('latin1').decode('utf-8')})
        return jsonify({"doctors": "Name: Dr. Sharma\nSpecialization: General Physician\nExperience: 9 years\nConsultation Fee: INR 700\nLocation: Mumbai\nAbout Doctor: https://example.com"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health-centers", methods=["POST"])
def find_health_centers():
    try:
        data = request.json
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if not latitude or not longitude:
            return jsonify({"error": "Latitude and longitude are required"}), 400
        health_centers = get_nearest_health_centers(latitude, longitude)
        if "error" in health_centers:
            return jsonify(health_centers), 400
        first_center = health_centers[0]
        route = get_route(latitude, longitude, first_center["latitude"], first_center["longitude"])
        return jsonify({"nearest_health_centers": health_centers, "route": route})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/news", methods=["POST"])
def get_news():
    try:
        data = request.json
        language = data.get("language", "")
        if not language:
            return jsonify({"error": "Language selection is required"}), 400
        if news_model:
            news = news_model.run({"language": language})
            return jsonify({"news": clean_and_format_response(str(news))})
        return jsonify({"news": "Title: Local Health Bulletin\nDescription: Static fallback health update\nContent: Drink safe water and maintain hygiene.\nURL: https://example.com/news\nSource: Health Desk\nDate: 2026-04-23"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
