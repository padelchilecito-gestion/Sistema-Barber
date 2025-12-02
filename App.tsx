// App.tsx
import React, { useState, useEffect } from 'react';
import { AppProvider } from './store/AppContext'; // Importaciones corregidas sin src
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import ClientsPage from './pages/Clients';
import FinancesPage from './pages/Finances';
import AIAssistant from './pages/AIAssistant';
import SettingsPage from './pages/Settings';
import PremiumTools from './pages/PremiumTools';
import InstallPWA from './components/InstallPWA';
import Login from './pages/Login';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- NUEVAS IMPORTACIONES ---
import { PROJECT_STATUS } from './config';  // Archivo en la misma carpeta raíz
import SuspendedView from './components/SuspendedView'; // Archivo en carpeta components
// ----------------------------

const App: React.FC = () => {
  // 1. --- EL INTERRUPTOR DE CORTE ---
  if (!PROJECT_STATUS.isActive) {
    return <SuspendedView />;
  }
  // ----------------------------------

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  // Estados de Autenticación
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Lógica de Cliente / Invitado
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const storedMode = localStorage.getItem('barber_app_mode');

    if (viewParam === 'client') {
      localStorage.setItem('barber_app_mode', 'guest');
      setIsGuestMode(true);
    } 
    else if (viewParam === 'admin_reset') {
      localStorage.removeItem('barber_app_mode');
      setIsGuestMode(false);
    }
    else {
      if (storedMode === 'guest') {
        setIsGuestMode(true);
      } else {
        setIsGuestMode(false);
      }
    }

    // 2. Listener de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setTab={setActiveTab} />;
      case 'calendar': return <CalendarPage />;
      case 'clients': return <ClientsPage />;
      case 'finances': return <FinancesPage />;
      case 'assistant': return <AIAssistant navigateToCalendar={() => setActiveTab('calendar')} />;
      case 'premium': return <PremiumTools />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard setTab={setActiveTab} />;
    }
  };

  // --- VISTA MODO INVITADO (CLIENTE) ---
  if (isGuestMode) {
    return (
      <AppProvider>
         <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4">
            <InstallPWA />
            <main className="max-w-md mx-auto h-[90vh] mt-4">
                <AIAssistant isGuestMode={true} />
            </main>
         </div>
      </AppProvider>
    );
  }

  // --- PANTALLA DE CARGA ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // --- VISTA DE LOGIN ---
  if (!user) {
    return <Login />;
  }

  // --- VISTA ADMINISTRADOR ---
  return (
    <AppProvider>
      <InstallPWA />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </AppProvider>
  );
};

export default App;
