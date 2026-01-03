import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { getIcon } from '../constants';

interface AuthModuleProps {
  onAuthSuccess: () => void;
}

const AuthModule: React.FC<AuthModuleProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await supabaseService.signIn(email, password);
      } else {
        await supabaseService.signUp(email, password, fullName);
      }
      
      // El onAuthStateChange manejará el cambio automáticamente
      // Solo llamamos onAuthSuccess para cerrar el modal si es necesario
      // No necesitamos delays, Supabase actualiza inmediatamente
      onAuthSuccess();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || err.error?.message || 'Ocurrió un error. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <p className="font-garamond italic text-[#8B5E75] text-sm">
          {isLogin ? 'Bienvenido de vuelta' : 'Crea tu perfil académico'}
        </p>
      </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8B5E75] mb-2 font-inter tracking-widest">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre..."
                className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E35B8F]"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8B5E75] mb-2 font-inter tracking-widest">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E35B8F]"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[#8B5E75] mb-2 font-inter tracking-widest">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/60 border border-[#F8C8DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E35B8F]"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 rounded-2xl font-cinzel text-sm font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : (
              isLogin ? 'Ingresar' : 'Crear Perfil'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setEmail('');
              setPassword('');
              setFullName('');
            }}
            className="text-[#8B5E75] text-sm font-inter hover:text-[#E35B8F] transition-colors"
          >
            {isLogin ? (
              <>
                ¿No tienes cuenta? <span className="font-bold">Regístrate</span>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta? <span className="font-bold">Inicia sesión</span>
              </>
            )}
          </button>
        </div>
    </>
  );
};

export default AuthModule;

