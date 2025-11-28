import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedBookingRequest, ServiceItem, ShopSettings, ChatMessage, VisagismoResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️ ERROR CRÍTICO: No se encontró VITE_GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

const MODEL_NAME = "gemini-2.0-flash"; // Usamos modelo rápido

// Mapa de traducción para que la IA no se confunda
const DAY_TRANSLATIONS: Record<string, string> = {
  sunday: 'Domingo',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado'
};

const formatScheduleForAI = (settings: ShopSettings): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return days.map(day => {
    const schedule = settings.schedule[day];
    // Usamos el nombre en Español para coincidir con "HOY: Lunes..."
    const dayName = DAY_TRANSLATIONS[day] || day;
    
    if (!schedule || !schedule.isOpen) {
      return `- ${dayName}: CERRADO`;
    }
    
    if (schedule.ranges.length === 0) {
      return `- ${dayName}: CERRADO (Sin turnos configurados)`;
    }

    const ranges = schedule.ranges.map(r => `${r.start}-${r.end}`).join(', ');
    return `- ${dayName}: ${ranges}`;
  }).join('\n');
};

const cleanResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
};

export const parseBookingMessage = async (
    currentMessage: string, 
    chatHistory: ChatMessage[],
    busySlots: string, 
    services: ServiceItem[],
    settings: ShopSettings,
    isDirectClientMode: boolean = false
): Promise<ParsedBookingRequest> => {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const dayName = now.toLocaleDateString('es-ES', { weekday: 'long' });
  // Agregamos la hora actual para que la IA sepa si el turno mañana ya pasó
  const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

  const servicesList = services.map(s => 
    `- ${s.name}: $${s.price} (Dura aprox ${s.durationMinutes} mins)`
  ).join('\n');

  const scheduleString = formatScheduleForAI(settings);

  const historyContext = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'CLIENT/USER' : 'AI_AGENT'} said: "${msg.text}"`
  ).join('\n');

  const systemInstruction = `
Eres "BarberPro AI", asistente de barbería.

MODO: ${isDirectClientMode ? 'Cliente Web Directo' : 'Asistente Admin (WhatsApp)'}.
OBJETIVO: Agendar citas. NO confirmes sin Nombre, Fecha y Hora.

CONTEXTO ACTUAL:
- FECHA: ${dayName}, ${todayISO}
- HORA ACTUAL: ${currentTime}

HORARIOS DE ATENCIÓN:
${scheduleString}

SERVICIOS DISPONIBLES:
${servicesList}

TURNOS YA OCUPADOS (NO AGENDAR AQUÍ):
${busySlots}

FORMATO DE RESPUESTA OBLIGATORIO (JSON PURO):
Debes responder SIEMPRE con un único objeto JSON válido.
Usa comillas dobles. Sin markdown.

{
  "thought_process": "Razonamiento breve...",
  "suggestedReply": "Respuesta amable al cliente...",
  "isComplete": boolean (true solo si tienes dia, hora y nombre),
  "clientName": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" | null,
  "service": string | null,
  "stylePreference": string | null
}
`;
  
  try {
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(`
        HISTORIAL:
        ${historyContext}

        NUEVO MENSAJE: "${currentMessage}"
      `);

      const text = result.response.text();
      
      if (!text) throw new Error("Respuesta vacía de IA");
      
      const cleanText = cleanResponse(text);
      return JSON.parse(cleanText) as ParsedBookingRequest;

  } catch (error) {
      console.error("AI Error:", error);
      return {
          thought_process: "Error técnico.",
          suggestedReply: "Tuve un pequeño error de conexión. ¿Podrías repetirme qué día y hora buscabas?",
          isComplete: false
      };
  }
};

export const suggestStyle = async (clientHistory: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(`Eres barbero experto. Sugiere estilo breve (max 20 palabras) para: ${clientHistory}`);
        return result.response.text() || "Sin sugerencia.";
    } catch (e) {
        return "Servicio no disponible.";
    }
}

export const getVisagismAdvice = async (faceShape: string, hairType: string): Promise<VisagismoResult> => {
  try {
      const model = genAI.getGenerativeModel({ 
          model: MODEL_NAME,
          generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(`
        Experto en Visagismo. Rostro: "${faceShape}", Pelo: "${hairType}".
        3 cortes recomendados. JSON format: { "faceShape": string, "recommendations": [{ "name": string, "description": string }] }
      `);

      const text = result.response.text();
      return JSON.parse(cleanResponse(text)) as VisagismoResult;
  } catch (e) {
      console.error(e);
      return { faceShape, recommendations: [] };
  }
};
