import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulación de validación API
    setTimeout(() => {
      login('dummy_jwt_token_123', { id: '1', username: 'admin', role: 'admin' });
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-100 p-4 rounded-full mb-4">
            <ShieldCheck className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">SysAdmin Pro</h1>
          <p className="text-slate-500 mt-2 text-center">Ingresa tus credenciales de administrador para continuar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
            <div className="relative">
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="••••••••"
              />
              <Lock className="absolute right-4 top-3.5 text-slate-400 w-5 h-5" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
