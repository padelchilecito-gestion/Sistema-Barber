import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedBookingRequest, ServiceItem, ShopSettings, ChatMessage, VisagismoResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️ ERROR CRÍTICO: No se encontró VITE_GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

// Usamos el modelo 2.5 que sabemos que te funciona (no da 404)
const MODEL_NAME = "gemini-2.5-flash"; 

const formatScheduleForAI = (settings: ShopSettings): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return days.map(day => {
    const schedule = settings.schedule[day];
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    
    if (!schedule.isOpen) {
      return `- ${dayName}: CLOSED`;
    }
    const ranges = schedule.ranges.map(r => `${r.start}-${r.end}`).join(', ');
    return `- ${dayName}: ${ranges}`;
  }).join('\n');
};

// --- MEJORA: LIMPIEZA AGRESIVA DE JSON ---
const cleanResponse = (text: string): string => {
  let cleaned = text.trim();
  
  // 1. Quitar bloques de markdown ```json ... ```
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
  }

  // 2. Buscar el primer '{' y el último '}' para ignorar texto basura alrededor
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

  const servicesList = services.map(s => 
    `- ${s.name}: $${s.price} (Dura aprox ${s.durationMinutes} mins)`
  ).join('\n');

  const scheduleString = formatScheduleForAI(settings);

  const historyContext = chatHistory.slice(-10).map(msg => 
      `${msg.role === 'user' ? 'CLIENT/USER' : 'AI_AGENT'} said: "${msg.text}"`
  ).join('\n');

  // INSTRUCCIÓN REFORZADA: Exigimos formato estricto
  const systemInstruction = `
Eres "BarberPro AI", asistente de barbería.

MODO: ${isDirectClientMode ? 'Cliente Web Directo' : 'Asistente Admin (WhatsApp)'}.
OBJETIVO: Agendar citas. NO confirmes sin Nombre, Fecha y Hora.

CONTEXTO:
- HOY: ${dayName}, ${todayISO}
- HORARIOS: \n${scheduleString}
- SERVICIOS: \n${servicesList}
- OCUPADO: \n${busySlots}

FORMATO DE RESPUESTA OBLIGATORIO (JSON PURO):
Debes responder SIEMPRE con un único objeto JSON válido.
Usa comillas dobles para todas las claves y cadenas.
NO escribas texto fuera del JSON.

Ejemplo válido:
{
  "thought_process": "El cliente quiere cortar hoy...",
  "suggestedReply": "Hola, tengo turno a las 10:00",
  "isComplete": false,
  "clientName": null,
  "date": null,
  "time": null,
  "service": null,
  "stylePreference": null
}
`;
  
  try {
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        systemInstruction: systemInstruction,
        // Simplificamos la config para evitar conflictos con el modelo beta
        generationConfig: {
            responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(`
        HISTORIAL CHAT:
        ${historyContext}

        NUEVO MENSAJE: "${currentMessage}"
        
        RECORDATORIO: RESPONDE SOLO CON JSON VÁLIDO.
      `);

      const text = result.response.text();
      console.log("Raw AI Response:", text); // Para depuración en consola si falla
      
      if (!text) throw new Error("Respuesta vacía de IA");
      
      const cleanText = cleanResponse(text);
      return JSON.parse(cleanText) as ParsedBookingRequest;

  } catch (error) {
      console.error("AI Error:", error);
      // Fallback para que la app no se rompa
      return {
          thought_process: "Error de formato o conexión.",
          suggestedReply: "Tuve un pequeño error técnico. ¿Podrías repetirme qué día y hora buscabas?",
          isComplete: false
      };
  }
};

export const suggestStyle = async (clientHistory: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(`Eres barbero. Sugiere estilo breve (2 frases) para: ${clientHistory}`);
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
        3 cortes recomendados.
        JSON format: { "faceShape": string, "recommendations": [{ "name": string, "description": string }] }
      `);

      const text = result.response.text();
      return JSON.parse(cleanResponse(text)) as VisagismoResult;
  } catch (e) {
      console.error(e);
      return { faceShape, recommendations: [] };
  }
};
