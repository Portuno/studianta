import React, { useState, useEffect, useRef } from 'react';
import { supabaseService, UserProfile } from '../services/supabaseService';
import { getIcon } from '../constants';
import AuthModule from './AuthModule';
import { supabase } from '../services/supabaseService';
import { useInteractionAggregator } from '../hooks/useInteractionAggregator';
import { Subject, Transaction, JournalEntry, CustomCalendarEvent, Module, NavView, BalanzaProTransaction } from '../types';

interface ProfileModuleProps {
  user: any;
  onAuthSuccess: () => void;
  onSignOut: () => void;
  isMobile: boolean;
  subjects?: Subject[];
  transactions?: Transaction[];
  journalEntries?: JournalEntry[];
  customEvents?: CustomCalendarEvent[];
  modules?: Module[];
  monthlyBudget?: number;
  setActiveView?: (view: any) => void;
  isNightMode?: boolean;
}


const ProfileModule: React.FC<ProfileModuleProps> = ({ 
  user, 
  onAuthSuccess, 
  onSignOut, 
  isMobile,
  subjects = [],
  transactions = [],
  journalEntries = [],
  customEvents = [],
  modules = [],
  monthlyBudget = 0,
  setActiveView,
  isNightMode = false
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [career, setCareer] = useState('');
  const [institution, setInstitution] = useState('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [balanzaProTransactions, setBalanzaProTransactions] = useState<BalanzaProTransaction[]>([]);

  // Cargar transacciones de Balanza Pro si el módulo está activo
  useEffect(() => {
    const loadBalanzaProTransactions = async () => {
      const balanzaModule = modules.find(m => m.id === 'balanza');
      if (user && balanzaModule?.active) {
        try {
          const data = await supabaseService.getBalanzaProTransactions(user.id);
          setBalanzaProTransactions(data);
        } catch (error) {
          console.error('Error loading balanza pro transactions:', error);
          setBalanzaProTransactions([]);
        }
      } else {
        setBalanzaProTransactions([]);
      }
    };

    loadBalanzaProTransactions();
  }, [user, modules]);

  // Generar el SPC completo
  const spc = useInteractionAggregator({
    userProfile: profile,
    subjects,
    transactions,
    journalEntries,
    customEvents,
    modules,
    monthlyBudget,
    balanzaProTransactions,
  });

  // Función para descargar el SPC
  const handleDownloadSPC = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `student_profile_context_${dateStr}.json`;
    
    const jsonStr = JSON.stringify(spc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await supabaseService.getProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setFullName(userProfile.full_name || '');
        setCareer(userProfile.career || '');
        setInstitution(userProfile.institution || '');
        setCurrency(userProfile.currency || 'EUR');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const avatarUrl = await supabaseService.uploadAvatar(user.id, file);
      await supabaseService.updateProfile(user.id, { avatar_url: avatarUrl });
      await loadProfile();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto. Por favor, intenta nuevamente.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await supabaseService.updateProfile(user.id, {
        full_name: fullName,
        career: career,
        institution: institution,
        currency: currency,
      });
      await loadProfile();
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border-2 backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card border-[#D4AF37]/30'
          }`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border-4 shadow-lg transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-gradient-to-br from-[#C77DFF] to-[#A68A56] border-[rgba(48,43,79,0.8)]' 
                  : 'bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] border-white'
              }`}>
                {getIcon('profile', 'w-8 h-8 text-white')}
              </div>
              <h1 className={`font-cinzel text-4xl md:text-5xl font-bold mb-2 uppercase tracking-widest transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>
                Iniciar Sesión
              </h1>
            </div>
            <AuthModule onAuthSuccess={onAuthSuccess} isNightMode={isNightMode} />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E35B8F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-cinzel text-[#2D1A26] text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  // Datos del perfil
  const avatarUrl = profile?.avatar_url || null;
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Estudiante';
  const displayEmail = profile?.email || user.email || '';
  const displayCareer = profile?.career || 'No especificada';
  const displayInstitution = profile?.institution || 'No especificada';
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const joinDate = createdAt.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Si es móvil, mantener diseño vertical simplificado
  if (isMobile) {
    return (
      <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md glass-card rounded-[2rem] p-6 shadow-2xl border-2 border-[#D4AF37]/30">
          <div className="text-center mb-6">
            <div 
              className="relative w-24 h-24 mx-auto mb-4 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] flex items-center justify-center">
                  {getIcon('profile', 'w-12 h-12 text-white')}
                </div>
              )}
              <div className="absolute -inset-2 rounded-full border-2 border-[#D4AF37] opacity-50"></div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <h2 className="font-marcellus text-3xl font-bold text-[#2D1A26] mb-1">{displayName}</h2>
            <p className="font-garamond text-[#8B5E75] text-base italic mb-4">{displayEmail}</p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[8px] uppercase font-bold text-[#8B5E75] mb-1 font-inter tracking-[0.2em]">Carrera</p>
              <p className="font-garamond text-[#2D1A26]">{displayCareer}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-bold text-[#8B5E75] mb-1 font-inter tracking-[0.2em]">Institución</p>
              <p className="font-garamond text-[#2D1A26]">{displayInstitution}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 btn-primary py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest"
            >
              Editar
            </button>
            <button
              onClick={handleDownloadSPC}
              className={`flex-1 border-2 py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[#A68A56]/80 border-[#A68A56] text-[#E0E1DD]' 
                  : 'bg-[#D4AF37]/80 border-[#D4AF37] text-[#2D1A26]'
              }`}
            >
              {getIcon('download', 'w-3 h-3')}
              Descargar SPC
            </button>
            <button
              onClick={onSignOut}
              className="flex-1 bg-red-100/60 border-2 border-red-300 text-red-700 py-2 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Diseño horizontal tipo credencial para desktop/tablet
  return (
    <div className="h-full flex items-center justify-center p-6 md:p-8 overflow-y-auto">
      {/* Contenedor principal - El Tríptico de Identidad */}
      <div 
        className="w-full max-w-6xl glass-card rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(255,245,250,0.95) 0%, rgba(253,238,244,0.95) 100%)',
          border: '0.5px solid rgba(212, 175, 55, 0.3)',
        }}
      >
        {/* Refuerzos metálicos en las esquinas */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] opacity-60"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] opacity-60"></div>

        {/* Marca de agua STUDIANTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
          <div className="font-cinzel text-[20rem] font-black text-[#2D1A26] transform -rotate-12">
            STUDIANTA
          </div>
        </div>

        {/* Contenido principal - 3 columnas */}
        <div className="relative z-10 grid grid-cols-12 gap-6 md:gap-8">
          
          {/* A. Columna Izquierda: El Rostro del Saber (1:2:1 = 3 columnas) */}
          <div className="col-span-12 md:col-span-3 flex flex-col items-center">
            {/* Avatar Circular Maestro con borde doble */}
            <div 
              className="relative mb-6 cursor-pointer group"
              onMouseEnter={() => setHoveringAvatar(true)}
              onMouseLeave={() => setHoveringAvatar(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Borde exterior dorado con aura */}
              <div className="absolute -inset-3 rounded-full border-2 border-[#D4AF37] opacity-60 blur-sm"></div>
              {/* Borde interior */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden bg-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E35B8F] to-[#D4AF37] flex items-center justify-center">
                    {getIcon('profile', 'w-16 h-16 md:w-20 md:h-20 text-white')}
                  </div>
                )}
                {/* Overlay al hover */}
                <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
                  hoveringAvatar ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="bg-[#D4AF37] rounded-full p-3 shadow-xl">
                    {getIcon('camera', 'w-6 h-6 text-white')}
                  </div>
                </div>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Identidad Primaria */}
            <div className="text-center w-full">
              <h2 className="font-marcellus text-3xl md:text-3xl font-bold text-[#2D1A26] mb-2">
                {editing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/80 border border-[#F8C8DC] rounded-xl px-3 py-2 text-xl md:text-3xl font-marcellus font-bold text-[#2D1A26] focus:outline-none focus:border-[#E35B8F] text-center"
                  />
                ) : (
                  displayName
                )}
              </h2>
              <p className="font-garamond text-[#8B5E75] text-base md:text-base italic opacity-80 mb-4">
                {displayEmail}
              </p>
              
              {/* Enlaces Legales - Debajo de la foto de perfil */}
              {setActiveView && (
                <div className="mt-4 pt-4 border-t border-[#F8C8DC]/50">
                  <div className="flex flex-col gap-2">
                    <a
                      href="/privacidad"
                      onClick={(e) => {
                        e.preventDefault();
                        if (setActiveView) {
                          setActiveView(NavView.PRIVACY_POLICY);
                        } else {
                          window.location.href = '/privacidad';
                        }
                      }}
                      className="font-garamond text-sm text-[#8B5E75] hover:text-[#2D1A26] transition-colors underline-offset-2 hover:underline"
                    >
                      Política de Privacidad
                    </a>
                    <a
                      href="/terminosycondiciones"
                      onClick={(e) => {
                        e.preventDefault();
                        if (setActiveView) {
                          setActiveView(NavView.TERMS_OF_SERVICE);
                        } else {
                          window.location.href = '/terminosycondiciones';
                        }
                      }}
                      className="font-garamond text-sm text-[#8B5E75] hover:text-[#2D1A26] transition-colors underline-offset-2 hover:underline"
                    >
                      Términos y Condiciones
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* B. Columna Central: El Registro Académico */}
          <div className="col-span-12 md:col-span-9 flex flex-col justify-center space-y-6">
            {/* Díptico Informativo - Dos bloques horizontales paralelos */}
            
            {/* Bloque 1: Carrera + Institución */}
            <div className="grid grid-cols-2 gap-4">
              {/* Carrera */}
              <div className="bg-white/40 rounded-xl p-4 border border-[#F8C8DC]/50">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('book', 'w-4 h-4 text-[#8B5E75]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    CARRERA
                  </label>
                </div>
                {editing ? (
                  <input
                    type="text"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="w-full bg-white/80 border border-[#F8C8DC] rounded-lg px-3 py-2 text-base font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                    placeholder="Tu carrera..."
                  />
                ) : (
                  <p className="font-garamond text-base md:text-xl text-[#2D1A26]">{displayCareer}</p>
                )}
              </div>

              {/* Institución */}
              <div className="bg-white/40 rounded-xl p-4 border border-[#F8C8DC]/50">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('university', 'w-4 h-4 text-[#8B5E75]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    INSTITUCIÓN
                  </label>
                </div>
                {editing ? (
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-white/80 border border-[#F8C8DC] rounded-lg px-3 py-2 text-base font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                    placeholder="Tu universidad..."
                  />
                ) : (
                  <p className="font-garamond text-base md:text-xl text-[#2D1A26]">{displayInstitution}</p>
                )}
              </div>
            </div>

            {/* Bloque 2: Fecha de Ingreso + Moneda */}
            <div className="grid grid-cols-2 gap-4">
              {/* Fecha de Ingreso */}
              <div className="bg-white/40 rounded-xl p-4 border border-[#F8C8DC]/50">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('calendar', 'w-4 h-4 text-[#8B5E75]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    INGRESO
                  </label>
                </div>
                <p className="font-garamond text-base md:text-xl text-[#2D1A26] capitalize">{joinDate}</p>
              </div>

              {/* Moneda */}
              <div className="bg-white/40 rounded-xl p-4 border border-[#F8C8DC]/50">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon('crystal', 'w-4 h-4 text-[#8B5E75]')}
                  <label className="text-[8px] uppercase font-bold text-[#8B5E75] font-inter tracking-[0.3em]">
                    MONEDA
                  </label>
                </div>
                {editing ? (
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white/80 border border-[#F8C8DC] rounded-lg px-3 py-2 text-base font-garamond text-[#2D1A26] focus:outline-none focus:border-[#E35B8F]"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="ARS">Peso Argentino ($)</option>
                    <option value="GBP">Libra Esterlina (£)</option>
                    <option value="MXN">Peso Mexicano ($)</option>
                    <option value="CLP">Peso Chileno ($)</option>
                    <option value="COP">Peso Colombiano ($)</option>
                    <option value="BRL">Real Brasileño (R$)</option>
                    <option value="PEN">Sol Peruano (S/)</option>
                  </select>
                ) : (
                  <p className="font-garamond text-base md:text-xl text-[#2D1A26]">
                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'BRL' ? 'R$' : currency === 'PEN' ? 'S/' : '$'} {currency}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Botones de Acción - En la parte inferior */}
        <div className="relative z-10 mt-8 pt-6 border-t border-[#F8C8DC]/50 flex flex-col sm:flex-row gap-4">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 btn-primary py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest shadow-lg"
              >
              Guardar Cambios
            </button>
              <button
                onClick={() => {
                  setEditing(false);
                  loadProfile();
                }}
                className="flex-1 bg-white/60 border-2 border-[#F8C8DC] text-[#8B5E75] py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest hover:bg-white/80 transition-colors"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 btn-primary py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest shadow-lg"
              >
                Editar Credencial
              </button>
              <button
                onClick={handleDownloadSPC}
                className="flex-1 bg-[#D4AF37]/80 border-2 border-[#D4AF37] text-[#2D1A26] py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                {getIcon('download', 'w-4 h-4')}
                Descargar SPC
              </button>
              <button
                onClick={onSignOut}
                className="flex-1 bg-red-100/60 border-2 border-red-300 text-red-700 py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest hover:bg-red-200/60 transition-colors"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModule;
