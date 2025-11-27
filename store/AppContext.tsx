import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, Client, Transaction, ServiceItem, ShopSettings, LicenseTier, WeeklySchedule } from '../types';
import { db } from '../firebase'; // Importamos la conexión
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  setDoc
} from 'firebase/firestore';

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

// Valores por defecto para inicializar (y evitar errores mientras carga)
const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'BarberPro Shop',
  schedule: { /* ...copia aquí tu schedule por defecto del archivo original... */ } as WeeklySchedule, 
  licenseTier: LicenseTier.BASIC
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);

  // --- ESCUCHADORES EN TIEMPO REAL (REAL-TIME LISTENERS) ---
  
  useEffect(() => {
    // 1. Escuchar Turnos
    const unsubApt = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    });

    // 2. Escuchar Clientes
    const unsubCli = onSnapshot(collection(db, 'clients'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(data);
    });

    // 3. Escuchar Transacciones
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(data);
    });

    // 4. Escuchar Servicios
    const unsubSrv = onSnapshot(collection(db, 'services'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem));
        setServices(data);
    });

    // 5. Escuchar Configuración (Documento único 'config/main')
    const unsubSet = onSnapshot(doc(db, 'config', 'main'), (docSnap) => {
        if (docSnap.exists()) {
            setSettings(docSnap.data() as ShopSettings);
        } else {
            // Si no existe, crearlo con valores por defecto
            setDoc(doc(db, 'config', 'main'), DEFAULT_SETTINGS);
        }
    });

    return () => {
        // Limpiar escuchadores al desmontar
        unsubApt(); unsubCli(); unsubTx(); unsubSrv(); unsubSet();
    };
  }, []);

  // --- FUNCIONES DE ESCRITURA (ACTIONS) ---

  const addAppointment = async (apt: Appointment) => {
    // Firebase crea el ID automáticamente, desestructuramos para quitar el ID temporal si existe
    const { id, ...rest } = apt; 
    await addDoc(collection(db, 'appointments'), rest);
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
      const aptRef = doc(db, 'appointments', id);
      await updateDoc(aptRef, { status });
      
      // Lógica de transacción automática si se completa
      // (Nota: Idealmente esto se hace en el backend, pero aquí en el cliente funciona para empezar)
      if (status === AppointmentStatus.COMPLETED) {
          const apt = appointments.find(a => a.id === id);
          if (apt) {
               addTransaction({
                   id: '', // Firebase lo generará
                   date: new Date().toISOString().split('T')[0],
                   description: `Servicio Finalizado: ${apt.clientName}`,
                   amount: apt.price,
                   type: 'INCOME' // Ajustar al tipo correcto si usas Enum
               } as any);
          }
      }
  };

  const addClient = async (client: Client) => {
      const { id, ...rest } = client;
      await addDoc(collection(db, 'clients'), rest);
  };

  const addTransaction = async (tx: Transaction) => {
      const { id, ...rest } = tx;
      await addDoc(collection(db, 'transactions'), rest);
  };

  const addService = async (service: ServiceItem) => {
      const { id, ...rest } = service;
      await addDoc(collection(db, 'services'), rest);
  };

  const removeService = async (id: string) => {
      await deleteDoc(doc(db, 'services', id));
  };

  const updateSettings = async (newSettings: ShopSettings) => {
      await setDoc(doc(db, 'config', 'main'), newSettings);
  };

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
