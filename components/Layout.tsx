import React from 'react';
import { Calendar, Users, DollarSign, MessageSquare, Scissors, Home, Settings, Crown, LogOut, Terminal } from 'lucide-react'; 
import { useApp } from '../store/AppContext';
import { LicenseTier } from '../types';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth'; 

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { settings } = useApp();
  const isPremium = settings.licenseTier === LicenseTier.PREMIUM;

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar sesión?')) {
      signOut(auth);
    }
  };

  const navItems = [
    { id: 'dashboard', icon: <Home size={24} />, label: 'Inicio' },
    { id: 'calendar', icon: <Calendar size={24} />, label: 'Agenda' },
    { id: 'assistant', icon: <MessageSquare size={24} />, label: 'IA Chat' },
    { id: 'clients', icon: <Users size={24} />, label: 'Clientes' },
    { id: 'finances', icon: <DollarSign size={24} />, label: 'Caja' },
    ...(isPremium ? [{ id: 'premium', icon: <Crown size={24} className="text-amber-400" />, label: 'Premium' }] : []),
    { id: 'settings', icon: <Settings size={24} />, label: 'Config' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 md:pb-0 md:pl-20">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
        <div className="flex items-center space-x-2">
           <div className="bg-amber-500 p-1.5 rounded-lg text-slate-900">
             <Scissors size={20} />
           </div>
           <h1 className="text-xl font-bold tracking-tight text-white">BarberPro</h1>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white p-2">
            <LogOut size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 bg-slate-800 border-r border-slate-700 items-center py-6 z-30">
        <div className="bg-amber-500 p-2 rounded-xl text-slate-900 mb-8 shadow-lg shadow-amber-500/20">
             <Scissors size={28} />
        </div>
        
        <div className="flex-1 flex flex-col gap-4 w-full px-2">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-3 rounded-xl transition-all duration-200 group relative flex justify-center ${activeTab === item.id ? 'bg-slate-700 text-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    {item.icon}
                    <span className="absolute left-14 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-600 shadow-xl">
                        {item.label}
                    </span>
                </button>
            ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-4 mt-auto">
            {/* Logout */}
            <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 p-3 hover:bg-slate-700/50 rounded-xl transition-colors" 
                title="Cerrar Sesión">
                <LogOut size={24} />
            </button>
            
            {/* Developer Credit - Sutil */}
            <div className="text-[10px] text-slate-700 font-mono hover:text-slate-500 transition-colors cursor-default group relative" title="Eduardo Ricci Dev">
                ER
                <span className="absolute left-10 bottom-0 bg-slate-900 border border-slate-700 text-slate-400 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none w-max">
                  Dev: Eduardo Ricci
                </span>
            </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around p-3 z-30 safe-area-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center space-y-1 ${activeTab === item.id ? 'text-amber-500' : 'text-slate-500'}`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
