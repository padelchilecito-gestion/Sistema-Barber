import React, { useState, useEffect } from 'react';
import { AppProvider } from './store/AppContext';
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

// --- KILL SWITCH (CONTROL AUTOMÁTICO) ---
import { useLicense } from './hooks/useLicense';
import SuspendedView from './components/SuspendedView';
// ----------------------------------------

const App: React.FC = () => {
  // 1. VERIFICACIÓN DE LICENCIA
  const { isLocked, loading: licenseLoading } = useLicense();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Lógica Cliente / Invitado
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
      setIsGuestMode(storedMode === 'guest');
    }

    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. SPINNER DE CARGA INICIAL (Evita parpadeo)
  if (licenseLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // 3. BLOQUEO TOTAL SI LA LICENCIA ESTÁ INACTIVA
  if (isLocked) {
    return <SuspendedView />;
  }

  // --- RENDERIZADO DE CONTENIDO NORMAL ---

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

  // VISTA MODO INVITADO
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

  // SPINNER DE AUTH (Solo si la licencia pasó)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // VISTA LOGIN ADMIN
  if (!user) {
    return <Login />;
  }

  // VISTA PRINCIPAL
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
