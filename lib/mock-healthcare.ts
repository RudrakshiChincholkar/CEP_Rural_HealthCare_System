export type Doctor = {
  name: string
  specialization: string
  hospital: string
  city: string
  contact: string
  experience: string
  consultationFee: number
  rating: number
  languages: string[]
  availability: string
  aboutUrl: string
}

export type HealthCenter = {
  name: string
  address: string
  city: string
  type: "public" | "private" | "clinic" | "medical"
  contact: string
  distanceKm: number
  latitude: number
  longitude: number
}

export const DOCTORS: Doctor[] = [
  {
    name: "Dr. Sharma",
    specialization: "General Physician",
    hospital: "City Care Clinic",
    city: "Mumbai",
    contact: "+91-9000000001",
    experience: "9 years",
    consultationFee: 700,
    rating: 4.4,
    languages: ["English", "Hindi", "Marathi"],
    availability: "Mon-Sat, 10:00 AM - 6:00 PM",
    aboutUrl: "https://example.com/doctors/dr-sharma",
  },
  {
    name: "Dr. Patel",
    specialization: "Dermatologist",
    hospital: "Sunrise Hospital",
    city: "Mumbai",
    contact: "+91-9000000002",
    experience: "12 years",
    consultationFee: 1000,
    rating: 4.6,
    languages: ["English", "Hindi", "Gujarati"],
    availability: "Mon-Fri, 11:00 AM - 7:00 PM",
    aboutUrl: "https://example.com/doctors/dr-patel",
  },
  {
    name: "Dr. Iyer",
    specialization: "Pediatrician",
    hospital: "Health First Center",
    city: "Pune",
    contact: "+91-9000000003",
    experience: "11 years",
    consultationFee: 900,
    rating: 4.5,
    languages: ["English", "Hindi", "Tamil"],
    availability: "Mon-Sat, 9:00 AM - 4:00 PM",
    aboutUrl: "https://example.com/doctors/dr-iyer",
  },
  {
    name: "Dr. Khan",
    specialization: "Cardiologist",
    hospital: "Metro Heart Institute",
    city: "Mumbai",
    contact: "+91-9000000004",
    experience: "15 years",
    consultationFee: 1500,
    rating: 4.7,
    languages: ["English", "Hindi", "Urdu"],
    availability: "Mon-Sat, 12:00 PM - 8:00 PM",
    aboutUrl: "https://example.com/doctors/dr-khan",
  },
  {
    name: "Dr. Fernandes",
    specialization: "ENT Specialist",
    hospital: "Seaside Multispeciality",
    city: "Mumbai",
    contact: "+91-9000000005",
    experience: "10 years",
    consultationFee: 1200,
    rating: 4.6,
    languages: ["English", "Hindi", "Marathi"],
    availability: "Mon-Fri, 9:00 AM - 5:00 PM",
    aboutUrl: "https://example.com/doctors/dr-fernandes",
  },
  {
    name: "Dr. Kulkarni",
    specialization: "Psychologist",
    hospital: "MindCare Clinic",
    city: "Mumbai",
    contact: "+91-9000000006",
    experience: "8 years",
    consultationFee: 900,
    rating: 4.8,
    languages: ["English", "Hindi", "Marathi"],
    availability: "Tue-Sun, 2:00 PM - 9:00 PM",
    aboutUrl: "https://example.com/doctors/dr-kulkarni",
  },
  {
    name: "Dr. Joshi",
    specialization: "Pulmonologist",
    hospital: "Airway Health Center",
    city: "Mumbai",
    contact: "+91-9000000007",
    experience: "13 years",
    consultationFee: 1300,
    rating: 4.5,
    languages: ["English", "Hindi", "Marathi"],
    availability: "Mon-Sat, 10:30 AM - 6:30 PM",
    aboutUrl: "https://example.com/doctors/dr-joshi",
  },
]

export const HEALTH_CENTERS: HealthCenter[] = [
  {
    name: "KEM Hospital",
    address: "Acharya Donde Marg, Parel",
    city: "Mumbai",
    type: "public",
    contact: "+91-22-2410-7000",
    distanceKm: 2.4,
    latitude: 18.9995,
    longitude: 72.8406,
  },
  {
    name: "Lilavati Hospital",
    address: "A-791, Bandra Reclamation, Bandra West",
    city: "Mumbai",
    type: "private",
    contact: "+91-22-2675-1000",
    distanceKm: 6.1,
    latitude: 19.0511,
    longitude: 72.8296,
  },
  {
    name: "Sion Polyclinic",
    address: "Sion Circle, Sion East",
    city: "Mumbai",
    type: "clinic",
    contact: "+91-22-2407-6000",
    distanceKm: 4.3,
    latitude: 19.0432,
    longitude: 72.8619,
  },
  {
    name: "Ruby Hall Clinic",
    address: "Sassoon Road, Pune",
    city: "Pune",
    type: "medical",
    contact: "+91-20-6645-5100",
    distanceKm: 3.2,
    latitude: 18.5362,
    longitude: 73.8771,
  },
]

export const HEALTH_NEWS = [
  {
    title: "Heatwave Advisory for Maharashtra",
    description: "Health officials advise hydration and avoiding peak afternoon sun.",
    content:
      "Public health departments have issued preventive guidance for vulnerable groups, including children and elderly people.",
    url: "https://example.com/news/heatwave-advisory",
    source: "Health Bulletin India",
    date: "2026-04-20T09:30:00Z",
  },
  {
    title: "Monsoon Disease Preparedness Drive",
    description: "Urban clinics begin awareness drives on dengue and water safety.",
    content:
      "Local civic bodies have started neighborhood awareness sessions and vector control campaigns ahead of monsoon season.",
    url: "https://example.com/news/monsoon-drive",
    source: "Public Health Desk",
    date: "2026-04-18T13:15:00Z",
  },
]

const symptomAdvice: Record<string, string[]> = {
  fever: ["Stay hydrated", "Track temperature every 6 hours", "Consult a doctor if fever lasts beyond 2 days"],
  cough: ["Use warm fluids", "Avoid dust/smoke exposure", "Seek care if breathing becomes difficult"],
  headache: ["Hydrate and rest in a dark room", "Avoid excessive screen time", "Check blood pressure if persistent"],
}

export function getMockAdvice(question: string) {
  const q = question.toLowerCase()
  const key = Object.keys(symptomAdvice).find((term) => q.includes(term))
  const points = key ? symptomAdvice[key] : ["Rest well", "Drink enough water", "Consult a nearby physician for proper diagnosis"]

  return {
    response: points.join("\n"),
    summary:
      "This is a general guidance response for educational support only. If symptoms are severe or persist, please consult a qualified doctor in person.",
  }
}
