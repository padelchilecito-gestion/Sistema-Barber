import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, Client, Transaction, ServiceItem, ShopSettings, LicenseTier, WeeklySchedule, GalleryItem } from '../types';
import { db } from '../firebase'; 
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
  gallery: GalleryItem[];
  addAppointment: (apt: Appointment) => void;
  addClient: (client: Client) => void;
  addTransaction: (tx: Transaction) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  addService: (service: ServiceItem) => void;
  removeService: (id: string) => void;
  updateSettings: (settings: ShopSettings) => void;
  addPhoto: (photo: GalleryItem) => void;
  removePhoto: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// --- 1. CONFIGURACIÓN DE HORARIOS POR DEFECTO (CORREGIDA) ---
const createDefaultSchedule = (): WeeklySchedule => {
  // Lunes a Viernes: 9-13 y 18-22 (Corrección solicitada: Tarde arranca 18hs)
  const weekdaySchedule = {
    isOpen: true,
    ranges: [
      { start: '09:00', end: '13:00' }, 
      { start: '18:00', end: '22:00' }
    ]
  };
  
  // Sábado: Solo mañana de 9 a 13
  const saturdaySchedule = {
    isOpen: true,
    ranges: [
      { start: '09:00', end: '13:00' }
    ]
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
    saturday: saturdaySchedule, // Aplica horario de sábado
    sunday: closedSchedule
  };
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'BarberPro Shop',
  contactPhone: '',
  schedule: createDefaultSchedule(),
  licenseTier: LicenseTier.BASIC
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    // --- Listeners de Firebase ---
    const unsubApt = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    });

    const unsubCli = onSnapshot(collection(db, 'clients'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(data);
    });

    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(data);
    });

    const unsubSrv = onSnapshot(collection(db, 'services'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem));
        setServices(data);
    });

    const unsubGal = onSnapshot(collection(db, 'gallery'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
        setGallery(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // --- Sincronización de Configuración y Auto-Reparación ---
    const unsubSet = onSnapshot(doc(db, 'config', 'main'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as ShopSettings;
            
            // Si la data viene vacía o corrupta, o queremos forzar la actualización de estructura
            if (!data.schedule || !data.schedule.monday) {
                console.warn("Configuración incompleta. Aplicando valores por defecto...");
                setDoc(doc(db, 'config', 'main'), DEFAULT_SETTINGS); 
                setSettings(DEFAULT_SETTINGS);
            } else {
                setSettings(data);
            }
        } else {
            // Si no existe el documento, lo creamos con los nuevos horarios
            setDoc(doc(db, 'config', 'main'), DEFAULT_SETTINGS);
            setSettings(DEFAULT_SETTINGS);
        }
    });

    return () => {
        unsubApt(); unsubCli(); unsubTx(); unsubSrv(); unsubSet(); unsubGal();
    };
  }, []);

  // --- Actions ---
  const addAppointment = async (apt: Appointment) => {
    const { id, ...rest } = apt;
    const safeData = JSON.parse(JSON.stringify(rest));
    await addDoc(collection(db, 'appointments'), safeData);
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
      const aptRef = doc(db, 'appointments', id);
      await updateDoc(aptRef, { status });
      
      if (status === AppointmentStatus.COMPLETED) {
          const apt = appointments.find(a => a.id === id);
          if (apt) {
               addTransaction({
                   id: '', 
                   date: new Date().toISOString().split('T')[0],
                   description: `Servicio Finalizado: ${apt.clientName}`,
                   amount: apt.price,
                   type: 'INCOME' as any
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

  const addPhoto = async (photo: GalleryItem) => {
      const { id, ...rest } = photo;
      await addDoc(collection(db, 'gallery'), rest);
  };

  const removePhoto = async (id: string) => {
      await deleteDoc(doc(db, 'gallery', id));
  };

  return (
    <AppContext.Provider value={{ 
        appointments, clients, transactions, services, settings, gallery,
        addAppointment, addClient, addTransaction, updateAppointmentStatus,
        addService, removeService, updateSettings, addPhoto, removePhoto
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
