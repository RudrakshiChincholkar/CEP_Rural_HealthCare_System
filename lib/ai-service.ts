import outbreakAlerts from "@/data/outbreak-alerts.json"
import { promisify } from "node:util"
import { execFile as execFileCallback } from "node:child_process"
import path from "node:path"

export interface AIService {
  askHealthQuestion(input: {
    question: string
    area?: string
    language?: "English" | "Hindi" | "Marathi"
    history?: Array<{ role: "user" | "assistant"; content: string }>
  }): Promise<{
    response: string
    urgency: "LOW" | "MEDIUM" | "HIGH"
    followUpQuestions: string[]
    extracted: {
      bodyPart?: string
      duration?: string
      severity?: string
      age?: string
      emergencySignals: string[]
    }
    usedFallback: boolean
  }>
  triageSymptoms(input: {
    area: string
    symptoms: string
    history?: string
    age?: number
    bmi?: number
    habits?: string
    diseaseHistory?: string
  }): Promise<{
    possibleCondition: string
    urgency: "LOW" | "MEDIUM" | "HIGH"
    explanation: string
    remedy: string
    lifestyle: string
    disclaimer: string
    emergencyWarning?: string
  }>
  summarizeHistory(input: { entries: string[] }): Promise<string>
  mentalHealthResponse(input: { message: string }): Promise<{ response: string; severe: boolean }>
}

const emergencyKeywords = ["chest pain", "breathing", "unconscious", "stroke", "fainting", "seizure"]
const severeMentalKeywords = ["self harm", "suicide", "end my life", "can't live", "hopeless", "kill myself"]

const LLAMA_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_LLAMA_MODEL = "meta-llama/llama-3.1-8b-instruct:free"

type TriageResult = {
  possibleCondition: string
  urgency: "LOW" | "MEDIUM" | "HIGH"
  explanation: string
  remedy: string
  lifestyle: string
  disclaimer: string
  emergencyWarning?: string
  possibleConditions?: string[]
  nextStep?: string
  nearbySpecialistType?: string
  homeCare?: string[]
  warningSigns?: string[]
  confidenceNote?: string
}

// Rule-engine fallback that always returns medically cautious responses.
class RuleEngineAIService implements AIService {
  async askHealthQuestion(input: {
    question: string
    area?: string
    language?: "English" | "Hindi" | "Marathi"
    history?: Array<{ role: "user" | "assistant"; content: string }>
  }) {
    const extracted = extractHealthContext(input.question)
    const areaAlert = input.area
      ? outbreakAlerts.find((item) => item.area.toLowerCase() === input.area.toLowerCase())
      : null
    const areaText = areaAlert ? `In ${areaAlert.area}, possible ${areaAlert.disease} risk is ${areaAlert.risk}.` : ""
    return {
      response: `${areaText}
Possible causes include minor infection, inflammation, or related irritation.

Immediate care:
- Rest and hydration
- Avoid self-medicating aggressively
- Monitor for fever, worsening pain, or weakness

See a doctor urgently if symptoms are severe, persistent, or worsening.
Not a diagnosis.`,
      urgency: extracted.emergencySignals.length > 0 ? "HIGH" : "MEDIUM",
      followUpQuestions: buildFollowUpQuestions(extracted),
      extracted,
      usedFallback: true,
    }
  }

  async triageSymptoms(input: {
    area: string
    symptoms: string
    history?: string
    age?: number
    bmi?: number
    habits?: string
    diseaseHistory?: string
  }) {
    const symptomText = input.symptoms.toLowerCase()
    const severe = emergencyKeywords.some((key) => symptomText.includes(key))
    const alert = outbreakAlerts.find((item) => item.area.toLowerCase() === input.area.toLowerCase())

    let urgency: "LOW" | "MEDIUM" | "HIGH" = "LOW"
    if (severe) urgency = "HIGH"
    else if (symptomText.includes("fever") || symptomText.includes("headache")) urgency = "MEDIUM"

    const possibleCondition = alert ? `${alert.disease} or related infection` : "viral flu or minor infection"
    const explanation = alert
      ? `Based on symptoms and mock outbreak data from ${alert.area}, this may indicate ${possibleCondition}. Risk level in this area is ${alert.risk}.`
      : `Based on provided symptoms, this may indicate ${possibleCondition}.`
    const remedy =
      urgency === "LOW"
        ? "Home care: rest, hydration, light meals, and symptom monitoring for 24-48 hours. Not a replacement for doctor consultation."
        : "Avoid self-medication and get clinical evaluation soon. Not a replacement for doctor consultation."
    const lifestyle = `Maintain regular sleep, balanced diet, and avoid smoking/alcohol excess. ${
      input.bmi && input.bmi > 25 ? "Weight management and daily 30-minute walk may help." : ""
    }`

    return {
      possibleCondition,
      urgency,
      explanation,
      remedy,
      lifestyle,
      disclaimer: "This is a supportive AI assessment only and may indicate possibilities, not a confirmed diagnosis. Consult a doctor.",
      emergencyWarning: urgency === "HIGH" ? "Emergency warning: seek immediate medical help or call ambulance services." : undefined,
    }
  }

  async summarizeHistory(input: { entries: string[] }) {
    if (!input.entries.length) return "No history entries available."
    return `Recent history summary: ${input.entries.slice(0, 3).join(" | ")}. Please keep regular follow-up with your doctor.`
  }

  async mentalHealthResponse(input: { message: string }) {
    const text = input.message.toLowerCase()
    const severe = severeMentalKeywords.some((term) => text.includes(term))
    const response = severe
      ? "I am concerned about your safety. Please contact emergency services or a trusted person immediately. You may also call Tele-MANAS 14416 in India."
      : "It sounds like you are going through stress. Try slow breathing, short walks, and sharing with someone you trust. If this continues, please consult a mental health professional."
    return { response, severe }
  }
}

const execFile = promisify(execFileCallback)

type SwasthyaDisease = {
  disease: string
  confidence: number
  severity: "mild" | "moderate" | "critical"
  matched_symptoms: string[]
}

type SwasthyaResponse = {
  possible_diseases: SwasthyaDisease[]
  severity: "mild" | "moderate" | "critical"
  action: "home_care" | "visit_doctor" | "emergency"
  action_message: string
  home_remedies: string[]
  reasoning: string
  referral_note: string
}

class LlamaAIService implements AIService {
  private fallback = new RuleEngineAIService()
  private localEngineScript = path.join(process.cwd(), "swasthya-saathi", "bridge_cli.py")
  private pythonBin = process.env.SWASTHYA_PYTHON_BIN || "python"

  // Merged local engine adapter: calls Swasthya-Saathi before external providers.
  private async runLocalSymptomEngine(input: {
    symptoms: string
    age?: number
    history?: string
    area?: string
  }): Promise<SwasthyaResponse | null> {
    const normalizedSymptoms = normalizeSymptoms(input.symptoms)
    if (normalizedSymptoms.length === 0) return null

    const payload = {
      symptoms: normalizedSymptoms,
      age: input.age && input.age > 0 ? input.age : 30,
      gender: "other",
      location: normalizeLocation(input.area),
      history: normalizeHistory(input.history),
      lifestyle: {},
    }

    try {
      const { stdout } = await execFile(this.pythonBin, [this.localEngineScript, JSON.stringify(payload)], {
        timeout: 10000,
      })
      const parsed = JSON.parse(stdout) as SwasthyaResponse | { error: string }
      if ("error" in parsed) throw new Error(parsed.error)
      return parsed
    } catch (error) {
      console.error("Swasthya-Saathi local engine failed, external fallback may run:", error)
      return null
    }
  }

  private async callLlama({
    systemPrompt,
    userPrompt,
    maxTokens = 450,
  }: {
    systemPrompt: string
    userPrompt: string
    maxTokens?: number
  }): Promise<string | null> {
    const apiKey = process.env.LLAMA_API_KEY
    const model = process.env.LLAMA_MODEL || DEFAULT_LLAMA_MODEL
    if (!apiKey) return null

    const makeRequest = async () => {
      const response = await fetch(LLAMA_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Llama provider error ${response.status}: ${body}`)
      }

      const data = await response.json()
      return data?.choices?.[0]?.message?.content?.trim() as string | undefined
    }

    try {
      return (await makeRequest()) || null
    } catch (firstError) {
      console.error("Llama request failed, retrying once:", firstError)
      try {
        return (await makeRequest()) || null
      } catch (secondError) {
        console.error("Llama retry failed, using fallback provider:", secondError)
        return null
      }
    }
  }

  async askHealthQuestion(input: {
    question: string
    area?: string
    language?: "English" | "Hindi" | "Marathi"
    history?: Array<{ role: "user" | "assistant"; content: string }>
  }) {
    const extracted = extractHealthContext(input.question)
    const localResult = await this.runLocalSymptomEngine({
      symptoms: input.question,
      age: input.question.match(/(\d{1,2})\s?(year|yr)/i)?.[1] ? Number(input.question.match(/(\d{1,2})\s?(year|yr)/i)?.[1]) : undefined,
      history: input.history?.map((h) => h.content).join(" "),
      area: input.area,
    })
    if (localResult) {
      const mapped = mapLocalEngineToTriage(localResult)
      return {
        response: buildHealthAdviceResponse(mapped),
        urgency: mapped.urgency,
        followUpQuestions: buildFollowUpQuestions(extracted),
        extracted,
        usedFallback: false,
      }
    }

    const areaAlert = input.area
      ? outbreakAlerts.find((item) => item.area.toLowerCase() === input.area.toLowerCase())
      : null

    const language = input.language || "English"
    const emergency = extracted.emergencySignals.length > 0
    const compactHistory = (input.history || []).slice(-6).map((h) => `${h.role}: ${h.content}`).join("\n")
    const llamaText = await this.callLlama({
      systemPrompt:
        "You are an expert primary-care triage assistant for India. Give specific, practical, symptom-aware advice. Never claim confirmed diagnosis. Always use medically cautious wording like 'possible' and 'may indicate'.",
      userPrompt: `Question: ${input.question}
Area: ${input.area || "Not provided"}
Outbreak context: ${areaAlert ? `${areaAlert.area} has ${areaAlert.disease} risk ${areaAlert.risk} because ${areaAlert.reason}` : "No area outbreak context available"}
Language: ${language}
Extracted context:
- Body part: ${extracted.bodyPart || "Not specified"}
- Duration: ${extracted.duration || "Not specified"}
- Severity: ${extracted.severity || "Not specified"}
- Age clue: ${extracted.age || "Not specified"}
- Emergency signals: ${extracted.emergencySignals.length > 0 ? extracted.emergencySignals.join(", ") : "None found"}
Recent conversation memory:
${compactHistory || "No previous messages"}

Return response in this exact format:
Possible causes:
- ...
- ...

Immediate care:
- ...
- ...

See doctor urgently if:
- ...
- ...

Follow-up questions:
- ...
- ...

Safety note:
Not a diagnosis. Consult a qualified doctor.

Make advice concrete and symptom-specific. If details are missing, ask clear follow-up questions.`,
    })

    if (llamaText) {
      const urgency: "LOW" | "MEDIUM" | "HIGH" = emergency
        ? "HIGH"
        : extracted.severity === "severe"
          ? "HIGH"
          : extracted.severity === "moderate" || extracted.duration?.includes("day")
            ? "MEDIUM"
            : "LOW"
      return {
        response: llamaText,
        urgency,
        followUpQuestions: extractFollowUpFromResponse(llamaText, extracted),
        extracted,
        usedFallback: false,
      }
    }
    return this.fallback.askHealthQuestion(input)
  }

  async triageSymptoms(input: {
    area: string
    symptoms: string
    history?: string
    age?: number
    bmi?: number
    habits?: string
    diseaseHistory?: string
  }): Promise<TriageResult> {
    const localResult = await this.runLocalSymptomEngine({
      symptoms: input.symptoms,
      age: input.age,
      history: `${input.history || ""} ${input.diseaseHistory || ""}`.trim(),
      area: input.area,
    })
    if (localResult) {
      // Preserve existing API keys while enriching with Swasthya-Saathi structured fields.
      return mapLocalEngineToTriage(localResult)
    }

    const alert = outbreakAlerts.find((item) => item.area.toLowerCase() === input.area.toLowerCase())
    const severe = emergencyKeywords.some((key) => input.symptoms.toLowerCase().includes(key))

    const llamaText = await this.callLlama({
      systemPrompt:
        "You are a cautious triage assistant. Return ONLY valid compact JSON with keys: possibleCondition, urgency, explanation, remedy, lifestyle, disclaimer, emergencyWarning. urgency must be LOW, MEDIUM, or HIGH.",
      userPrompt: `Area: ${input.area}
Symptoms: ${input.symptoms}
Medical history: ${input.history || "Not provided"}
Age: ${input.age || "Not provided"}
BMI: ${input.bmi || "Not provided"}
Habits: ${input.habits || "Not provided"}
Disease history: ${input.diseaseHistory || "Not provided"}
Local outbreak context: ${alert ? `${alert.disease} (${alert.risk}) because ${alert.reason}` : "No specific local outbreak in dataset"}
Severe emergency keywords detected: ${severe ? "Yes" : "No"}

Rules:
- Never claim confirmed diagnosis.
- For severe emergency keywords, urgency should be HIGH and include emergency warning.
- Home remedy must include: Not a replacement for doctor consultation.`,
      maxTokens: 500,
    })

    if (llamaText) {
      try {
        const parsed = JSON.parse(llamaText) as TriageResult
        if (parsed?.urgency && parsed?.explanation) return parsed
      } catch (error) {
        console.error("Failed to parse Llama triage JSON, using fallback:", error)
      }
    }

    return this.fallback.triageSymptoms(input)
  }

  async summarizeHistory(input: { entries: string[] }) {
    const llamaText = await this.callLlama({
      systemPrompt:
        "You summarize patient history in short medically cautious language. Never give definitive diagnosis.",
      userPrompt: `Summarize these patient timeline entries in 3-4 concise bullet points:
${input.entries.map((entry, idx) => `${idx + 1}. ${entry}`).join("\n")}`,
      maxTokens: 220,
    })

    if (llamaText) return llamaText
    return this.fallback.summarizeHistory(input)
  }

  async mentalHealthResponse(input: { message: string }) {
    const severe = severeMentalKeywords.some((term) => input.message.toLowerCase().includes(term))

    const llamaText = await this.callLlama({
      systemPrompt:
        "You are a supportive mental health assistant. Be empathetic, contextual, practical, and safety-first. Avoid generic replies.",
      userPrompt: `User message: ${input.message}
If severe risk is present, provide urgent help-seeking message and include Indian helpline Tele-MANAS 14416.
If non-severe stress, include:
- 1 short emotional validation sentence
- 3 concrete coping steps
- 1 planning suggestion
- 1 encouragement line.`,
      maxTokens: 250,
    })

    if (llamaText) {
      return {
        response: llamaText,
        severe,
      }
    }
    return this.fallback.mentalHealthResponse(input)
  }
}

export function getAIService(): AIService {
  // Llama is primary provider when env key is configured; fallback remains available.
  return new LlamaAIService()
}

// Extract key clinical hints from free-text query to improve prompts and urgency scoring.
function extractHealthContext(text: string) {
  const t = text.toLowerCase()
  const bodyParts = ["ear", "head", "chest", "stomach", "throat", "skin", "back", "eye", "nose"]
  const bodyPart = bodyParts.find((part) => t.includes(part))
  const durationMatch = t.match(/(\d+\s?(day|days|week|weeks|month|months|hour|hours))/)
  const ageMatch = t.match(/(\d{1,2})\s?(year|yr)/)
  const severity = t.includes("severe") || t.includes("very painful") ? "severe" : t.includes("mild") ? "mild" : t.includes("moderate") ? "moderate" : undefined
  const emergencySignals = emergencyKeywords.filter((k) => t.includes(k))

  return {
    bodyPart,
    duration: durationMatch?.[1],
    severity,
    age: ageMatch?.[1],
    emergencySignals,
  }
}

function buildFollowUpQuestions(extracted: {
  bodyPart?: string
  duration?: string
  severity?: string
  age?: string
  emergencySignals: string[]
}) {
  const questions: string[] = []
  if (!extracted.duration) questions.push("How long has this symptom been present?")
  if (!extracted.severity) questions.push("Is the pain/symptom mild, moderate, or severe?")
  if (!extracted.age) questions.push("Please share age for safer guidance.")
  if (extracted.bodyPart === "ear") questions.push("Any fever, hearing loss, or ear discharge?")
  return questions.slice(0, 3)
}

function extractFollowUpFromResponse(response: string, extracted: { emergencySignals: string[] }) {
  const lines = response
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") && line.toLowerCase().includes("?"))
  if (lines.length > 0) return lines.map((line) => line.replace(/^-+\s*/, "")).slice(0, 4)
  return buildFollowUpQuestions({ ...extracted })
}

function mapSeverityToUrgency(severity: SwasthyaResponse["severity"]): "LOW" | "MEDIUM" | "HIGH" {
  if (severity === "critical") return "HIGH"
  if (severity === "moderate") return "MEDIUM"
  return "LOW"
}

function mapLocalEngineToTriage(local: SwasthyaResponse): TriageResult {
  const possibleConditions = local.possible_diseases.map((item) => item.disease.toLowerCase())
  const urgency = mapSeverityToUrgency(local.severity)
  const top = local.possible_diseases[0]

  return {
    possibleCondition: possibleConditions[0] || "undifferentiated illness",
    possibleConditions,
    urgency,
    explanation: local.reasoning,
    remedy: local.action_message,
    lifestyle: local.referral_note,
    disclaimer: "This is supportive guidance, not a confirmed diagnosis. Please consult a qualified doctor.",
    emergencyWarning: local.action === "emergency" ? "Emergency warning: seek immediate hospital care." : undefined,
    nextStep: local.action === "home_care" ? "Continue home care and monitor for 48 hours." : local.action === "visit_doctor" ? "Consult a doctor/PHC within 24 hours." : "Seek emergency care immediately.",
    nearbySpecialistType: specialistFromDisease(top?.disease || ""),
    homeCare: local.home_remedies,
    warningSigns: deriveWarningSigns(local),
    confidenceNote: top ? `Top condition confidence: ${top.confidence}%.` : "Low confidence due to limited symptom overlap.",
  }
}

function buildHealthAdviceResponse(result: TriageResult) {
  return `Possible conditions:\n- ${result.possibleConditions?.join("\n- ") || result.possibleCondition}\n\nUrgency: ${result.urgency}\nReason: ${result.explanation}\nNext step: ${result.nextStep}\nNearby specialist: ${result.nearbySpecialistType}\nHome care:\n- ${(result.homeCare || []).join("\n- ") || result.remedy}\nWarning signs:\n- ${(result.warningSigns || []).join("\n- ") || "Worsening symptoms"}\nConfidence note: ${result.confidenceNote}`
}

function normalizeSymptoms(text: string): string[] {
  const dictionary: Record<string, string> = {
    fever: "high_fever",
    highfever: "high_fever",
    cough: "persistent_cough",
    cold: "runny_nose",
    sneezing: "sneezing",
    throat: "sore_throat",
    headache: "headache",
    severeheadache: "severe_headache",
    chestpain: "chest_pain",
    breathless: "difficulty_breathing",
    breathing: "difficulty_breathing",
    vomiting: "vomiting",
    nausea: "nausea",
    stomachache: "stomach_pain",
    stomachpain: "stomach_pain",
    diarrhea: "diarrhea",
    dizzy: "dizziness",
    dizziness: "dizziness",
    weakness: "weakness",
    rash: "rash",
  }

  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .map((word) => dictionary[word] || "")
        .filter(Boolean),
    ),
  )
}

function normalizeHistory(history?: string): string[] {
  if (!history) return []
  return history
    .toLowerCase()
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeLocation(area?: string): string {
  return area ? `rural_${area.toLowerCase().replace(/[^a-z0-9]+/g, "_")}` : "rural_unknown"
}

function specialistFromDisease(disease: string): string {
  const value = disease.toLowerCase()
  if (value.includes("hypertension") || value.includes("heart")) return "Cardiologist"
  if (value.includes("gastro") || value.includes("typhoid")) return "Gastroenterologist"
  if (value.includes("tuberculosis")) return "Pulmonologist"
  return "General Physician"
}

function deriveWarningSigns(local: SwasthyaResponse): string[] {
  if (local.action === "emergency") {
    return ["breathing difficulty", "chest pain", "confusion", "unconsciousness"]
  }
  return ["persistent high fever", "symptoms worsening after 48 hours", "new severe pain"]
}
