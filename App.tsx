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
import InstallPWA from './components/InstallPWA'; // Importamos el nuevo componente

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    // Check for query param ?view=client
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'client') {
      setIsGuestMode(true);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setTab={setActiveTab} />;
      case 'calendar':
        return <CalendarPage />;
      case 'clients':
        return <ClientsPage />;
      case 'finances':
        return <FinancesPage />;
      case 'assistant':
        return <AIAssistant navigateToCalendar={() => setActiveTab('calendar')} />;
      case 'premium':
        return <PremiumTools />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard setTab={setActiveTab} />;
    }
  };

  if (isGuestMode) {
    // Simplified Layout for Client/Guest Mode
    return (
      <AppProvider>
         <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4">
            <InstallPWA /> {/* Botón de instalación para clientes */}
            <main className="max-w-md mx-auto h-[90vh] mt-4">
                <AIAssistant isGuestMode={true} />
            </main>
         </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <InstallPWA /> {/* Botón de instalación para el administrador */}
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </AppProvider>
  );
};

export default App;
