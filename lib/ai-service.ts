import outbreakAlerts from "@/data/outbreak-alerts.json"

export interface AIService {
  askHealthQuestion(input: { question: string; area?: string }): Promise<string>
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

// Rule-engine fallback that always returns medically cautious responses.
class RuleEngineAIService implements AIService {
  async askHealthQuestion(input: { question: string; area?: string }) {
    const areaAlert = input.area
      ? outbreakAlerts.find((item) => item.area.toLowerCase() === input.area.toLowerCase())
      : null
    const areaText = areaAlert ? `In ${areaAlert.area}, possible ${areaAlert.disease} risk is ${areaAlert.risk}.` : ""
    return `${areaText} Based on your symptoms, this may indicate a common viral condition. Please monitor hydration, rest well, and consult a doctor for persistent or worsening symptoms.`
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
    const severe = ["self harm", "suicide", "end my life", "can't live"].some((term) => text.includes(term))
    const response = severe
      ? "I am concerned about your safety. Please contact emergency services or a trusted person immediately. You may also call Tele-MANAS 14416 in India."
      : "It sounds like you are going through stress. Try slow breathing, short walks, and sharing with someone you trust. If this continues, please consult a mental health professional."
    return { response, severe }
  }
}

export function getAIService(): AIService {
  // We use fallback by default to keep local execution stable without mandatory API keys.
  return new RuleEngineAIService()
}
