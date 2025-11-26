
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Crown, Star, Sparkles, User, ArrowRight, Smile, Scissors } from 'lucide-react';
import { getVisagismAdvice } from '../services/geminiService';
import { VisagismoResult } from '../types';

const FACE_SHAPES = ['Ovalado', 'Cuadrado', 'Redondo', 'Diamante', 'Triangular', 'Alargado'];
const HAIR_TYPES = ['Lacio', 'Ondulado', 'Rizado', 'Afro', 'Fino', 'Grueso'];

const PremiumTools: React.FC = () => {
  const { clients } = useApp();
  
  // Logic for Loyalty
  const closeToRewardClients = clients.filter(c => c.loyaltyPoints >= 4).sort((a,b) => b.loyaltyPoints - a.loyaltyPoints);
  
  // Logic for Visagismo
  const [faceShape, setFaceShape] = useState('');
  const [hairType, setHairType] = useState('');
  const [advice, setAdvice] = useState<VisagismoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConsult = async () => {
      if(!faceShape || !hairType) return;
      setLoading(true);
      setAdvice(null);
      try {
          const result = await getVisagismAdvice(faceShape, hairType);
          setAdvice(result);
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500/20 p-3 rounded-full text-amber-500">
              <Crown size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Herramientas Premium</h2>
            <p className="text-slate-400">Funciones avanzadas para potenciar tu barbería.</p>
          </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
          
          {/* LOYALTY SECTION */}
          <section className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Star className="text-yellow-400" /> Fidelización
                  </h3>
                  <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded">Top Clientes</span>
              </div>
              
              <div className="space-y-4">
                  {closeToRewardClients.length === 0 ? (
                      <p className="text-slate-500 italic">No hay clientes cerca de premio aún.</p>
                  ) : (
                      closeToRewardClients.map(client => (
                          <div key={client.id} className="bg-slate-900/50 p-4 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center text-slate-300">
                                      <User size={18} />
                                  </div>
                                  <div>
                                      <p className="text-white font-medium">{client.name}</p>
                                      <p className="text-xs text-slate-500">{client.totalVisits} visitas totales</p>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={14} className={i < client.loyaltyPoints ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'} />
                                  ))}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </section>

          {/* VISAGISMO SECTION */}
          <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl border border-indigo-500/30 p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-indigo-400" /> Visagismo IA
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">Laboratorio de Estilo</span>
              </div>

              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-indigo-300 block mb-1">Forma de Rostro</label>
                          <select 
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none"
                            value={faceShape}
                            onChange={(e) => setFaceShape(e.target.value)}
                          >
                              <option value="">Seleccionar...</option>
                              {FACE_SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs text-indigo-300 block mb-1">Tipo de Pelo</label>
                          <select 
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none"
                            value={hairType}
                            onChange={(e) => setHairType(e.target.value)}
                          >
                              <option value="">Seleccionar...</option>
                              {HAIR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                  </div>

                  <button 
                    onClick={handleConsult}
                    disabled={loading || !faceShape || !hairType}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Sparkles className="animate-spin" /> : <Smile />} 
                    {loading ? 'Analizando...' : 'Analizar Estilo'}
                  </button>
                  
                  {/* RESULTS */}
                  {advice && (
                      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
                          <h4 className="text-indigo-200 text-sm font-semibold mb-3">Recomendaciones:</h4>
                          <div className="space-y-3">
                              {advice.recommendations.map((rec, idx) => (
                                  <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                                      <p className="text-amber-400 font-bold text-sm mb-1 flex items-center gap-2">
                                          <Scissors size={12} /> {rec.name}
                                      </p>
                                      <p className="text-slate-300 text-xs leading-relaxed">{rec.description}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </section>
      </div>
    </div>
  );
};

export default PremiumTools;
