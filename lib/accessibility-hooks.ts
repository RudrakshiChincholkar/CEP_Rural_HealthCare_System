"use client"

export function speakText(text: string, lang: "en-IN" | "hi-IN" | "mr-IN" = "en-IN") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  window.speechSynthesis.speak(utterance)
}

export function startVoiceInput(
  onResult: (text: string) => void,
  lang: "en-IN" | "hi-IN" | "mr-IN" = "en-IN",
  onUnsupported?: () => void,
) {
  if (typeof window === "undefined") return
  const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  if (!Recognition) {
    onUnsupported?.()
    return
  }
  const recognition = new Recognition()
  recognition.lang = lang
  recognition.onresult = (event: any) => onResult(event.results?.[0]?.[0]?.transcript || "")
  recognition.start()
}

export function getSimpleLanguageCode(language: "English" | "Hindi" | "Marathi") {
  if (language === "Hindi") return "hi-IN"
  if (language === "Marathi") return "mr-IN"
  return "en-IN"
}

