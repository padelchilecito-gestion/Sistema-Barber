import { GoogleGenAI, Type } from "@google/genai";
import { ParsedBookingRequest, ServiceItem, ShopSettings, ChatMessage, VisagismoResult } from "../types";

// Usamos el estándar de Vite para variables de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("⚠️ ERROR CRÍTICO: No se encontró VITE_GEMINI_API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

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

// Función auxiliar para limpiar la respuesta de la IA antes de parsear
const cleanResponse = (text: string): string => {
  let cleaned = text.trim();
  // Si la IA devuelve bloques de código markdown, los quitamos
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
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

  const systemInstruction = `
Eres "BarberPro AI", el asistente inteligente y experto de una barbería premium.

TIENES DOS MODOS DE OPERACIÓN:

### MODO 1: INTERACCIÓN CON CLIENTE (Auto-Reserva)
- ${isDirectClientMode ? 'Hablas DIRECTAMENTE con el cliente en la Web App.' : 'Asistente del barbero para WhatsApp.'}
- Objetivo: Guiar al usuario para agendar.
- NUNCA confirmes un turno (isComplete: true) sin tener: Nombre, Fecha (YYYY-MM-DD) y Hora (HH:mm) validada.
- Sé conciso.

### MODO 2: VISAGISMO
- Si piden recomendación, analiza rostro/pelo y sugiere.

### CONTEXTO:
1. AHORA: ${dayName}, ${todayISO}.
2. HORARIOS:
${scheduleString}
3. SERVICIOS:
${servicesList}
4. OCUPADO:
${busySlots}

### SALIDA JSON (ESTRICTO):
Responde SOLO con un JSON válido. No uses markdown. No pongas texto antes ni después.
{
  "thought_process": "razonamiento breve...",
  "suggestedReply": "respuesta para el usuario...",
  "isComplete": boolean,
  "clientName": string | null,
  "date": string | null,
  "time": string | null,
  "service": string | null,
  "stylePreference": string | null
}
`;
  
  try {
      // CAMBIO IMPORTANTE: Usamos 'gemini-1.5-flash' que es estable para JSON
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash", 
        contents: `
        HISTORIAL:
        ${historyContext}

        MENSAJE USUARIO: "${currentMessage}"
        `,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          // Definimos el esquema pero confiamos en la limpieza manual también
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thought_process: { type: Type.STRING },
              clientName: { type: Type.STRING, nullable: true },
              date: { type: Type.STRING, nullable: true },
              time: { type: Type.STRING, nullable: true },
              service: { type: Type.STRING, nullable: true },
              stylePreference: { type: Type.STRING, nullable: true },
              suggestedReply: { type: Type.STRING },
              isComplete: { type: Type.BOOLEAN }
            },
            required: ["suggestedReply", "isComplete", "thought_process"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      // Limpiamos y parseamos
      const cleanText = cleanResponse(text);
      return JSON.parse(cleanText) as ParsedBookingRequest;

  } catch (error) {
      console.error("AI Error:", error);
      // Fallback seguro para no romper la app
      return {
          thought_process: "Error en IA, modo fallback",
          suggestedReply: "Lo siento, tuve un error procesando tu mensaje. ¿Podrías repetirlo?",
          isComplete: false
      };
  }
};

export const suggestStyle = async (clientHistory: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `Eres un barbero experto. Sugiere un estilo brevemente (max 2 oraciones) basado en: ${clientHistory}`,
        });
        return response.text || "No se pudo generar una sugerencia.";
    } catch (e) {
        return "Servicio de estilo no disponible.";
    }
}

export const getVisagismAdvice = async (faceShape: string, hairType: string): Promise<VisagismoResult> => {
  const prompt = `
    Eres experto en Visagismo. Rostro: "${faceShape}", Pelo: "${hairType}".
    Sugiere 3 cortes. Responde SOLO JSON.
  `;

  try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              faceShape: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("AI failed");
      return JSON.parse(cleanResponse(text)) as VisagismoResult;
  } catch (e) {
      console.error(e);
      return { faceShape, recommendations: [] };
  }
};
