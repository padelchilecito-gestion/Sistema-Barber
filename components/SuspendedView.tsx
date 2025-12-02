// components/SuspendedView.tsx
import React from 'react';
import { PROJECT_STATUS } from '../config'; // Importación corregida
import { Lock, Smartphone, Mail, AlertTriangle } from 'lucide-react';

const SuspendedView: React.FC = () => {
  const wsMessage = `Hola, necesito regularizar el pago de mi sistema (BarberPro).`;
  const wsLink = `https://wa.me/${PROJECT_STATUS.providerWhatsapp}?text=${encodeURIComponent(wsMessage)}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4">
      {/* Tarjeta Principal */}
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
        
        {/* Ícono */}
        <div className="relative mx-auto w-20 h-20 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center mb-6 shadow-lg">
            <Lock className="text-red-500 w-10 h-10" />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-700">
                <AlertTriangle size={14} className="text-amber-500" />
            </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Servicio Pausado</h1>
        <p className="text-slate-400 text-sm mb-8">
          El acceso a la plataforma ha sido restringido temporalmente por falta de pago.
        </p>

        <div className="space-y-3">
          <a href={wsLink} target="_blank" rel="noopener noreferrer" className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
            <Smartphone size={18} /> Contactar Soporte
          </a>
          <a href={`mailto:${PROJECT_STATUS.providerEmail}`} className="w-full py-3 px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
            <Mail size={18} /> Enviar Email
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuspendedView;
