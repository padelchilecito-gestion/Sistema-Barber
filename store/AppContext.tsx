
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, Client, Transaction, TransactionType, ServiceItem, ShopSettings, WeeklySchedule, LicenseTier } from '../types';

interface AppState {
  appointments: Appointment[];
  clients: Client[];
  transactions: Transaction[];
  services: ServiceItem[];
  settings: ShopSettings;
  addAppointment: (apt: Appointment) => void;
  addClient: (client: Client) => void;
  addTransaction: (tx: Transaction) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  addService: (service: ServiceItem) => void;
  removeService: (id: string) => void;
  updateSettings: (settings: ShopSettings) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY = 'barberpro_db_v5';

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Carlos Gomez', phone: '555-0101', notes: 'Fade alto, poco arriba.', totalVisits: 5, loyaltyPoints: 4, avatarUrl: 'https://picsum.photos/seed/carlos/150/150' },
  { id: '2', name: 'Miguel Angel', phone: '555-0202', notes: 'Barba perfilada y corte clásico.', totalVisits: 12, loyaltyPoints: 2, avatarUrl: 'https://picsum.photos/seed/miguel/150/150' },
  { id: '3', name: 'Sofia Lopez', phone: '555-0303', notes: 'Diseño en la nuca.', totalVisits: 2, loyaltyPoints: 2, avatarUrl: 'https://picsum.photos/seed/sofia/150/150' },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '101', clientId: '1', clientName: 'Carlos Gomez', service: 'Corte Degradado', stylePreference: 'Quiere probar un diseño de rayitas', date: new Date().toISOString().split('T')[0], time: '10:00', price: 15, status: AppointmentStatus.CONFIRMED },
  { id: '102', clientId: '2', clientName: 'Miguel Angel', service: 'Barba + Corte', stylePreference: 'Solo bajar volumen', date: new Date().toISOString().split('T')[0], time: '18:00', price: 25, status: AppointmentStatus.PENDING },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: new Date().toISOString().split('T')[0], description: 'Pago Carlos Gomez', amount: 15, type: TransactionType.INCOME },
  { id: 't2', date: new Date().toISOString().split('T')[0], description: 'Compra de navajas', amount: 50, type: TransactionType.EXPENSE },
];

const MOCK_SERVICES: ServiceItem[] = [
  { id: 's1', name: 'Corte Clásico', price: 15, durationMinutes: 30 },
  { id: 's2', name: 'Corte + Barba', price: 25, durationMinutes: 50 },
  { id: 's3', name: 'Perfilado de Barba', price: 10, durationMinutes: 20 },
];

const createDefaultSchedule = (): WeeklySchedule => {
  const weekdaySchedule = {
    isOpen: true,
    ranges: [{ start: '09:00', end: '13:00' }, { start: '17:00', end: '22:00' }]
  };
  const saturdaySchedule = {
    isOpen: true,
    ranges: [{ start: '09:00', end: '13:00' }]
  };
  const closedSchedule = {
    isOpen: false,
    ranges: []
  };

  return {
    monday: weekdaySchedule,
    tuesday: weekdaySchedule,
    wednesday: weekdaySchedule,
    thursday: weekdaySchedule,
    friday: weekdaySchedule,
    saturday: saturdaySchedule,
    sunday: closedSchedule
  };
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'BarberPro Shop',
  schedule: createDefaultSchedule(),
  licenseTier: LicenseTier.BASIC
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or fallback to Mocks
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).appointments || MOCK_APPOINTMENTS : MOCK_APPOINTMENTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).clients || MOCK_CLIENTS : MOCK_CLIENTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).transactions || MOCK_TRANSACTIONS : MOCK_TRANSACTIONS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).services || MOCK_SERVICES : MOCK_SERVICES;
  });

  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).settings || DEFAULT_SETTINGS : DEFAULT_SETTINGS;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = { appointments, clients, transactions, services, settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [appointments, clients, transactions, services, settings]);

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
    
    // Auto-add expected income if confirmed/completed (simplified logic)
    if(apt.status === AppointmentStatus.COMPLETED) {
        addTransaction({
            id: Date.now().toString(),
            date: apt.date,
            description: `Servicio: ${apt.clientName}`,
            amount: apt.price,
            type: TransactionType.INCOME
        });
    }
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
      setAppointments(prev => prev.map(a => {
          if (a.id === id) {
             const oldStatus = a.status;
             const updated = { ...a, status };
             
             // If marking COMPLETED (and wasn't already), handle Transactions and Loyalty
             if (status === AppointmentStatus.COMPLETED && oldStatus !== AppointmentStatus.COMPLETED) {
                 
                 // 1. Add Transaction
                 setTransactions(currT => [...currT, {
                     id: Date.now().toString(),
                     date: new Date().toISOString().split('T')[0],
                     description: `Servicio Finalizado: ${a.clientName}`,
                     amount: a.price,
                     type: TransactionType.INCOME
                 }]);

                 // 2. Update Client Loyalty (Only if it's a real registered client)
                 if (a.clientId && a.clientId !== 'guest' && a.clientId !== 'ai-guest') {
                    setClients(currC => currC.map(c => {
                        if (c.id === a.clientId) {
                            const newPoints = c.loyaltyPoints + 1;
                            // Reset if reached 5 (Simulate Cycle) or just cap it? 
                            // Let's cap at 5 for the UI to show "Free Cut Available"
                            const finalPoints = newPoints > 5 ? 1 : newPoints; 
                            return { 
                                ...c, 
                                totalVisits: c.totalVisits + 1,
                                loyaltyPoints: finalPoints
                            };
                        }
                        return c;
                    }));
                 }
             }
             return updated;
          }
          return a;
      }));
  };

  const addClient = (client: Client) => setClients(prev => [...prev, client]);
  const addTransaction = (tx: Transaction) => setTransactions(prev => [...prev, tx]);
  
  const addService = (service: ServiceItem) => setServices(prev => [...prev, service]);
  const removeService = (id: string) => setServices(prev => prev.filter(s => s.id !== id));
  
  const updateSettings = (newSettings: ShopSettings) => setSettings(newSettings);

  return (
    <AppContext.Provider value={{ 
        appointments, clients, transactions, services, settings,
        addAppointment, addClient, addTransaction, updateAppointmentStatus,
        addService, removeService, updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
