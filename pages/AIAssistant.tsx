import React, { useState, useRef, useEffect } from 'react';
import { parseBookingMessage } from '../services/geminiService';
import { ParsedBookingRequest, AppointmentStatus, ChatMessage } from '../types';
import { useApp } from '../store/AppContext';
import { MessageSquare, Send, Copy, Bot, User, CheckCircle, CalendarPlus, Loader2, Scissors, CalendarCheck, Smartphone } from 'lucide-react';

interface AIAssistantProps {
    navigateToCalendar?: () => void;
    isGuestMode?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ navigateToCalendar, isGuestMode = false }) => {
  const { addAppointment, appointments, services, settings } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [lastBookingData, setLastBookingData] = useState<ParsedBookingRequest | null>(null);
  
  const initialMessage = isGuestMode 
    ? '¡Hola! 👋 Soy el asistente virtual de la barbería. ¿Qué día y hora te gustaría reservar tu turno?'
    : '¡Hola! Pega aquí los mensajes de WhatsApp. Yo revisaré tu agenda automáticamente para ver disponibilidad antes de sugerir una respuesta.';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: initialMessage
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBusySlotsContext = () => {
    const now = new Date();
    const upcoming = appointments.filter(a => {
        const aptDate = new Date(`${a.date}T${a.time}`);
        return aptDate >= now && a.status !== AppointmentStatus.CANCELLED;
    });
    if (upcoming.length === 0) return "No hay turnos ocupados próximamente.";
    return upcoming.map(a => `- ${a.date} a las ${a.time} (${a.clientName})`).join('\n');
  };

  const handleAnalyze = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const busySlots = getBusySlotsContext();
      const parsed = await parseBookingMessage(userMsg.text, updatedHistory, busySlots, services, settings, isGuestMode);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: parsed.suggestedReply,
        bookingData: parsed
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Tuve un pequeño problema de conexión. Por favor, dime de nuevo la fecha y hora.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = (data: ParsedBookingRequest) => {
    const date = data.date || new Date().toISOString().split('T')[0];
    const time = data.time || '10:00';
    
    const matchedService = services.find(s => s.name.toLowerCase() === data.service?.toLowerCase());
    const price = matchedService ? matchedService.price : 15;

    const initialStatus = isGuestMode ? AppointmentStatus.PENDING : AppointmentStatus.CONFIRMED;

    addAppointment({
        id: Date.now().toString(),
        clientId: isGuestMode ? 'web-guest' : 'whatsapp-import',
        clientName: data.clientName || (isGuestMode ? 'Cliente Web' : 'Cliente WhatsApp'),
        service: data.service || 'Corte General',
        stylePreference: data.stylePreference || '', 
        date: date,
        time: time,
        price: price, 
        status: initialStatus 
    });

    if (isGuestMode) {
        setBookingConfirmed(true);
        setLastBookingData(data); // Guardamos datos para el link de WhatsApp
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            text: '¡Solicitud enviada! Tu turno está pendiente de confirmación por la barbería.'
        }]);
    } else {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            text: `¡Listo! Agendé y confirmé a ${data.clientName || 'el cliente'} para el ${date} a las ${time}.`
        }]);
        if(navigateToCalendar) {
            setTimeout(() => navigateToCalendar(), 1500);
        }
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const handleWhatsAppRedirect = () => {
    if (!lastBookingData || !settings.contactPhone) return;

    const message = `Hola! Acabo de solicitar un turno en la web:%0A%0A📅 *Fecha:* ${lastBookingData.date}%0A⏰ *Hora:* ${lastBookingData.time}%0A👤 *Nombre:* ${lastBookingData.clientName || 'Cliente'}%0A✂️ *Servicio:* ${lastBookingData.service || 'Corte'}%0A%0AQuedo a la espera de confirmación. Gracias!`;

    window.open(`https://wa.me/${settings.contactPhone}?text=${message}`, '_blank');
  };

  // SUCCESS STATE FOR GUEST
  if (isGuestMode && bookingConfirmed) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in duration-500">
              <div className="bg-amber-500/10 p-8 rounded-full text-amber-500 mb-8 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <CalendarCheck size={80} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Solicitud Enviada</h2>
              <p className="text-slate-300 mb-8 max-w-xs mx-auto">Tu turno ha quedado registrado pendiente de confirmación.</p>
              
              {settings.contactPhone && (
                <button 
                    onClick={handleWhatsAppRedirect}
                    className="w-full bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                >
                    <Smartphone size={20} /> Enviar Confirmación por WhatsApp
                </button>
              )}

              <button 
                  onClick={() => window.location.reload()}
                  className="text-slate-500 font-medium hover:text-white transition-colors text-sm">
                  Solicitar otro turno
              </button>
          </div>
      )
  }

  return (
    <div className={`flex flex-col h-full ${isGuestMode ? 'max-w-xl mx-auto' : ''}`}>
      {/* HEADER */}
      <div className={`flex-none mb-4 flex items-center justify-between ${isGuestMode ? 'border-b border-slate-800 pb-4' : ''}`}>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {isGuestMode ? (
                  <div className="bg-amber-500 p-2 rounded-lg text-slate-900"><Scissors size={20}/></div>
                ) : (
                  <Bot className="text-amber-500" />
                )}
                {isGuestMode ? 'Reserva tu Turno' : 'BarberBot'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
                {isGuestMode ? 'Chatea con nuestra IA para ver disponibilidad.' : 'Tu asistente virtual (Modo Admin).'}
            </p>
          </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-6 p-2 md:p-4 rounded-2xl ${isGuestMode ? '' : 'bg-slate-800/50 border border-slate-700 mb-4'}`}>
          {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      
                      {/* Bubble */}
                      <div className={`px-5 py-3.5 rounded-2xl relative shadow-md text-sm md:text-base ${
                          msg.role === 'user' 
                          ? 'bg-amber-600 text-white rounded-tr-sm' 
                          : 'bg-slate-700 text-slate-100 rounded-tl-sm'
                      }`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          
                          {msg.role === 'assistant' && !isGuestMode && (
                              <button 
                                onClick={() => copyToClipboard(msg.text)}
                                className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity bg-black/10 hover:bg-black/20 p-1.5 rounded"
                                title="Copiar respuesta"
                              >
                                  <Copy size={14} />
                              </button>
                          )}
                      </div>

                      <span className="text-[10px] text-slate-500 mt-1 px-1 opacity-70">
                          {msg.role === 'user' ? 'Tú' : 'BarberBot'}
                      </span>

                      {/* Booking Action Card */}
                      {msg.role === 'assistant' && msg.bookingData && msg.bookingData.isComplete && !bookingConfirmed && (
                          <div className="mt-3 bg-slate-800 border border-green-500/30 rounded-xl p-4 w-full animate-in slide-in-from-top-2 fade-in duration-500 shadow-xl">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                                  <CheckCircle size={18} className="text-green-500"/>
                                  <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">
                                      {isGuestMode ? 'Confirmar Datos' : 'Turno Listo'}
                                  </span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-4">
                                  <div>
                                      <span className="text-slate-500 text-xs block mb-0.5">Fecha</span>
                                      <p className="text-white font-mono text-base">{msg.bookingData.date}</p>
                                  </div>
                                  <div>
                                      <span className="text-slate-500 text-xs block mb-0.5">Hora</span>
                                      <p className="text-white font-mono text-base">{msg.bookingData.time}</p>
                                  </div>
                                  {msg.bookingData.clientName && (
                                    <div className="col-span-2">
                                        <span className="text-slate-500 text-xs block mb-0.5">Nombre</span>
                                        <p className="text-white font-medium">{msg.bookingData.clientName}</p>
                                    </div>
                                  )}
                                  {msg.bookingData.stylePreference && (
                                    <div className="col-span-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-500 text-xs block mb-0.5 flex items-center gap-1"><Scissors size={10}/> Estilo Solicitado</span>
                                        <p className="text-amber-400 font-medium italic text-xs">"{msg.bookingData.stylePreference}"</p>
                                    </div>
                                  )}
                              </div>
                              <button 
                                onClick={() => handleCreateBooking(msg.bookingData!)}
                                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20 active:scale-95 transform duration-100">
                                  <CalendarPlus size={18} /> {isGuestMode ? '¡Enviar Solicitud!' : 'Agendar Turno'}
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          ))}
          {loading && (
              <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 text-slate-400 px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-3 shadow-sm">
                      <Loader2 className="animate-spin text-amber-500" size={18} />
                      <span className="text-sm font-medium animate-pulse">{isGuestMode ? 'Consultando agenda...' : 'Analizando...'}</span>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className={`p-3 rounded-2xl border flex items-end gap-2 shadow-2xl ${isGuestMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-800 border-slate-700'}`}>
          <textarea 
            className="flex-1 bg-transparent text-white p-3 max-h-[120px] outline-none resize-none placeholder:text-slate-600 font-medium"
            placeholder={isGuestMode ? "Escribe aquí... (ej: Quiero un fade y la barba marcada)" : "Pega aquí el mensaje..."}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                }
            }}
          />
          <button 
            onClick={handleAnalyze}
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl transition-colors disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 mb-1"
          >
              <Send size={20} />
          </button>
      </div>
    </div>
  );
};

export default AIAssistant;
