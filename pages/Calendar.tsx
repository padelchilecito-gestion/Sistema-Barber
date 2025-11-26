
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { AppointmentStatus, Appointment } from '../types';
import { Check, X, Calendar as CalendarIcon, Clock, CheckCircle, Scissors, ChevronDown } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const { appointments, updateAppointmentStatus, addAppointment, services } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);

  // Simple Add Modal State
  const [newApt, setNewApt] = useState<Partial<Appointment>>({
      clientName: '',
      service: '',
      time: '12:00',
      price: 0
  });

  const dailyAppointments = appointments.filter(a => a.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
      updateAppointmentStatus(id, status);
  };

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      addAppointment({
          id: Date.now().toString(),
          clientId: 'guest', // Simplified for demo
          clientName: newApt.clientName || 'Cliente',
          service: newApt.service || 'Corte',
          date: selectedDate,
          time: newApt.time || '10:00',
          price: Number(newApt.price) || 0,
          status: AppointmentStatus.PENDING
      });
      setShowModal(false);
      setNewApt({ clientName: '', service: '', time: '12:00', price: 0 });
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const serviceName = e.target.value;
      const foundService = services.find(s => s.name === serviceName);
      setNewApt(prev => ({
          ...prev,
          service: serviceName,
          price: foundService ? foundService.price : prev.price
      }));
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Agenda</h2>
        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
             <button onClick={() => {
                 const d = new Date(selectedDate);
                 d.setDate(d.getDate() - 1);
                 setSelectedDate(d.toISOString().split('T')[0]);
             }} className="px-3 py-1 hover:bg-slate-700 rounded text-slate-400">←</button>
             <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-center outline-none"
             />
             <button onClick={() => {
                 const d = new Date(selectedDate);
                 d.setDate(d.getDate() + 1);
                 setSelectedDate(d.toISOString().split('T')[0]);
             }} className="px-3 py-1 hover:bg-slate-700 rounded text-slate-400">→</button>
        </div>
      </div>

      <div className="space-y-4 pb-20">
          {dailyAppointments.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-4">
                   <CalendarIcon size={48} className="opacity-50" />
                   <p>No hay turnos para este día.</p>
                   <button onClick={() => setShowModal(true)} className="text-amber-500 font-medium">Agregar turno manual</button>
               </div>
          ) : (
              dailyAppointments.map(apt => (
                  <div key={apt.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      apt.status === AppointmentStatus.COMPLETED ? 'bg-slate-800/50 border-slate-700 opacity-75' : 'bg-slate-800 border-slate-600'
                  }`}>
                      <div className="flex items-start md:items-center space-x-4">
                          <div className="text-center min-w-[60px]">
                              <div className="text-lg font-bold text-white font-mono">{apt.time}</div>
                              <div className="text-xs text-slate-500 uppercase">{apt.status}</div>
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-white">{apt.clientName}</h3>
                              <div className="flex flex-col">
                                <p className="text-amber-500 text-sm">{apt.service} • ${apt.price}</p>
                                {apt.stylePreference && (
                                    <p className="text-slate-400 text-xs italic flex items-center gap-1 mt-1">
                                        <Scissors size={12} /> {apt.stylePreference}
                                    </p>
                                )}
                              </div>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                           {apt.status === AppointmentStatus.PENDING && (
                               <button 
                                onClick={() => handleStatusChange(apt.id, AppointmentStatus.CONFIRMED)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30">
                                   <Check size={16} /> <span>Confirmar</span>
                               </button>
                           )}
                           {apt.status === AppointmentStatus.CONFIRMED && (
                               <button 
                                onClick={() => handleStatusChange(apt.id, AppointmentStatus.COMPLETED)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30">
                                   <CheckCircle size={16} /> <span>Finalizar</span>
                               </button>
                           )}
                           {apt.status !== AppointmentStatus.CANCELLED && apt.status !== AppointmentStatus.COMPLETED && (
                               <button 
                                onClick={() => handleStatusChange(apt.id, AppointmentStatus.CANCELLED)}
                                className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700">
                                   <X size={18} />
                               </button>
                           )}
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-amber-500 text-slate-900 p-4 rounded-full shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform z-40">
          <span className="text-2xl font-bold">+</span>
      </button>

      {/* Manual Add Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Nuevo Turno</h3>
                  <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Cliente</label>
                          <input required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" 
                            placeholder="Nombre del cliente"
                            value={newApt.clientName}
                            onChange={e => setNewApt({...newApt, clientName: e.target.value})}
                          />
                      </div>
                      
                      {/* Services Dropdown */}
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Servicio</label>
                          <div className="relative">
                            <select 
                                required 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none appearance-none"
                                value={newApt.service}
                                onChange={handleServiceChange}
                            >
                                <option value="" disabled>Seleccionar servicio...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.name}>{s.name} (${s.price})</option>
                                ))}
                                {services.length === 0 && <option value="Corte General">Corte General (Predeterminado)</option>}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={16} />
                          </div>
                          {services.length === 0 && (
                             <p className="text-[10px] text-amber-500 mt-1">💡 Configura tus servicios en la pestaña Configuración.</p>
                          )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs text-slate-400 mb-1">Hora</label>
                              <input type="time" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" 
                                value={newApt.time}
                                onChange={e => setNewApt({...newApt, time: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs text-slate-400 mb-1">Precio ($)</label>
                              <input type="number" required className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none" 
                                value={newApt.price}
                                onChange={e => setNewApt({...newApt, price: Number(e.target.value)})}
                              />
                          </div>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600">Cancelar</button>
                          <button type="submit" className="flex-1 py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default CalendarPage;
