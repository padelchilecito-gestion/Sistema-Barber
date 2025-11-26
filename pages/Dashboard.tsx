
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { AppointmentStatus } from '../types';
import { Clock, CheckCircle, TrendingUp, User, MessageSquare, Link as LinkIcon, Copy, Check, Scissors } from 'lucide-react';

const Dashboard: React.FC<{ setTab: (t: string) => void }> = ({ setTab }) => {
  const { appointments, transactions } = useApp();
  const [copied, setCopied] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
  
  const dailyIncome = transactions
    .filter(t => t.date === today && t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=client`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-white">Hola, Barbero</h2>
        <p className="text-slate-400">Aquí está el resumen de hoy, {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex items-center space-x-2 text-amber-500 mb-2">
             <TrendingUp size={20} />
             <span className="text-sm font-medium">Ingresos Hoy</span>
          </div>
          <p className="text-2xl font-bold text-white">${dailyIncome}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex items-center space-x-2 text-blue-500 mb-2">
             <Clock size={20} />
             <span className="text-sm font-medium">Turnos Hoy</span>
          </div>
          <p className="text-2xl font-bold text-white">{todaysAppointments.length}</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 gap-4">
          {/* AI Assistant Action */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 relative overflow-hidden shadow-lg">
              <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2">Asistente IA</h3>
                  <p className="text-amber-100 mb-4 text-sm max-w-[80%]">Gestiona reservas desde WhatsApp o prueba el bot.</p>
                  <button 
                    onClick={() => setTab('assistant')}
                    className="bg-white text-amber-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-50 transition-colors shadow-sm"
                  >
                    Abrir Chat
                  </button>
              </div>
              <MessageSquare className="absolute -right-4 -bottom-4 text-amber-500 opacity-30" size={120} />
          </div>

          {/* Share Link Action */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-6 relative overflow-hidden shadow-lg">
              <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2">Link de Clientes</h3>
                  <p className="text-indigo-100 mb-4 text-sm max-w-[80%]">Comparte este enlace para que reserven solos.</p>
                  <button 
                    onClick={handleCopyLink}
                    className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    {copied ? <Check size={16}/> : <LinkIcon size={16}/>}
                    {copied ? '¡Copiado!' : 'Copiar Link'}
                  </button>
              </div>
              <LinkIcon className="absolute -right-4 -bottom-4 text-indigo-500 opacity-30" size={120} />
          </div>
      </div>

      {/* Today's Agenda Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Próximos Turnos</h3>
            <button onClick={() => setTab('calendar')} className="text-amber-500 text-sm hover:underline">Ver todo</button>
        </div>
        
        <div className="space-y-3">
          {todaysAppointments.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                No hay turnos para hoy.
            </div>
          ) : (
            todaysAppointments.map(apt => (
              <div key={apt.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:bg-slate-750 transition-colors">
                 <div className="flex items-center space-x-4">
                    <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
                        <span className="text-lg font-bold font-mono">{apt.time}</span>
                    </div>
                    <div>
                        <h4 className="font-medium text-white">{apt.clientName}</h4>
                        <div className="flex flex-col">
                            <p className="text-sm text-slate-400">{apt.service}</p>
                            {apt.stylePreference && (
                                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                                    <Scissors size={10} /> {apt.stylePreference}
                                </p>
                            )}
                        </div>
                    </div>
                 </div>
                 <div className="flex flex-col items-end space-y-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === AppointmentStatus.CONFIRMED ? 'bg-green-900 text-green-300' : 
                        apt.status === AppointmentStatus.PENDING ? 'bg-amber-900 text-amber-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                        {apt.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-300">${apt.price}</span>
                 </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
