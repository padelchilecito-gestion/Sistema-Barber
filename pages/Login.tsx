import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail, UserPlus, LogIn, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // El observador en App.tsx detectará el cambio y redirigirá automáticamente
    } catch (err: any) {
      console.error(err);
      let msg = 'Ocurrió un error.';
      if (err.code === 'auth/invalid-credential') msg = 'Credenciales incorrectas.';
      if (err.code === 'auth/email-already-in-use') msg = 'Este email ya está registrado.';
      if (err.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-lg shadow-amber-500/20">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isRegistering ? 'Crear Administrador' : 'Acceso BarberPro'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isRegistering ? 'Registra tu cuenta principal' : 'Ingresa para gestionar tu negocio'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-amber-500 outline-none transition-colors"
                placeholder="admin@barberia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-amber-500 outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Procesando...' : (isRegistering ? <UserPlus size={20}/> : <LogIn size={20}/>)}
            {loading ? '' : (isRegistering ? 'Registrarme' : 'Ingresar')}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <p className="text-slate-500 text-sm mb-2">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿Es tu primera vez?'}
          </p>
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-amber-500 hover:text-amber-400 text-sm font-semibold hover:underline"
          >
            {isRegistering ? 'Inicia Sesión aquí' : 'Crear cuenta de Administrador'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
