import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { getIcon } from '../constants';

interface AuthModuleProps {
  onAuthSuccess: () => void;
  isMobile?: boolean;
  isNightMode?: boolean;
}

const AuthModule: React.FC<AuthModuleProps> = ({ onAuthSuccess, isMobile = false, isNightMode = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      await supabaseService.signInWithGoogle();
      // No llamamos onAuthSuccess aquí porque Google redirige
      // El onAuthStateChange manejará el cambio cuando regrese
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || err.error?.message || 'Error al iniciar sesión con Google. Intenta nuevamente.');
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className={`text-center ${isMobile ? 'mb-6' : 'mb-6'}`}>
        <p className={`font-garamond italic ${isMobile ? 'text-2xl md:text-sm' : 'text-sm'} transition-colors duration-500 ${
          isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
        }`}>
          {isLogin ? 'Bienvenida nuevamente' : 'Crea tu perfil académico'}
        </p>
      </div>

        <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-5' : 'space-y-6'}`}>
          {!isLogin && (
            <div>
              <label className={`block text-[10px] uppercase font-bold mb-2 font-inter tracking-widest transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#8B5E75]'
              }`}>
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre..."
                className={`w-full border-2 rounded-xl px-4 ${isMobile ? 'py-4 text-lg' : 'py-3.5 text-base'} focus:outline-none focus:border-[#C77DFF] ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'} transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50' 
                    : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
                }`}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className={`block text-[10px] uppercase font-bold mb-2 font-inter tracking-widest transition-colors duration-500 ${
              isNightMode ? 'text-[#F5E6D3]' : 'text-[#8B5E75]'
            }`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={`w-full border-2 rounded-xl px-4 ${isMobile ? 'py-4 text-lg' : 'py-3.5 text-base'} focus:outline-none focus:border-[#E35B8F] ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'} transition-colors duration-500 ${
                isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50'
                  : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-[10px] uppercase font-bold mb-2 font-inter tracking-widest transition-colors duration-500 ${
              isNightMode ? 'text-[#F5E6D3]' : 'text-[#8B5E75]'
            }`}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full border-2 rounded-xl px-4 ${isMobile ? 'py-4 text-lg' : 'py-3.5 text-base'} focus:outline-none focus:border-[#E35B8F] ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'} transition-colors duration-500 ${
                isNightMode 
                    ? 'bg-[rgba(48,43,79,0.4)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50'
                  : 'bg-white/60 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50'
              }`}
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
            className={`w-full btn-primary ${isMobile ? 'py-5 text-base' : 'py-4 text-sm'} rounded-xl sm:rounded-2xl font-cinzel font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'} touch-manipulation active:scale-95`}
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

        {/* Botón de Google Auth */}
        <div className={isMobile ? 'mt-5' : 'mt-6'}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className={`w-full flex items-center justify-center gap-3 ${isMobile ? 'py-5 text-base' : 'py-4 text-sm'} rounded-xl sm:rounded-2xl border-2 font-cinzel font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'} touch-manipulation active:scale-95 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,0.8)] hover:border-[#C77DFF] hover:shadow-[0_0_15px_rgba(199,125,255,0.3)]' 
                : 'bg-white border-[#F8C8DC] text-[#4A233E] hover:bg-[#FFF0F5] hover:border-[#D4AF37]'
            }`}
          >
            {googleLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#4A233E]/30 border-t-[#4A233E] rounded-full animate-spin" />
                <span>Conectando...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>
        </div>

        <div className={isMobile ? 'mt-5 text-center' : 'mt-6 text-center'}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setEmail('');
              setPassword('');
              setFullName('');
            }}
            className={`${isMobile ? 'text-base' : 'text-sm'} font-inter hover:text-[#C77DFF] transition-colors ${
              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
            }`}
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

