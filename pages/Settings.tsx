
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Clock, Plus, Trash2, Scissors, Save, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, X, Crown } from 'lucide-react';
import { WeeklySchedule, TimeRange, LicenseTier } from '../types';

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SettingsPage: React.FC = () => {
  const { services, settings, addService, removeService, updateSettings } = useApp();
  
  // Local state for editing form
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  const [localSchedule, setLocalSchedule] = useState<WeeklySchedule>(settings.schedule);
  const [isSaved, setIsSaved] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const handleAddService = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newService.name || !newService.price) return;
      
      addService({
          id: Date.now().toString(),
          name: newService.name,
          price: Number(newService.price),
          durationMinutes: Number(newService.duration) || 30
      });
      setNewService({ name: '', price: '', duration: '' });
  };

  const handleSaveSettings = () => {
      updateSettings({ ...settings, schedule: localSchedule });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleLicense = () => {
      const newTier = settings.licenseTier === LicenseTier.BASIC ? LicenseTier.PREMIUM : LicenseTier.BASIC;
      updateSettings({ ...settings, licenseTier: newTier });
  };

  const toggleDayOpen = (day: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen
      }
    }));
  };

  const addRange = (day: string) => {
    setLocalSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: [...prev[day].ranges, { start: '09:00', end: '13:00' }]
      }
    }));
  };

  const removeRange = (day: string, index: number) => {
    setLocalSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: prev[day].ranges.filter((_, i) => i !== index)
      }
    }));
  };

  const updateRange = (day: string, index: number, field: keyof TimeRange, value: string) => {
    setLocalSchedule(prev => {
      const newRanges = [...prev[day].ranges];
      newRanges[index] = { ...newRanges[index], [field]: value };
      return {
        ...prev,
        [day]: { ...prev[day], ranges: newRanges }
      };
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <h2 className="text-2xl font-bold text-white">Configuración</h2>

      {/* License Section */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Crown className={settings.licenseTier === LicenseTier.PREMIUM ? 'text-amber-400' : 'text-slate-500'} />
                      <h3 className="font-bold text-lg text-white">Nivel de Licencia</h3>
                  </div>
                  <p className="text-slate-400 text-sm">
                      {settings.licenseTier === LicenseTier.PREMIUM 
                        ? 'Tienes acceso a Visagismo IA y Sistema de Fidelización.' 
                        : 'Estás en el plan Básico.'}
                  </p>
              </div>
              <button 
                onClick={toggleLicense}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                    settings.licenseTier === LicenseTier.PREMIUM 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                    : 'bg-slate-700 border-slate-600 text-slate-300'
                }`}
              >
                  {settings.licenseTier === LicenseTier.PREMIUM ? 'PREMIUM ACTIVADO' : 'CAMBIAR A PREMIUM'}
              </button>
          </div>
      </section>

      {/* Shop Hours Section */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-amber-500">
              <Clock size={20} />
              <h3 className="font-bold text-lg text-white">Horarios de Atención</h3>
          </div>
          <p className="text-slate-400 text-sm mb-6">Configura tus horarios diarios. Puedes agregar turnos cortados (ej: mañana y tarde).</p>
          
          <div className="space-y-3">
            {DAY_KEYS.map(dayKey => {
              const daySchedule = localSchedule[dayKey];
              const isExpanded = expandedDay === dayKey;
              const hasRanges = daySchedule.ranges.length > 0;

              return (
                <div key={dayKey} className={`rounded-xl border transition-all ${isExpanded ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-900/50 border-slate-700'}`}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedDay(isExpanded ? null : dayKey)}>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleDayOpen(dayKey); }}
                        className={`transition-colors ${daySchedule.isOpen ? 'text-green-400' : 'text-slate-600'}`}
                      >
                        {daySchedule.isOpen ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                      <span className={`font-medium ${daySchedule.isOpen ? 'text-white' : 'text-slate-500'}`}>
                        {DAY_LABELS[dayKey]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 hidden md:block">
                        {!daySchedule.isOpen ? 'Cerrado' : 
                         hasRanges ? daySchedule.ranges.map(r => `${r.start}-${r.end}`).join(', ') : 'Sin horarios'}
                      </span>
                      {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Edit Area */}
                  {isExpanded && daySchedule.isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-800 pt-4 animate-in slide-in-from-top-2">
                       {daySchedule.ranges.map((range, idx) => (
                         <div key={idx} className="flex items-center gap-2 mb-3">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                <div>
                                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Apertura</label>
                                  <input 
                                    type="time" 
                                    value={range.start}
                                    onChange={(e) => updateRange(dayKey, idx, 'start', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Cierre</label>
                                  <input 
                                    type="time" 
                                    value={range.end}
                                    onChange={(e) => updateRange(dayKey, idx, 'end', e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                                  />
                                </div>
                            </div>
                            <button 
                              onClick={() => removeRange(dayKey, idx)}
                              className="mt-5 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                              <X size={18} />
                            </button>
                         </div>
                       ))}
                       
                       <button 
                         onClick={() => addRange(dayKey)}
                         className="mt-2 text-xs font-bold text-amber-500 flex items-center gap-1 hover:text-amber-400 px-2 py-1 rounded hover:bg-amber-500/10 transition-colors">
                         <Plus size={14} /> AGREGAR TURNO
                       </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={handleSaveSettings}
            className={`mt-6 w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${isSaved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500'}`}>
              <Save size={18} /> {isSaved ? '¡Guardado Correctamente!' : 'Guardar Todos los Horarios'}
          </button>
      </section>

      {/* Services Section */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-amber-500">
              <Scissors size={20} />
              <h3 className="font-bold text-lg text-white">Servicios y Precios</h3>
          </div>
          <p className="text-slate-400 text-sm mb-6">La IA usará esta lista para dar precios a los clientes.</p>

          {/* List */}
          <div className="space-y-3 mb-8">
              {services.length === 0 && <p className="text-slate-500 italic">No hay servicios configurados.</p>}
              {services.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                      <div>
                          <p className="text-white font-medium">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.durationMinutes} min</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className="text-amber-500 font-bold font-mono">${s.price}</span>
                          <button onClick={() => removeService(s.id)} className="text-slate-600 hover:text-red-400 p-1">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          {/* Add Form */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <h4 className="text-sm font-bold text-white mb-3">Agregar Nuevo Servicio</h4>
              <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-3">
                  <input 
                    placeholder="Nombre (ej: Corte Niño)" 
                    className="flex-[2] bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500"
                    value={newService.name}
                    onChange={e => setNewService({...newService, name: e.target.value})}
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Precio ($)" 
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500"
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: e.target.value})}
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Mins" 
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none focus:border-amber-500"
                    value={newService.duration}
                    onChange={e => setNewService({...newService, duration: e.target.value})}
                    required
                  />
                  <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-900 p-2 rounded-lg flex items-center justify-center">
                      <Plus size={20} />
                  </button>
              </form>
          </div>
      </section>
    </div>
  );
};

export default SettingsPage;
