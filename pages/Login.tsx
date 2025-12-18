import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Lock, Mail, LogIn, AlertCircle, CheckCircle, Code } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Manejo del Login normal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El observador en App.tsx redirigirá automáticamente
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      if (err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
        setError('Error al iniciar sesión. Verifica tu conexión.');
      }
    }
  };

  // Manejo de Recuperación de Contraseña
  const handleResetPassword = async () => {
    if (!email) {
      setError('Escribe tu email arriba para recuperar la contraseña.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('¡Listo! Revisa tu correo para cambiar la clave.');
    } catch (err: any) {
      console.error(err);
      setError('No se pudo enviar el correo. Verifica que el email sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
        <div className="text-center mb-8">
          <div className="bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 shadow-lg shadow-amber-500/20">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Administración</h2>
          <p className="text-slate-400 text-sm mt-2">Acceso exclusivo para el dueño.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg mb-6 text-sm flex items-center gap-2 animate-in fade-in">
            <CheckCircle size={16} /> {successMsg}
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
            {loading ? 'Procesando...' : <LogIn size={20}/>}
            {loading ? '' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <button 
            onClick={handleResetPassword}
            type="button"
            className="text-slate-500 hover:text-amber-500 text-sm transition-colors hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>

      {/* CRÉDITO DEL DESARROLLADOR - EDUARDO RICCI */}
      <div className="mt-8 text-center opacity-40 hover:opacity-80 transition-opacity">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1 justify-center">
             <Code size={10} /> Dev by Eduardo Ricci
          </p>
      </div>
    </div>
  );
};

export default Login;
