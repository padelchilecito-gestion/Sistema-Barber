import React from 'react';
import { Lock, Smartphone, Mail, AlertTriangle } from 'lucide-react';

const SuspendedView: React.FC = () => {
  // TUS DATOS DE CONTACTO (Soporte Centrol-Soft)
  const SUPPORT_WHATSAPP = "5493825625422"; 
  const SUPPORT_EMAIL = "edur900@gmail.com"; 

  const wsMessage = `Hola, necesito regularizar el estado de mi licencia (BarberPro).`;
  const wsLink = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(wsMessage)}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Fondo Animado */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-600/20 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-900/20 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center">
        <div className="relative mx-auto w-20 h-20 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center mb-6 shadow-lg">
            <Lock className="text-red-500 w-10 h-10" />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-700">
                <AlertTriangle size={14} className="text-amber-500" />
            </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Servicio Pausado</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          El acceso a BarberPro ha sido restringido temporalmente. Sus datos están seguros y se restaurarán al regularizar la cuenta.
        </p>

        <div className="space-y-3">
          <a href={wsLink} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20 group">
            <Smartphone size={18} className="group-hover:scale-110 transition-transform"/> Contactar Soporte
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="w-full py-3.5 px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
            <Mail size={18} /> Enviar Email
          </a>
        </div>
        
        <div className="mt-8 text-[10px] text-slate-600 font-mono tracking-widest uppercase">
          ID: BARBER-PRO-001
        </div>
      </div>
    </div>
  );
};

export default SuspendedView;
