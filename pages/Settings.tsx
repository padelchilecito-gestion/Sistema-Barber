import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { auth } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { Clock, Plus, Trash2, Scissors, Save, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, X, Crown, Shield, Key, Smartphone, Store } from 'lucide-react';
import { WeeklySchedule, TimeRange, LicenseTier } from '../types';

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
};
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SettingsPage: React.FC = () => {
  const { services, settings, addService, removeService, updateSettings } = useApp();
  
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  const [localSchedule, setLocalSchedule] = useState<WeeklySchedule>(settings.schedule);
  
  // Estado para datos del negocio
  const [shopName, setShopName] = useState(settings.shopName || 'BarberPro Shop');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '');
  
  const [isSaved, setIsSaved] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });
  const [updatingPass, setUpdatingPass] = useState(false);

  // Sincronizar estado local si settings cambian en DB
  useEffect(() => {
    setShopName(settings.shopName || 'BarberPro Shop');
    setContactPhone(settings.contactPhone || '');
    setLocalSchedule(settings.schedule);
  }, [settings]);

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
      updateSettings({ 
          ...settings, 
          schedule: localSchedule,
          shopName: shopName,
          contactPhone: contactPhone
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleLicense = () => {
      const newTier = settings.licenseTier === LicenseTier.BASIC ? LicenseTier.PREMIUM : LicenseTier.BASIC;
      updateSettings({ ...settings, licenseTier: newTier });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        setPassMessage({ text: 'Mínimo 6 caracteres.', type: 'error' });
        return;
    }
    setUpdatingPass(true);
    setPassMessage({ text: '', type: '' });
    try {
        if (auth.currentUser) {
            await updatePassword(auth.currentUser, newPassword);
            setPassMessage({ text: '¡Clave actualizada!', type: 'success' });
            setNewPassword('');
        }
    } catch (error: any) {
        setPassMessage({ text: 'Error o sesión expirada.', type: 'error' });
    } finally {
        setUpdatingPass(false);
    }
  };

  // Helpers de Horarios
  const toggleDayOpen = (day: string) => {
    setLocalSchedule(prev => ({ ...prev, [day]: { ...prev[day], isOpen: !prev[day].isOpen } }));
  };
  const addRange = (day: string) => {
    setLocalSchedule(prev => ({ ...prev, [day]: { ...prev[day], ranges: [...prev[day].ranges, { start: '09:00', end: '13:00' }] } }));
  };
  const removeRange = (day: string, index: number) => {
    setLocalSchedule(prev => ({ ...prev, [day]: { ...prev[day], ranges: prev[day].ranges.filter((_, i) => i !== index) } }));
  };
  const updateRange = (day: string, index: number, field: keyof TimeRange, value: string) => {
    setLocalSchedule(prev => {
      const newRanges = [...prev[day].ranges];
      newRanges[index] = { ...newRanges[index], [field]: value };
      return { ...prev, [day]: { ...prev[day], ranges: newRanges } };
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <h2 className="text-2xl font-bold text-white">Configuración</h2>

      {/* General Data Section */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-amber-500">
              <Store size={20} />
              <h3 className="font-bold text-lg text-white">Datos del Negocio</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
              <div>
                  <label className="text-xs text-slate-400 mb-1 block ml-1">Nombre de la Barbería</label>
                  <input 
                    type="text" 
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none"
                    placeholder="Ej: BarberPro"
                  />
              </div>
              <div>
                  <label className="text-xs text-slate-400 mb-1 block ml-1">Teléfono (para WhatsApp)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3.5 text-slate-500" size={18}/>
                    <input 
                        type="tel" 
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-amber-500 outline-none"
                        placeholder="Ej: 5491122334455"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 ml-1">Incluye código de país, sin espacios ni +.</p>
              </div>
          </div>
      </section>

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
                        ? 'Premium Activo.' 
                        : 'Plan Básico.'}
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
                  {settings.licenseTier === LicenseTier.PREMIUM ? 'PREMIUM ON' : 'PREMIUM OFF'}
              </button>
          </div>
      </section>

      {/* Security Section */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-amber-500">
              <Shield size={20} />
              <h3 className="font-bold text-lg text-white">Seguridad Admin</h3>
          </div>
          <form onSubmit={handleChangePassword} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-3 items-end">
              <div className="w-full">
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Nueva Contraseña</label>
                  <div className="relative">
                      <Key className="absolute left-3 top-3 text-slate-500" size={16} />
                      <input 
                        type="password" 
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 pl-9 text-white text-sm outline-none focus:border-amber-500"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                  </div>
              </div>
              <button 
                type="submit" 
                disabled={!newPassword || updatingPass}
                className="w-full md:w-auto px-6 py-2 bg-slate-700 hover:bg-amber-500 hover:text-slate-900 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 h-[38px]"
              >
                  {updatingPass ? '...' : 'Cambiar'}
              </button>
          </form>
          {passMessage.text && (
              <p className={`text-xs mt-2 font-medium ml-1 ${passMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {passMessage.text}
              </p>
          )}
      </section>

      {/* Shop Hours Section */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-amber-500">
              <Clock size={20} />
              <h3 className="font-bold text-lg text-white">Horarios</h3>
          </div>
          <div className="space-y-3">
            {DAY_KEYS.map(dayKey => {
              const daySchedule = localSchedule[dayKey];
              const isExpanded = expandedDay === dayKey;
              const hasRanges = daySchedule.ranges.length > 0;
              return (
                <div key={dayKey} className={`rounded-xl border transition-all ${isExpanded ? 'bg-slate-900 border-amber-500/50' : 'bg-slate-900/50 border-slate-700'}`}>
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedDay(isExpanded ? null : dayKey)}>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleDayOpen(dayKey); }}
                        className={`transition-colors ${daySchedule.isOpen ? 'text-green-400' : 'text-slate-600'}`}
                      >
                        {daySchedule.isOpen ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                      <span className={`font-medium ${daySchedule.isOpen ? 'text-white' : 'text-slate-500'}`}>{DAY_LABELS[dayKey]}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 hidden md:block">{!daySchedule.isOpen ? 'Cerrado' : hasRanges ? daySchedule.ranges.map(r => `${r.start}-${r.end}`).join(', ') : 'Sin horarios'}</span>
                      {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                    </div>
                  </div>
                  {isExpanded && daySchedule.isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-800 pt-4 animate-in slide-in-from-top-2">
                       {daySchedule.ranges.map((range, idx) => (
                         <div key={idx} className="flex items-center gap-2 mb-3">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                <input type="time" value={range.start} onChange={(e) => updateRange(dayKey, idx, 'start', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                                <input type="time" value={range.end} onChange={(e) => updateRange(dayKey, idx, 'end', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                            </div>
                            <button onClick={() => removeRange(dayKey, idx)} className="p-2 text-slate-500 hover:text-red-400"><X size={18} /></button>
                         </div>
                       ))}
                       <button onClick={() => addRange(dayKey)} className="mt-2 text-xs font-bold text-amber-500 flex items-center gap-1 hover:text-amber-400 px-2 py-1 rounded hover:bg-amber-500/10"><Plus size={14} /> AGREGAR TURNO</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={handleSaveSettings} className={`mt-6 w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${isSaved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500'}`}><Save size={18} /> {isSaved ? '¡Guardado!' : 'Guardar Todo'}</button>
      </section>

      {/* Services Section */}
      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-amber-500"><Scissors size={20} /><h3 className="font-bold text-lg text-white">Servicios</h3></div>
          <div className="space-y-3 mb-8">
              {services.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div><p className="text-white font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.durationMinutes} min</p></div>
                      <div className="flex items-center gap-4"><span className="text-amber-500 font-bold font-mono">${s.price}</span><button onClick={() => removeService(s.id)} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={16} /></button></div>
                  </div>
              ))}
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <h4 className="text-sm font-bold text-white mb-3">Agregar Servicio</h4>
              <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-3">
                  <input placeholder="Nombre" className="flex-[2] bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} required />
                  <input type="number" placeholder="$" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} required />
                  <input type="number" placeholder="Min" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm outline-none" value={newService.duration} onChange={e => setNewService({...newService, duration: e.target.value})} required />
                  <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-900 p-2 rounded-lg"><Plus size={20} /></button>
              </form>
          </div>
      </section>
    </div>
  );
};

export default SettingsPage;
