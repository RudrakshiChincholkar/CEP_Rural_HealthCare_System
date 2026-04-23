import outbreakAlerts from "@/data/outbreak-alerts.json"

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

class LlamaAIService implements AIService {
  private fallback = new RuleEngineAIService()

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
