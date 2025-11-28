import React, { useEffect, useState } from 'react';
import { Download, Share, X, Phone, Monitor } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada (Standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return; // No mostrar nada si ya está instalada

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Manejador para Android/Chrome (beforeinstallprompt)
    const handler = (e: any) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Si es iOS, mostramos el botón (pero lanzará el modal de instrucciones)
    if (isIosDevice) {
        setSupportsPWA(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isIOS) {
        // En iOS no hay evento programático, mostramos instrucciones
        setShowIOSInstructions(true);
        return;
    }

    if (!promptInstall) {
        return;
    }

    // Android/Desktop: lanzamos el prompt nativo
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Usuario aceptó instalar');
        }
        setPromptInstall(null);
        setSupportsPWA(false); // Ocultamos el botón tras instalar
    });
  };

  if (!supportsPWA || isStandalone) return null;

  return (
    <>
      {/* --- BOTÓN FLOTANTE --- */}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 transform -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <button
          onClick={handleInstallClick}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95 group"
        >
          <div className="bg-amber-500 p-1.5 rounded-full text-slate-900 group-hover:rotate-12 transition-transform">
             <Download size={18} strokeWidth={3} />
          </div>
          <div className="flex flex-col items-start">
             <span className="text-xs font-bold text-amber-500 uppercase leading-none">Instalar App</span>
             <span className="text-[10px] text-slate-300 leading-none mt-1">Acceso rápido</span>
          </div>
        </button>
      </div>

      {/* --- MODAL INSTRUCCIONES iOS --- */}
      {showIOSInstructions && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl p-6 relative shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                  <button 
                    onClick={() => setShowIOSInstructions(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 p-1 rounded-full"
                  >
                      <X size={20} />
                  </button>

                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-slate-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-slate-600">
                          <img src="https://cdn-icons-png.flaticon.com/512/3504/3504017.png" alt="Icon" className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Instalar en iPhone</h3>
                      <p className="text-slate-400 text-sm">Agrega esta app a tu inicio para una mejor experiencia a pantalla completa.</p>
                  </div>

                  <div className="space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center gap-4">
                          <div className="text-blue-400">
                              <Share size={24} />
                          </div>
                          <p className="text-sm text-slate-300">1. Toca el botón <span className="font-bold text-white">Compartir</span> en la barra inferior de Safari.</p>
                      </div>
                      <div className="h-px bg-slate-700/50 w-full"></div>
                      <div className="flex items-center gap-4">
                          <div className="text-white bg-slate-700 p-1 rounded">
                              <div className="w-5 h-5 border-2 border-white rounded-[4px] flex items-center justify-center">
                                  <span className="text-[10px] font-bold">+</span>
                              </div>
                          </div>
                          <p className="text-sm text-slate-300">2. Desliza y selecciona <span className="font-bold text-white">"Agregar a Inicio"</span>.</p>
                      </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                      <button onClick={() => setShowIOSInstructions(false)} className="text-amber-500 font-bold text-sm">Entendido</button>
                  </div>
                  
                  {/* Flecha indicadora para el botón compartir de Safari */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-white animate-bounce md:hidden">
                      ⬇
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default InstallPWA;
