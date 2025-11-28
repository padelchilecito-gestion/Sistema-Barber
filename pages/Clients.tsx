import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Client, LicenseTier, VisagismoResult } from '../types';
import { suggestStyle, getVisagismAdvice } from '../services/geminiService';
import { Phone, Calendar, Sparkles, User, FileText, Star, Crown, Scissors, Smile, Plus, X, Save } from 'lucide-react';

const ClientsPage: React.FC = () => {
  const { clients, settings, addClient } = useApp();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Estados para la IA y Visagismo
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [showVisagismo, setShowVisagismo] = useState(false);
  const [visagismoResult, setVisagismoResult] = useState<VisagismoResult | null>(null);
  const [vFace, setVFace] = useState('');
  const [vHair, setVHair] = useState('');
  const [loadingVisagismo, setLoadingVisagismo] = useState(false);

  // Estados para el Modal de Nuevo Cliente
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', notes: '' });

  const isPremium = settings.licenseTier === LicenseTier.PREMIUM;

  const handleGetSuggestion = async (client: Client) => {
      setLoadingSuggestion(true);
      setAiSuggestion('');
      try {
          const suggestion = await suggestStyle(client.notes);
          setAiSuggestion(suggestion);
      } catch (e) {
          setAiSuggestion('No se pudo conectar con la IA.');
      } finally {
          setLoadingSuggestion(false);
      }
  };

  const handleVisagismo = async () => {
      if(!vFace || !vHair) return;
      setLoadingVisagismo(true);
      try {
          const res = await getVisagismAdvice(vFace, vHair);
          setVisagismoResult(res);
      } catch(e) { console.error(e); }
      finally { setLoadingVisagismo(false); }
  }

  // --- LÓGICA PARA AGREGAR CLIENTE ---
  const handleSaveClient = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newClient.name) return;

      const clientData: Client = {
          id: Date.now().toString(), // ID temporal, Firebase asignará el suyo
          name: newClient.name,
          phone: newClient.phone || '',
          notes: newClient.notes || '',
          totalVisits: 0,
          loyaltyPoints: 0,
          // Avatar por defecto generado con las iniciales
          avatarUrl: `https://ui-avatars.com/api/?name=${newClient.name}&background=random`
      };

      addClient(clientData);
      
      // Reset y cerrar
      setNewClient({ name: '', phone: '', notes: '' });
      setShowAddModal(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col md:flex-row gap-6 pb-20 relative">
      
      {/* List View */}
      <div className={`flex-1 ${selectedClient ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Clientes</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95">
                  <Plus size={18} /> Nuevo
              </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[80vh] custom-scrollbar pr-1">
              {clients.length === 0 && (
                  <div className="text-center py-8 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                      <User size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No hay clientes registrados.</p>
                      <button onClick={() => setShowAddModal(true)} className="text-amber-500 font-bold text-sm mt-2 hover:underline">¡Agrega el primero!</button>
                  </div>
              )}
              {clients.map(client => (
                  <div key={client.id} 
                    onClick={() => { setSelectedClient(client); setAiSuggestion(''); setShowVisagismo(false); setVisagismoResult(null); }}
                    className={`bg-slate-800 p-4 rounded-xl border cursor-pointer hover:bg-slate-750 transition-all flex items-center space-x-4 ${selectedClient?.id === client.id ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-slate-700'}`}>
                      <img src={client.avatarUrl || `https://ui-avatars.com/api/?name=${client.name}`} alt={client.name} className="w-12 h-12 rounded-full bg-slate-700 object-cover" />
                      <div className="flex-1">
                          <h3 className="font-bold text-white">{client.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                              <p className="text-slate-400 text-sm flex items-center gap-1"><Phone size={12} /> {client.phone}</p>
                              {isPremium && (
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={10} className={i < client.loyaltyPoints ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'} />
                                    ))}
                                </div>
                              )}
                          </div>
                      </div>
                      <div className="text-right">
                          <span className="block text-xs text-slate-500 uppercase">Visitas</span>
                          <span className="font-mono text-amber-500 font-bold">{client.totalVisits}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Detail View */}
      <div className={`flex-[1.5] ${selectedClient ? 'block' : 'hidden md:block md:opacity-50'}`}>
        {selectedClient ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4">
                <button onClick={() => setSelectedClient(null)} className="md:hidden text-slate-400 mb-4 hover:text-white flex items-center gap-1">← Volver</button>
                
                {/* Header Profile */}
                <div className="flex items-center space-x-4 mb-6">
                    <img src={selectedClient.avatarUrl || `https://ui-avatars.com/api/?name=${selectedClient.name}`} className="w-20 h-20 rounded-full border-2 border-amber-500 object-cover" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                        <div className="flex gap-2 mt-2">
                             <a href={`tel:${selectedClient.phone}`} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white"><Phone size={18} /></a>
                             <button className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white"><Calendar size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* LOYALTY CARD - PREMIUM ONLY */}
                {isPremium && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-xl border border-yellow-500/30 mb-6 relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h4 className="text-yellow-400 font-bold text-sm flex items-center gap-2"><Crown size={14}/> Tarjeta de Fidelización</h4>
                                <p className="text-slate-400 text-xs mt-1">Acumula 5 visitas para un premio.</p>
                            </div>
                            <div className="text-center">
                                <span className="text-2xl font-bold text-white">{selectedClient.loyaltyPoints}/5</span>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 relative z-10">
                            {[1, 2, 3, 4, 5].map((step) => (
                                <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step <= selectedClient.loyaltyPoints ? 'bg-yellow-500 border-yellow-500 text-slate-900' : 'bg-transparent border-slate-700 text-slate-700'}`}>
                                    {step === 5 ? <Crown size={18}/> : <Star size={16} className={step <= selectedClient.loyaltyPoints ? 'fill-slate-900' : ''}/>}
                                </div>
                            ))}
                        </div>
                        {selectedClient.loyaltyPoints >= 5 && (
                             <div className="mt-3 bg-green-500/20 text-green-400 text-xs font-bold text-center py-1 rounded border border-green-500/30 animate-pulse">
                                 ¡Premio Disponible!
                             </div>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2"><FileText size={14}/> Notas de Estilo</h4>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-slate-300 min-h-[60px]">
                            {selectedClient.notes || <span className="text-slate-600 italic">Sin notas registradas.</span>}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2"><Sparkles size={14}/> Sugerencia IA</h4>
                            <button 
                                onClick={() => handleGetSuggestion(selectedClient)}
                                disabled={loadingSuggestion}
                                className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded hover:bg-amber-500/20 disabled:opacity-50 transition-colors">
                                {aiSuggestion ? 'Regenerar' : 'Generar'}
                            </button>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 p-4 rounded-xl border border-indigo-500/30 min-h-[80px] flex items-center justify-center relative overflow-hidden">
                            {loadingSuggestion ? (
                                <div className="text-indigo-400 animate-pulse text-sm flex items-center gap-2"><Sparkles className="animate-spin" size={16}/> Analizando historial...</div>
                            ) : aiSuggestion ? (
                                <p className="text-indigo-200 text-sm italic animate-in fade-in">"{aiSuggestion}"</p>
                            ) : (
                                <p className="text-slate-500 text-sm text-center">Toca 'Generar' para que la IA sugiera un estilo basado en el historial.</p>
                            )}
                        </div>
                    </div>

                    {/* Visagismo Tool - Premium Only */}
                    {isPremium && (
                        <div>
                            <button 
                                onClick={() => setShowVisagismo(!showVisagismo)}
                                className="w-full py-2 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <Smile size={16} /> {showVisagismo ? 'Ocultar Asesor de Imagen' : 'Abrir Asesor de Imagen'}
                            </button>
                            
                            {showVisagismo && (
                                <div className="mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <select className="bg-slate-800 text-white text-xs p-2 rounded outline-none border border-slate-600 focus:border-indigo-500" onChange={e => setVFace(e.target.value)}>
                                            <option value="">Rostro...</option>
                                            <option value="Ovalado">Ovalado</option>
                                            <option value="Cuadrado">Cuadrado</option>
                                            <option value="Redondo">Redondo</option>
                                            <option value="Diamante">Diamante</option>
                                        </select>
                                        <select className="bg-slate-800 text-white text-xs p-2 rounded outline-none border border-slate-600 focus:border-indigo-500" onChange={e => setVHair(e.target.value)}>
                                            <option value="">Pelo...</option>
                                            <option value="Lacio">Lacio</option>
                                            <option value="Ondulado">Ondulado</option>
                                            <option value="Rizado">Rizado</option>
                                        </select>
                                    </div>
                                    <button 
                                        onClick={handleVisagismo}
                                        disabled={loadingVisagismo || !vFace || !vHair}
                                        className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loadingVisagismo ? 'Analizando...' : 'Obtener Recomendación'}
                                    </button>
                                    
                                    {visagismoResult && (
                                        <div className="mt-3 space-y-2 animate-in fade-in">
                                            {visagismoResult.recommendations.map((rec, idx) => (
                                                <div key={idx} className="text-xs bg-slate-800 p-2 rounded border border-slate-700">
                                                    <span className="text-amber-500 font-bold block mb-0.5">{rec.name}</span>
                                                    <span className="text-slate-400">{rec.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        ) : (
            <div className="h-full flex items-center justify-center text-slate-600">
                <div className="text-center">
                    <User size={64} className="mx-auto mb-4 opacity-20" />
                    <p>Selecciona un cliente para ver detalles</p>
                </div>
            </div>
        )}
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <User className="text-amber-500" /> Nuevo Cliente
                    </h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSaveClient} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Nombre Completo *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: Juan Pérez"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                          value={newClient.name}
                          onChange={e => setNewClient({...newClient, name: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Teléfono</label>
                        <input 
                          type="tel" 
                          placeholder="Ej: +54 9 11..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                          value={newClient.phone}
                          onChange={e => setNewClient({...newClient, phone: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Notas / Preferencias</label>
                        <textarea 
                          placeholder="Ej: Le gusta el degrade alto..."
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none resize-none"
                          value={newClient.notes}
                          onChange={e => setNewClient({...newClient, notes: e.target.value})}
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                          type="submit" 
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
                            <Save size={18} /> Guardar Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
