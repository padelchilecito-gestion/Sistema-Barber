import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedBookingRequest, ServiceItem, ShopSettings, ChatMessage, VisagismoResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️ ERROR CRÍTICO: No se encontró VITE_GEMINI_API_KEY. Revisa tu archivo .env");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

// --- CONFIGURACIÓN DEL MODELO ---
// Usamos 'gemini-1.5-flash'. Este es el modelo estándar actual.
// Si esto da error 404, es 100% seguro que necesitas crear una nueva API Key en aistudio.google.com
const MODEL_NAME = "gemini-2.5-flash"; 

const DAY_TRANSLATIONS: Record<string, string> = {
  sunday: 'Domingo', monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado'
};

const formatScheduleForAI = (settings: ShopSettings): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.map(day => {
    const schedule = settings.schedule[day];
    const dayName = DAY_TRANSLATIONS[day] || day;
    if (!schedule || !schedule.isOpen || schedule.ranges.length === 0) return `- ${dayName}: CERRADO`;
    const ranges = schedule.ranges.map(r => `${r.start}-${r.end}`).join(', ');
    return `- ${dayName}: ${ranges}`;
  }).join('\n');
};

const cleanResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.includes('```')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.substring(firstBrace, lastBrace + 1);
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
  const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

  const servicesList = services.map(s => `- ${s.name}: $${s.price} (${s.durationMinutes} mins)`).join('\n');
  const scheduleString = formatScheduleForAI(settings);

  const historyContext = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'CLIENT/USER' : 'AI_AGENT'} said: "${msg.text}"`
  ).join('\n');

  const systemInstruction = `
Eres "BarberPro AI", asistente de barbería.
OBJETIVO: Agendar citas. NO confirmes sin Nombre, Fecha y Hora.

DATOS EN TIEMPO REAL:
- FECHA DE HOY: ${dayName}, ${todayISO}
- HORA ACTUAL: ${currentTime}

⚠️ REGLA DE ORO (CRÍTICA):
Si el cliente pide turno para HOY (${todayISO}), ESTÁ PROHIBIDO ofrecer horarios anteriores a ${currentTime}.

HORARIOS DE ATENCIÓN:
${scheduleString}

SERVICIOS:
${servicesList}

TURNOS OCUPADOS:
${busySlots}

Responde SIEMPRE en JSON válido:
{
  "thought_process": "Razonamiento...",
  "suggestedReply": "Respuesta al cliente...",
  "isComplete": boolean,
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

      const result = await model.generateContent(`HISTORIAL:\n${historyContext}\n\nNUEVO MENSAJE: "${currentMessage}"`);
      const text = result.response.text();
      if (!text) throw new Error("Respuesta vacía");
      return JSON.parse(cleanResponse(text)) as ParsedBookingRequest;
  } catch (error) {
      console.error("AI Error:", error);
      return {
          thought_process: "Error de conexión",
          suggestedReply: "Estoy teniendo problemas para conectar con mi cerebro digital. Por favor, intenta de nuevo en unos segundos o verifica tu conexión.",
          isComplete: false
      };
  }
};

export const suggestStyle = async (clientHistory: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(`Sugerencia estilo breve: ${clientHistory}`);
        return result.response.text();
    } catch (e) { return "N/A"; }
}

export const getVisagismAdvice = async (faceShape: string, hairType: string): Promise<VisagismoResult> => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(`Visagismo: ${faceShape}, ${hairType}. JSON output.`);
        return JSON.parse(cleanResponse(result.response.text())) as VisagismoResult;
    } catch (e) { return { faceShape, recommendations: [] }; }
};
