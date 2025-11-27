import { GoogleGenAI, Type } from "@google/genai";
import { ParsedBookingRequest, ServiceItem, ShopSettings, ChatMessage, VisagismoResult } from "../types";

// CORRECCIÓN PRINCIPAL: Usamos el estándar de Vite para variables de entorno
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Validación de seguridad para desarrollo
if (!apiKey) {
  console.error("⚠️ ERROR CRÍTICO: No se encontró VITE_GEMINI_API_KEY. Revisa tus variables de entorno en Vercel o .env.local");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key" }); // "dummy-key" evita que la app explote al iniciar si falta la clave, aunque la llamada fallará luego.

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

  // Create a readable list of services for the AI
  const servicesList = services.map(s => 
    `- ${s.name}: $${s.price} (Dura aprox ${s.durationMinutes} mins)`
  ).join('\n');

  // Format the complex weekly schedule into a string
  const scheduleString = formatScheduleForAI(settings);

  // Format Chat History for Context
  const historyContext = chatHistory.slice(-10).map(msg => // Take last 10 messages for context
      `${msg.role === 'user' ? 'CLIENT/USER' : 'AI_AGENT'} said: "${msg.text}"`
  ).join('\n');

  // The User's custom Persona and Rules integrated into the System Instruction
  const systemInstruction = `
Eres "BarberPro AI", el asistente inteligente y experto de una barbería premium. Tu tono es profesional, cercano, moderno y eficiente (estilo "barbero de confianza").

TIENES DOS MODOS DE OPERACIÓN (Detecta el contexto según el input del usuario):

### MODO 1: INTERACCIÓN CON CLIENTE (Auto-Reserva)
- ${isDirectClientMode ? 'Estás hablando DIRECTAMENTE con el cliente en la Web App.' : 'Estás actuando como asistente del barbero, sugiriendo qué responder por WhatsApp.'}
- Tu objetivo es guiar al usuario para agendar un turno.
- NUNCA confirmes un turno definitivamente en el texto de respuesta ('suggestedReply') hasta que tengas Fecha, Hora y Nombre, y hayas verificado que NO choca con 'busySlots' ni horarios de cierre.
- Si faltan datos, pídelos amablemente.
- Sé conciso. La gente en chat lee poco.

### MODO 2: VISAGISMO (Asesor de Imagen)
- Si el usuario pide recomendación o describe su rostro/pelo, actúa como un estilista experto.
- Analiza: Forma de rostro (cuadrado, ovalado, etc.) y Tipo de pelo si se mencionan.
- Recomienda: 1 o 2 cortes específicos explicando POR QUÉ técnicamente favorecen sus rasgos.
- Guarda la idea del corte o rasgos en el campo JSON 'stylePreference'.

### CONTEXTO DEL NEGOCIO (Datos Reales)
1. FECHA Y HORA ACTUAL: ${dayName}, ${todayISO}.
2. HORARIOS DE ATENCIÓN (Respeta estrictamente los huecos y cierres):
${scheduleString}
3. SERVICIOS Y PRECIOS:
${servicesList}
4. TURNOS YA OCUPADOS (Busy Slots - NO AGENDAR AQUÍ):
${busySlots}

### TAREAS DE RAZONAMIENTO:
1. Analiza el "MENSAJE ACTUAL" usando el "HISTORIAL DE CHAT".
2. Verifica disponibilidad. Si el usuario pide un horario ocupado o cerrado, ofrécele alternativas cercanas.
3. Genera un razonamiento interno breve ('thought_process').
4. Genera el JSON de salida requerido.

### REGLAS DE SALIDA (JSON SCHEMAS):
Debes responder SIEMPRE con un JSON válido compatible con la aplicación.
- 'thought_process': Breve razonamiento sobre la intención del usuario y disponibilidad.
- 'suggestedReply': La respuesta amable y natural para el usuario.
- 'isComplete': TRUE solo si tienes Nombre (o es Guest), Fecha (YYYY-MM-DD), Hora (HH:mm) y el turno es válido/libre.
- 'stylePreference': Si detectas detalles de estilo o visagismo, ponlos aquí.
`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
    CONTEXTO DE LA CONVERSACIÓN:
    ${historyContext}

    MENSAJE ACTUAL DEL USUARIO: "${currentMessage}"
    `,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          thought_process: { type: Type.STRING, description: "Internal reasoning about user intent and availability" },
          clientName: { type: Type.STRING, nullable: true },
          date: { type: Type.STRING, description: "YYYY-MM-DD format if detected, else null", nullable: true },
          time: { type: Type.STRING, description: "HH:mm format if detected, else null", nullable: true },
          service: { type: Type.STRING, nullable: true },
          stylePreference: { type: Type.STRING, description: "Description of the desired look/cut or visagism advice", nullable: true },
          suggestedReply: { type: Type.STRING, description: "La respuesta amable y natural para el usuario." },
          isComplete: { type: Type.BOOLEAN, description: "True ONLY if Date AND Time are valid AND the slot is effectively free/agreed upon." }
        },
        required: ["suggestedReply", "isComplete", "thought_process"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as ParsedBookingRequest;
};

export const suggestStyle = async (clientHistory: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Eres un barbero experto. Basado en estas notas de cortes anteriores de un cliente, sugiere una nueva tendencia o un refinamiento para su próxima visita. Sé breve (max 2 oraciones) en Español. Notas: ${clientHistory}`,
    });
    return response.text || "No se pudo generar una sugerencia.";
}

export const getVisagismAdvice = async (faceShape: string, hairType: string): Promise<VisagismoResult> => {
  const prompt = `
    Eres "BarberPro AI", un Consultor Experto en Visagismo.
    El usuario tiene un rostro "${faceShape}" y cabello tipo "${hairType}".
    Sugiere 3 cortes de cabello específicos que favorezcan esta combinación.
    Para cada recomendación, da un nombre atractivo y una explicación técnica de 1 oración de por qué funciona (en Español).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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
  if (!text) throw new Error("AI failed to generate advice");
  return JSON.parse(text) as VisagismoResult;
};
