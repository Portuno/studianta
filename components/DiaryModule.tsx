
import React, { useState, useRef, useMemo, useEffect, useId } from 'react';
import { JournalEntry, MoodType } from '../types';
import { getIcon, COLORS } from '../constants';
import { supabaseService } from '../services/supabaseService';

interface DiaryModuleProps {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  isMobile: boolean;
  securityModuleActive?: boolean;
  securityPin?: string;
  onVerifyPin?: (pin: string) => Promise<boolean>;
  isNightMode?: boolean;
}

// Componente para iconos de ánimos con degradados
const MoodIcon: React.FC<{ type: MoodType; className?: string }> = ({ type, className = "w-6 h-6" }) => {
  const id = useId();
  switch (type) {
    case 'Radiante':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`sunGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FF6347" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="5" fill={`url(#sunGradient-${id})`} />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54M4.93 19.07l3.54-3.54M15.54 8.46l3.54-3.54" stroke={`url(#sunGradient-${id})`} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'Enfocada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`moonGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9370DB" />
              <stop offset="50%" stopColor="#BA55D3" />
              <stop offset="100%" stopColor="#E35B8F" />
            </linearGradient>
          </defs>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={`url(#moonGradient-${id})`} />
        </svg>
      );
    case 'Equilibrada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`cloudGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" />
              <stop offset="50%" stopColor="#9370DB" />
              <stop offset="100%" stopColor="#8B5E75" />
            </linearGradient>
          </defs>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill={`url(#cloudGradient-${id})`} />
        </svg>
      );
    case 'Agotada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`crystalGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A233E" />
              <stop offset="50%" stopColor="#6B4C7A" />
              <stop offset="100%" stopColor="#8B5E75" />
            </linearGradient>
          </defs>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={`url(#crystalGradient-${id})`} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'Estresada':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={`lightningGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FF6347" />
              <stop offset="100%" stopColor="#E35B8F" />
            </linearGradient>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={`url(#lightningGradient-${id})`} />
        </svg>
      );
    default:
      return null;
  }
};

const MOODS: { type: MoodType; icon: string; color: string; label: string }[] = [
  { type: 'Radiante', icon: 'sun', color: '#D4AF37', label: 'Radiante' },
  { type: 'Enfocada', icon: 'moon', color: '#E35B8F', label: 'Enfocada' },
  { type: 'Equilibrada', icon: 'cloud', color: '#8B5E75', label: 'Equilibrada' },
  { type: 'Agotada', icon: 'crystal', color: '#4A233E', label: 'Agotada' },
  { type: 'Estresada', icon: 'lightning', color: '#E35B8F', label: 'Estresada' },
];

const PROMPTS = [
  "¿Qué susurro del universo resonó en tu alma hoy?",
  "¿Qué fragmento de eternidad capturaste en este instante?",
  "Describe el eco de tu experiencia en este momento sagrado.",
  "¿Qué verdad velada se reveló ante tus ojos?",
  "¿Cómo danzó la luz en tu corazón esta jornada?",
  "¿Qué misterio del cosmos se desplegó en tu camino?",
  "¿Qué semilla de sabiduría plantaste en tu jardín interior?",
  "¿Qué melodía silenciosa escuchaste en el viento?"
];

// Componente del Sello de Studianta
const StudiantaSeal: React.FC<{ className?: string; size?: number }> = ({ className = "w-8 h-8", size = 32 }) => {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`sealGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E35B8F" />
          <stop offset="50%" stopColor="#C94A7A" />
          <stop offset="100%" stopColor="#B8396A" />
        </linearGradient>
        <filter id={`sealShadow-${id}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Cera del sello - Rosa Intenso */}
      <circle cx="32" cy="32" r="30" fill={`url(#sealGradient-${id})`} filter={`url(#sealShadow-${id})`} />
      
      {/* Relieve en Oro Antiguo - Borde exterior */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.8" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
      
      {/* Laurel izquierdo */}
      <path d="M18 24 Q16 20 18 18 Q20 16 22 18 Q20 20 20 24 Q20 28 22 30 Q24 32 22 34 Q20 36 20 40 Q20 44 22 46" 
            stroke="#D4AF37" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M18 24 Q16 28 18 30 Q20 32 22 30 Q20 28 20 24" 
            stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.7" />
      
      {/* Laurel derecho */}
      <path d="M46 24 Q48 20 46 18 Q44 16 42 18 Q44 20 44 24 Q44 28 42 30 Q40 32 42 34 Q44 36 44 40 Q44 44 42 46" 
            stroke="#D4AF37" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M46 24 Q48 28 46 30 Q44 32 42 30 Q44 28 44 24" 
            stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.7" />
      
      {/* S estilizada de Studianta */}
      <path d="M28 20 Q24 20 24 24 Q24 28 28 28 Q32 28 32 24 Q32 20 36 20 Q40 20 40 24 Q40 28 36 28 Q32 28 32 32 Q32 36 36 36 Q40 36 40 40 Q40 44 36 44 Q32 44 32 40" 
            stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Detalles de relieve interno */}
      <circle cx="32" cy="32" r="24" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
};

// Componente de Botón con Sello
interface SealButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const SealButton: React.FC<SealButtonProps> = ({ onClick, label = "Sellar Crónica", className = "", size = 'md', disabled = false }) => {
  const sizeClasses = {
    sm: 'px-6 py-2.5 text-[9px]',
    md: 'px-8 py-3 text-[10px]',
    lg: 'px-12 py-4 text-sm'
  };
  
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} rounded-full font-cinzel font-black uppercase tracking-[0.4em] shadow-[0_8px_20px_rgba(227,91,143,0.5),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:scale-[1.03] active:scale-[0.98] transition-all relative flex items-center justify-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #E35B8F 0%, #C94A7A 100%)',
        filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.4))'
      }}
    >
      <StudiantaSeal className={iconSizes[size]} />
      <span className="text-white">{label}</span>
    </button>
  );
};

const DiaryModule: React.FC<DiaryModuleProps> = ({
  isNightMode = false, 
  entries, 
  onAddEntry, 
  onDeleteEntry, 
  onUpdateEntry, 
  isMobile,
  securityModuleActive = false,
  securityPin,
  onVerifyPin
}) => {
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]); // URLs de las fotos (para mostrar)
  const [photoFiles, setPhotoFiles] = useState<File[]>([]); // Archivos originales (para subir)
  const [isLocked, setIsLocked] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGrimorioOpen, setIsGrimorioOpen] = useState(false);
  const [photoRotations, setPhotoRotations] = useState<number[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingEntryToView, setPendingEntryToView] = useState<JournalEntry | null>(null);
  const [unlockedEntries, setUnlockedEntries] = useState<Set<string>>(new Set()); // IDs de entradas desbloqueadas en esta sesión
  const [showStories, setShowStories] = useState(false); // Toggle entre editor e historias
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // ID de la entrada que se está editando
  const [isSaving, setIsSaving] = useState(false); // Flag para prevenir múltiples guardados simultáneos
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const randomPrompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);
  
  // Debug: Log para ver qué fotos tienen las entradas
  useEffect(() => {
    if (entries.length > 0) {
      entries.forEach(entry => {
        if (entry.photos && entry.photos.length > 0) {
          console.log('Entry photos:', entry.id, entry.photos);
        } else if (entry.photo) {
          console.log('Entry photo (old format):', entry.id, entry.photo);
        }
      });
    }
  }, [entries]);

  // Filtrar entradas basado en búsqueda semántica
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase().trim();
    return entries.filter(entry => {
      // Si hay búsqueda activa, excluir entradas bloqueadas por PIN
      if (entry.isLocked && securityModuleActive) {
        return false;
      }
      
      // Búsqueda en contenido
      const contentMatch = entry.content.toLowerCase().includes(query);
      // Búsqueda en ánimo
      const moodMatch = entry.mood.toLowerCase().includes(query);
      // Búsqueda en fecha
      const dateStr = new Date(entry.date).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).toLowerCase();
      const dateMatch = dateStr.includes(query);
      
      return contentMatch || moodMatch || dateMatch;
    });
  }, [entries, searchQuery, securityModuleActive]);
  

  // Función para ver entrada completa
  const handleViewEntry = async (entry: JournalEntry) => {
    // Si la entrada está bloqueada y el módulo de seguridad está activo, pedir PIN
    if (entry.isLocked && securityModuleActive && onVerifyPin) {
      setPendingEntryToView(entry);
      setShowPinModal(true);
      setPinInput('');
      setPinError('');
    } else {
      setSelectedEntry(entry);
    }
  };

  // Función para verificar PIN y abrir entrada
  const handleVerifyPin = async (providedPin?: string) => {
    // Usar el PIN proporcionado o el del estado
    const pinToVerify = (providedPin || pinInput).trim();
    
    // Validar que el PIN tenga exactamente 4 dígitos
    if (pinToVerify.length !== 4 || !/^\d{4}$/.test(pinToVerify)) {
      setPinError('El PIN debe tener 4 dígitos');
      return;
    }

    // Dar tiempo para que React actualice el estado antes de verificar
    setTimeout(async () => {
      if (onVerifyPin) {
        const isValid = await onVerifyPin(pinToVerify);
        if (isValid) {
          if (pendingEntryToView) {
            // Marcar la entrada como desbloqueada en esta sesión
            setUnlockedEntries(prev => new Set(prev).add(pendingEntryToView.id));
            setSelectedEntry(pendingEntryToView);
          }
          setShowPinModal(false);
          setPinInput('');
          setPinError('');
          setPendingEntryToView(null);
        } else {
          setPinError('PIN incorrecto');
          setPinInput('');
        }
      } else if (securityPin && pinToVerify === securityPin) {
        if (pendingEntryToView) {
          // Marcar la entrada como desbloqueada en esta sesión
          setUnlockedEntries(prev => new Set(prev).add(pendingEntryToView.id));
          setSelectedEntry(pendingEntryToView);
        }
        setShowPinModal(false);
        setPinInput('');
        setPinError('');
        setPendingEntryToView(null);
      } else {
        setPinError('PIN incorrecto');
        setPinInput('');
      }
    }, 50);
  };

  // Función para confirmar borrado
  const handleDeleteClick = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(entryId);
  };

  const handleConfirmDelete = (entryId: string) => {
    onDeleteEntry(entryId);
    setShowDeleteConfirm(null);
  };

  // Función determinista para calcular rotación basada en el ID de la entrada
  const getEntryPhotoRotation = (entryId: string): number => {
    // Usar el ID para generar un número determinista entre -2 y 2
    let hash = 0;
    for (let i = 0; i < entryId.length; i++) {
      hash = entryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ((hash % 400) / 100) - 2; // Entre -2 y 2
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limitar a 3 fotos máximo
    const remainingSlots = 3 - photos.length;
    if (remainingSlots <= 0) {
      alert("Ya has alcanzado el límite de 3 fotos por entrada.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    const filesToProcess = files.slice(0, remainingSlots);
    
    // Procesar todas las fotos de forma sincronizada con Promise.all
    const photoPromises = filesToProcess.map((file) => {
      return new Promise<{ dataUrl: string; rotation: number }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            dataUrl: reader.result as string,
            rotation: Math.random() * 4 - 2 // Entre -2 y 2 grados
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    try {
      const processedPhotos = await Promise.all(photoPromises);
      
      // Actualizar estado solo cuando todas las fotos estén listas
      const newPhotos = processedPhotos.map(p => p.dataUrl);
      const newRotations = processedPhotos.map(p => p.rotation);
      
      setPhotoFiles(prev => [...prev, ...filesToProcess]);
      setPhotos(prev => [...prev, ...newPhotos]);
      setPhotoRotations(prev => [...prev, ...newRotations]);
      
      // Limpiar el input después de procesar
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error procesando fotos:', error);
      alert('Error al procesar las fotos. Por favor, intenta nuevamente.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    // Prevenir múltiples ejecuciones simultáneas
    if (isSaving) {
      return;
    }
    
    if (!activeMood) {
      alert("Por favor, selecciona un cristal de ánimo antes de sellar tu memoria.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Obtener el usuario actual
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        alert("Debes estar autenticado para guardar entradas.");
        setIsSaving(false);
        return;
      }

      let photoUrls: string[] = [];

      // Si hay fotos nuevas para subir (photoFiles), subirlas al bucket
      if (photoFiles.length > 0) {
        if (editingEntryId) {
          // Editar: calcular el índice inicial basándose en el número de fotos existentes
          const existingEntry = entries.find(e => e.id === editingEntryId);
          const existingPhotos = existingEntry?.photos || (existingEntry?.photo ? [existingEntry.photo] : []);
          const existingUrls = existingPhotos.filter((p: string) => p && p.startsWith('http'));
          const startIndex = existingUrls.length; // Índice inicial para nuevas fotos
          
          // Subir nuevas fotos usando el entryId existente con índices correctos
          for (let i = 0; i < photoFiles.length; i++) {
            const url = await supabaseService.uploadJournalPhoto(
              user.id,
              editingEntryId,
              photoFiles[i],
              startIndex + i // Índice correcto basado en fotos existentes
            );
            photoUrls.push(url);
          }
        } else {
          // Crear: primero crear la entrada para obtener el ID, luego subir fotos
          const createdEntry = await supabaseService.createJournalEntry(user.id, {
            date: entryDate,
            mood: activeMood,
            content: content,
            isLocked: isLocked,
            sentiment: 0
          });

          // Subir fotos usando el ID de la entrada creada
          for (let i = 0; i < photoFiles.length; i++) {
            const url = await supabaseService.uploadJournalPhoto(
              user.id,
              createdEntry.id,
              photoFiles[i],
              i
            );
            photoUrls.push(url);
          }

          // Actualizar la entrada con las URLs de las fotos
          const updatedEntry = await supabaseService.updateJournalEntry(
            user.id,
            createdEntry.id,
            { photos: photoUrls }
          );

          // Llamar al callback con la entrada completa (solo una vez)
          onAddEntry(updatedEntry);

          // Limpiar el formulario
          setActiveMood(null);
          setContent('');
          setPhotos([]);
          setPhotoFiles([]);
          setPhotoRotations([]);
          setIsLocked(false);
          setEntryDate(new Date().toISOString().split('T')[0]);
          setIsSaving(false);
          return;
        }
      }

      // Si estamos editando
      if (editingEntryId) {
        const existingEntry = entries.find(e => e.id === editingEntryId);
        if (existingEntry) {
          // Obtener fotos existentes que ya son URLs (no base64)
          const existingPhotos = existingEntry.photos || (existingEntry.photo ? [existingEntry.photo] : []);
          const existingUrls = existingPhotos.filter((p: string) => p && p.startsWith('http'));
          
          // Combinar URLs existentes con nuevas fotos subidas (evitar duplicados)
          const allPhotoUrls = [...existingUrls, ...photoUrls];
          
          // Si hay fotos, usar el array; si no, usar undefined para que se maneje correctamente
          const finalPhotos = allPhotoUrls.length > 0 ? allPhotoUrls : undefined;
          
          // Actualizar la entrada en la BD primero
          const updatedEntryFromDB = await supabaseService.updateJournalEntry(
            user.id,
            editingEntryId,
            {
              date: entryDate,
              mood: activeMood,
              content: content,
              photos: finalPhotos,
              isLocked: isLocked
            }
          );
          
          // Llamar al callback solo una vez con la entrada actualizada
          onUpdateEntry(updatedEntryFromDB);
        }
        setEditingEntryId(null);
      } else if (photoFiles.length === 0) {
        // Crear entrada sin fotos
        const createdEntry = await supabaseService.createJournalEntry(user.id, {
          date: entryDate,
          mood: activeMood,
          content: content,
          isLocked: isLocked,
          sentiment: 0
        });
        
        // Llamar al callback solo una vez
        onAddEntry(createdEntry);
      }

      // Limpiar el formulario
      setActiveMood(null);
      setContent('');
      setPhotos([]);
      setPhotoFiles([]);
      setPhotoRotations([]);
      setIsLocked(false);
      setEntryDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      console.error('Error guardando entrada:', error);
      const errorMessage = error?.message || 'Error desconocido';
      if (errorMessage.includes('column "photos"') || errorMessage.includes('does not exist')) {
        alert('Error: La base de datos no tiene el campo "photos". Por favor, ejecuta el script SQL 19_add_photos_array_to_journal_entries.sql en Supabase.');
      } else {
        alert(`Error al guardar la entrada: ${errorMessage}. Por favor, intenta nuevamente.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const insertQuote = () => {
    setContent(prev => prev + '\n"Revelación: ..."\n');
  };

  const handleEdit = (entry: JournalEntry) => {
    // Cargar los datos de la entrada en el editor
    setEditingEntryId(entry.id);
    setActiveMood(entry.mood as MoodType);
    setContent(entry.content);
    // Manejar compatibilidad: si tiene photos usar photos, si no tiene photos pero tiene photo (antiguo), convertir a array
    if (entry.photos && entry.photos.length > 0) {
      // Si son URLs (empiezan con http), usarlas directamente
      // Si son base64 (antiguas), también usarlas para preview
      setPhotos(entry.photos);
      setPhotoRotations(entry.photos.map(() => Math.random() * 4 - 2));
      setPhotoFiles([]); // No hay archivos nuevos, solo URLs existentes
    } else if (entry.photo) {
      // Entrada antigua con solo una foto (puede ser base64 o URL)
      setPhotos([entry.photo]);
      setPhotoRotations([Math.random() * 4 - 2]);
      setPhotoFiles([]);
    } else {
      setPhotos([]);
      setPhotoFiles([]);
      setPhotoRotations([]);
    }
    setIsLocked(entry.isLocked || false);
    setEntryDate(entry.date);
    // Cambiar a la vista del editor
    setShowStories(false);
  };

  // Componente Modal de Pantalla Completa
  const EntryModal: React.FC<{ entry: JournalEntry; onClose: () => void }> = ({ entry, onClose }) => {
    const mood = MOODS.find(m => m.type === entry.mood);
    const entryPhotoRotation = getEntryPhotoRotation(entry.id);
    // Verificar si la entrada está desbloqueada (ya sea porque no está bloqueada o porque fue desbloqueada en esta sesión)
    const isUnlocked = !entry.isLocked || unlockedEntries.has(entry.id);
    
    return (
      <div 
        className={`fixed inset-0 z-[200] backdrop-blur-sm flex items-center justify-center p-4 transition-colors duration-500 ${
          isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-black/50'
        }`}
        onClick={onClose}
      >
        <div 
          className={`w-full h-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.95)] border-2 border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
              : 'bg-white'
          }`}
          onClick={(e) => e.stopPropagation()}
          style={isNightMode ? {} : {
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
            backgroundColor: '#FFFEF7'
          }}
        >
          {/* Header del Modal */}
          <div className={`flex-none p-6 border-b transition-colors duration-500 ${
            isNightMode 
              ? 'border-[#A68A56]/40 bg-[rgba(48,43,79,0.8)]' 
              : 'border-[#D4AF37]/30 bg-white/80'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-inner border transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(199,125,255,0.2)] border-[#A68A56]/40' 
                    : 'bg-[#FFF0F5] border-[#F8C8DC]'
                }`}>
                  {mood && <MoodIcon type={mood.type} className="w-6 h-6" />}
                </div>
                <div>
                  <p className={`text-2xl font-serif font-bold italic transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`} style={{ fontFamily: 'Georgia, serif' }}>
                    {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className={`text-base uppercase font-black tracking-widest opacity-60 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>{entry.mood}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className={`transition-colors p-2 ${
                  isNightMode ? 'text-[#7A748E] hover:text-[#E0E1DD]' : 'text-[#8B5E75] hover:text-[#2D1A26]'
                }`}
              >
                {getIcon('x', 'w-6 h-6')}
              </button>
            </div>
          </div>

          {/* Contenido del Modal */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {entry.isLocked && securityModuleActive && !isUnlocked ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${
                  isNightMode ? 'bg-[rgba(166,138,86,0.2)]' : 'bg-[#4A233E]/10'
                }`}>
                  {getIcon('lock', `w-12 h-12 ${isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'}`)}
                </div>
                <p className={`text-2xl font-cinzel mb-2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}>Contenido Protegido</p>
                <p className={`text-base font-garamond italic transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  Esta entrada está protegida. Debes ingresar el PIN para ver su contenido.
                </p>
              </div>
            ) : (
              <>
                <div className="prose max-w-none">
                  <p className={`text-2xl font-garamond leading-relaxed italic first-letter:text-4xl first-letter:font-marcellus first-letter:mr-2 transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}>
                    {entry.content}
                  </p>
                </div>
                {(() => {
                  // Obtener todas las fotos disponibles
                  const allPhotos = entry.photos || (entry.photo ? [entry.photo] : []);
                  // Filtrar solo valores válidos
                  const validPhotos = allPhotos.filter((photo: any) => {
                    if (!photo) return false;
                    if (typeof photo !== 'string') return false;
                    return photo.trim() !== '';
                  });
                  
                  if (validPhotos.length === 0) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-4 justify-center mt-6">
                      {validPhotos.map((photo: string, index: number) => (
                        <div 
                          key={`${entry.id}-modal-photo-${index}`}
                          className={`w-full max-w-md p-4 transition-colors duration-500 ${
                            isNightMode ? 'bg-[rgba(48,43,79,0.8)]' : 'bg-white'
                          }`}
                          style={{ 
                            transform: `rotate(${getEntryPhotoRotation(entry.id + index)}deg)`,
                            boxShadow: isNightMode 
                              ? '0 8px 24px rgba(0,0,0,0.4), 0 0 0 12px rgba(48,43,79,0.8), 0 0 0 14px rgba(166,138,86,0.3)'
                              : '0 8px 24px rgba(0,0,0,0.2), 0 0 0 12px white, 0 0 0 14px rgba(248,200,220,0.2)'
                          }}
                        >
                          <img 
                            src={photo} 
                            alt={`Memoria ${index + 1}`} 
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                              console.error('Error cargando imagen en modal:', photo, 'Entry ID:', entry.id);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Imagen cargada en modal:', photo.substring(0, 50) + '...');
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className={`h-full flex flex-col overflow-hidden -mt-4 -mx-4 font-inter transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
      }`}>
        <header className={`flex-none p-4 pt-6 border-b shadow-sm z-20 backdrop-blur-md transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40' 
            : 'bg-white/40 border-[#F8C8DC]'
        }`}>
          <div className="text-center mb-4">
            <h1 className={`font-cinzel text-2xl font-black tracking-[0.25em] uppercase transition-colors duration-500 ${
              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
            }`}>Diario</h1>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Estado Vital</span>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${
                  isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                }`}>{activeMood || ''}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {MOODS.map(mood => (
                  <button
                    key={mood.type}
                    onClick={() => setActiveMood(mood.type)}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                      activeMood === mood.type 
                        ? isNightMode
                          ? 'bg-[#C77DFF] text-white border-[#C77DFF] shadow-md scale-105'
                          : 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-md scale-105'
                        : isNightMode
                          ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border-[#A68A56]/40'
                          : 'bg-white/60 text-[#8B5E75] border-[#F8C8DC]'
                    }`}
                  >
                    <MoodIcon type={mood.type} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-none w-32">
              <span className={`text-[9px] font-black uppercase tracking-widest mb-2 block px-1 transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>Sello Cronológico</span>
              <div className={`relative border-[0.5px] rounded-xl overflow-hidden shadow-inner transition-colors duration-500 ${
                isNightMode 
                  ? 'border-[#A68A56] bg-[rgba(48,43,79,0.6)]' 
                  : 'border-[#D4AF37] bg-white/60'
              }`}>
                <input 
                  type="date" 
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className={`w-full bg-transparent px-3 py-2 text-[10px] font-garamond font-bold outline-none transition-colors duration-500 ${
                    isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                  }`}
                />
              </div>
            </div>
          </div>
        </header>

        <main className={`flex-1 min-h-0 overflow-hidden p-6 relative transition-colors duration-500 ${
          isNightMode ? 'bg-[rgba(26,26,46,0.3)]' : 'bg-white/20'
        }`}>
          {!showStories ? (
            <div className="relative h-full flex flex-col">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={randomPrompt}
                className={`w-full h-full bg-transparent text-2xl font-garamond leading-relaxed placeholder:italic placeholder:opacity-20 focus:outline-none resize-none overflow-y-auto transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                }`}
                style={isNightMode ? {} : {
                  backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
                  backgroundColor: '#FFFEF7'
                }}
              />
              {photos.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 justify-end mb-20">
                  {photos.map((photo, index) => (
                    <div 
                      key={index}
                      className={`w-36 h-36 p-2 relative transition-colors duration-500 ${
                        isNightMode ? 'bg-[rgba(48,43,79,0.8)]' : 'bg-white'
                      }`}
                      style={{ 
                        transform: `rotate(${photoRotations[index] || 0}deg)`,
                        boxShadow: isNightMode 
                          ? '0 8px 16px rgba(0,0,0,0.4), 0 0 0 8px rgba(48,43,79,0.8), 0 0 0 10px rgba(166,138,86,0.3)'
                          : '0 8px 16px rgba(0,0,0,0.15), 0 0 0 8px white, 0 0 0 10px rgba(248,200,220,0.3)'
                      }}
                    >
                      <img src={photo} alt={`Memoria ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setPhotos(prev => prev.filter((_, i) => i !== index));
                          setPhotoFiles(prev => prev.filter((_, i) => i !== index));
                          setPhotoRotations(prev => prev.filter((_, i) => i !== index));
                        }} 
                        className="absolute -top-2 -right-2 bg-red-400 text-white p-1 rounded-full shadow-lg z-10"
                      >
                        {getIcon('trash', 'w-3 h-3')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
              ) : (
            <div 
              className="h-full overflow-y-auto overflow-x-hidden space-y-6 pb-20 transition-colors duration-500" 
              style={isNightMode ? {
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'auto',
                touchAction: 'pan-y'
              } : {
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")', 
                backgroundColor: '#FFF9FB', 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'auto',
                touchAction: 'pan-y'
              }}
            >
              {/* Buscador */}
              <div className={`sticky top-0 z-10 mb-4 backdrop-blur-sm rounded-2xl p-3 border shadow-sm transition-colors duration-500 ${
                isNightMode 
                  ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                  : 'bg-white/90 border-[#D4AF37]/20'
              }`}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en el cuaderno..."
                    className={`w-full bg-transparent px-4 py-2 pr-10 text-base font-garamond focus:outline-none border rounded-xl transition-colors duration-500 ${
                      isNightMode 
                        ? 'text-[#E0E1DD] placeholder:text-[#7A748E]/50 border-[#A68A56]/40' 
                        : 'text-[#2D1A26] placeholder:text-[#8B5E75]/50 border-[#F8C8DC]'
                    }`}
                  />
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]/50' : 'text-[#8B5E75]/50'
                  }`}>
                    {getIcon('search', 'w-4 h-4') || (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                {searchQuery && (
                  <p className={`text-sm mt-2 px-1 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {filteredEntries.length} {filteredEntries.length === 1 ? 'entrada encontrada' : 'entradas encontradas'}
                  </p>
                )}
              </div>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className={`font-garamond italic transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>No se encontraron entradas que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                const mood = MOODS.find(m => m.type === entry.mood);
                const entryPhotoRotation = getEntryPhotoRotation(entry.id);
                return (
                  <div 
                    key={entry.id} 
                    onClick={() => handleViewEntry(entry)}
                    className={`relative p-7 border-2 shadow-sm overflow-hidden backdrop-blur-sm cursor-pointer hover:shadow-md transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                        : 'bg-white/80 border-[#D4AF37]/30'
                    }`}
                    style={{
                      borderImage: isNightMode 
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(166,138,86,0.4) 8px, rgba(166,138,86,0.4) 16px) 1'
                        : 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(212,175,55,0.3) 8px, rgba(212,175,55,0.3) 16px) 1',
                      borderStyle: 'solid',
                      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4 relative z-20">
                       <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl shadow-inner border transition-colors duration-500 ${
                            isNightMode 
                              ? 'bg-[rgba(199,125,255,0.2)] text-[#A68A56] border-[#A68A56]/40' 
                              : 'bg-[#FFF0F5] text-[#D4AF37] border-[#F8C8DC]'
                          }`}>
                            {mood && <MoodIcon type={mood.type} className="w-4 h-4" />}
                          </div>
                          <div>
                             <p className={`text-[12px] font-serif font-bold tracking-wide italic transition-colors duration-500 ${
                               isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                             }`} style={{ fontFamily: 'Georgia, serif' }}>
                               {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                             </p>
                             <p className={`text-[9px] uppercase font-black tracking-[0.2em] opacity-60 transition-colors duration-500 ${
                               isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                             }`}>{entry.mood}</p>
                          </div>
                       </div>
                       <div className="flex gap-2 items-center">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             handleEdit(entry);
                           }} 
                           className={`px-3 py-1.5 rounded-lg text-[10px] font-cinzel font-black uppercase tracking-wider shadow-md transition-colors relative z-30 ${
                             isNightMode 
                               ? 'bg-[#C77DFF] text-white hover:bg-[#B56DFF]' 
                               : 'bg-[#D4AF37] text-white hover:bg-[#C49F2F]'
                           }`}
                         >
                           EDITAR
                         </button>
                         <button 
                           onClick={(e) => handleDeleteClick(entry.id, e)} 
                           className={`transition-colors p-2 relative z-30 ${
                             isNightMode 
                               ? 'text-[#7A748E]/40 hover:text-red-400' 
                               : 'text-[#8B5E75]/40 hover:text-red-400'
                           }`}
                         >
                           {getIcon('trash', 'w-4 h-4')}
                         </button>
                       </div>
                    </div>
                    {entry.isLocked && securityModuleActive ? (
                      <div className="text-center py-4">
                        <div className={`inline-flex items-center gap-2 font-garamond italic text-base transition-colors duration-500 ${
                          isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                        }`}>
                          {getIcon('lock', 'w-5 h-5')}
                          <span>Contenido protegido - Toca para desbloquear</span>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-[17px] font-garamond leading-relaxed italic opacity-90 first-letter:text-3xl first-letter:font-marcellus first-letter:mr-1 line-clamp-3 transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                      }`}>{entry.content}</p>
                    )}
                    {(() => {
                      // Obtener todas las fotos disponibles
                      const allPhotos = entry.photos || (entry.photo ? [entry.photo] : []);
                      // Filtrar solo valores válidos (no null, no undefined, no strings vacíos)
                      const validPhotos = allPhotos.filter((photo: any) => {
                        if (!photo) return false;
                        if (typeof photo !== 'string') return false;
                        return photo.trim() !== '';
                      });
                      
                      if (validPhotos.length === 0) return null;
                      
                      return (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          {validPhotos.map((photo: string, index: number) => (
                            <div 
                              key={`${entry.id}-photo-${index}`}
                              className={`w-32 h-32 p-2 transition-colors duration-500 ${
                                isNightMode ? 'bg-[rgba(48,43,79,0.8)]' : 'bg-white'
                              }`}
                              style={{ 
                                transform: `rotate(${getEntryPhotoRotation(entry.id + index)}deg)`,
                                boxShadow: isNightMode 
                                  ? '0 4px 12px rgba(0,0,0,0.4), 0 0 0 6px rgba(48,43,79,0.8), 0 0 0 8px rgba(166,138,86,0.3)'
                                  : '0 4px 12px rgba(0,0,0,0.15), 0 0 0 6px white, 0 0 0 8px rgba(248,200,220,0.3)'
                              }}
                            >
                              <img 
                                src={photo} 
                                alt={`Memoria ${index + 1}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Error cargando imagen:', photo, 'Entry ID:', entry.id);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Imagen cargada exitosamente:', photo.substring(0, 50) + '...');
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              }))}
            </div>
          )}
        </main>

        <div className="fixed bottom-28 left-4 right-4 z-[120] flex justify-between items-center pointer-events-none">
           <div className="flex gap-2 pointer-events-auto">
             {!showStories && (
               <>
                 <button onClick={insertQuote} className={`w-11 h-11 border rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-colors duration-500 ${
                   isNightMode 
                     ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56] text-[#A68A56]' 
                     : 'bg-white border-[#D4AF37] text-[#D4AF37]'
                 }`}>
                   <span className="font-serif font-bold text-2xl">"</span>
                 </button>
                 <button 
                   onClick={() => fileInputRef.current?.click()} 
                   className={`w-11 h-11 border rounded-full flex items-center justify-center shadow-lg active:scale-90 relative transition-colors duration-500 ${
                     isNightMode 
                       ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#7A748E]' 
                       : 'bg-white border-[#F8C8DC] text-[#8B5E75]'
                   }`}
                   disabled={photos.length >= 3}
                 >
                   {getIcon('camera', 'w-4 h-4')}
                   {photos.length > 0 && (
                     <span className={`absolute -top-1 -right-1 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center transition-colors duration-500 ${
                       isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                     }`}>
                       {photos.length}
                     </span>
                   )}
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   multiple
                   onChange={handlePhotoUpload} 
                 />
               </>
             )}
           </div>
           <div className="flex gap-3 items-center pointer-events-auto">
             <button 
               onClick={() => {
                 setShowStories(!showStories);
                 // Limpiar estado de edición al cambiar de vista
                 if (editingEntryId) {
                   setEditingEntryId(null);
                   setActiveMood(null);
                   setContent('');
                   setPhotos([]);
                   setPhotoFiles([]);
                   setPhotoRotations([]);
                   setIsLocked(false);
                   setEntryDate(new Date().toISOString().split('T')[0]);
                 }
               }}
               className={`px-4 py-2.5 border-2 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all font-cinzel text-[10px] font-black uppercase tracking-widest ${
                 isNightMode 
                   ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56] text-[#E0E1DD]' 
                   : 'bg-white border-[#D4AF37] text-[#2D1A26]'
               }`}
             >
               {showStories ? 'Escribir' : 'Ver Historias'}
             </button>
             {!showStories && (
               <div className="flex flex-col items-center gap-1">
                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(227,91,143,0.5),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] active:scale-95 transition-all relative ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                   style={{
                     background: 'linear-gradient(135deg, #E35B8F 0%, #C94A7A 100%)',
                     filter: 'drop-shadow(0 4px 8px rgba(212,175,55,0.4))'
                   }}
                 >
                   <StudiantaSeal className="w-10 h-10" />
                 </button>
                 {editingEntryId && (
                   <span className="text-[8px] font-cinzel font-black text-[#D4AF37] uppercase tracking-wider">
                     Editando
                   </span>
                 )}
               </div>
             )}
           </div>
        </div>

        <div className={`fixed inset-x-0 bottom-0 z-[150] bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(74,35,62,0.2)] border-t border-[#F8C8DC] transition-all duration-500 ease-in-out hidden`}>
          <div className="w-full h-full flex flex-col relative" style={{ minHeight: 0 }}>
            <div onClick={() => setIsGrimorioOpen(!isGrimorioOpen)} className="flex-none py-5 px-10 flex items-center justify-between cursor-pointer group shrink-0">
              <h3 className="font-marcellus text-[11px] font-black text-[#2D1A26] uppercase tracking-[0.4em]">Grimorio de Memorias</h3>
              <div className={`transition-all duration-500 text-[#D4AF37] ${isGrimorioOpen ? 'rotate-180 scale-125' : 'animate-bounce'}`}>
                {getIcon('chevron', 'w-4 h-4')}
              </div>
            </div>
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 pb-10" 
              style={{ 
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")', 
                backgroundColor: '#FFF9FB', 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'auto',
                touchAction: 'pan-y',
                position: 'relative',
                minHeight: 0,
                maxHeight: '100%',
                willChange: 'scroll-position',
                transform: 'translateZ(0)'
              }}
            >
              {/* Buscador */}
              <div className="sticky top-0 z-10 mb-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-[#D4AF37]/20 shadow-sm">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en el cuaderno..."
                    className="w-full bg-transparent px-4 py-2 pr-10 text-base font-garamond text-[#2D1A26] placeholder:text-[#8B5E75]/50 focus:outline-none border border-[#F8C8DC] rounded-xl"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B5E75]/50">
                    {getIcon('search', 'w-4 h-4') || (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                {searchQuery && (
                  <p className="text-sm text-[#8B5E75] mt-2 px-1">
                    {filteredEntries.length} {filteredEntries.length === 1 ? 'entrada encontrada' : 'entradas encontradas'}
                  </p>
                )}
              </div>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#8B5E75] font-garamond italic">No se encontraron entradas que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                const mood = MOODS.find(m => m.type === entry.mood);
                const entryPhotoRotation = getEntryPhotoRotation(entry.id);
                return (
                  <div 
                    key={entry.id} 
                    onClick={() => handleViewEntry(entry)}
                    className="relative p-7 border-2 border-[#D4AF37]/30 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all"
                    style={{
                      borderImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(212,175,55,0.3) 8px, rgba(212,175,55,0.3) 16px) 1',
                      borderStyle: 'solid',
                      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4 relative z-20">
                       <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-[#FFF0F5] text-[#D4AF37] shadow-inner border border-[#F8C8DC]">
                            {mood && <MoodIcon type={mood.type} className="w-4 h-4" />}
                          </div>
                          <div>
                             <p className="text-[12px] font-serif font-bold text-[#2D1A26] tracking-wide italic" style={{ fontFamily: 'Georgia, serif' }}>
                               {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                             </p>
                             <p className="text-[9px] text-[#8B5E75] uppercase font-black tracking-[0.2em] opacity-60">{entry.mood}</p>
                          </div>
                       </div>
                       <button 
                         onClick={(e) => handleDeleteClick(entry.id, e)} 
                         className="text-[#8B5E75]/40 hover:text-red-400 transition-colors p-2 relative z-30"
                       >
                         {getIcon('trash', 'w-4 h-4')}
                       </button>
                    </div>
                    {entry.isLocked && securityModuleActive ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-[#8B5E75] font-garamond italic text-base">
                          {getIcon('lock', 'w-5 h-5')}
                          <span>Contenido protegido - Toca para desbloquear</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[17px] text-[#2D1A26] font-garamond leading-relaxed italic opacity-90 first-letter:text-3xl first-letter:font-marcellus first-letter:mr-1 line-clamp-3">{entry.content}</p>
                    )}
                    {((entry.photos && entry.photos.length > 0) || entry.photo) && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {(entry.photos || (entry.photo ? [entry.photo] : [])).filter((photo: string) => photo).map((photo: string, index: number) => (
                          <div 
                            key={index}
                            className="w-32 h-32 p-2 bg-white"
                            style={{ 
                              transform: `rotate(${getEntryPhotoRotation(entry.id + index)}deg)`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 6px white, 0 0 0 8px rgba(248,200,220,0.3)'
                            }}
                          >
                            <img 
                              src={photo} 
                              alt={`Memoria ${index + 1}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Error cargando imagen:', photo);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Modal de Entrada Completa */}
        {selectedEntry && (
          <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}

        {/* Modal de Confirmación de Borrado - Mobile */}
        {showDeleteConfirm && (
          <div className={`fixed inset-0 z-[200] backdrop-blur-sm flex items-center justify-center p-4 transition-colors duration-500 ${
            isNightMode ? 'bg-[#1A1A2E]/90' : 'bg-black/50'
          }`} onClick={() => setShowDeleteConfirm(null)}>
            <div className={`rounded-2xl p-6 shadow-2xl max-w-md w-full backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.95)] border-2 border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
                : 'glass-card'
            }`} onClick={(e) => e.stopPropagation()}>
              <h3 className={`font-cinzel text-2xl mb-4 transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
              }`}>Confirmar Eliminación</h3>
              <p className={`font-garamond mb-6 text-base transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                ¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`px-6 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest border-2 transition-all ${
                    isNightMode 
                      ? 'border-[#A68A56]/40 text-[#7A748E] hover:bg-[rgba(48,43,79,1)] hover:text-[#E0E1DD]' 
                      : 'border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5]'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDelete(showDeleteConfirm)}
                  className="px-6 py-3 rounded-xl font-cinzel text-sm font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de PIN - Mobile */}
        {showPinModal && (
          <PinInputModal
            onVerify={handleVerifyPin}
            onCancel={() => {
              setShowPinModal(false);
              setPinInput('');
              setPinError('');
              setPendingEntryToView(null);
            }}
            pinInput={pinInput}
            setPinInput={setPinInput}
            pinError={pinError}
            setPinError={setPinError}
          />
        )}
      </div>
    );
  }

  // Tablet & Desktop Version
  return (
    <div className={`h-full flex flex-col pb-4 max-w-7xl mx-auto px-4 lg:px-0 transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : ''
    }`}>
      <header className={`mb-4 flex items-center border-b pb-3 transition-colors duration-500 ${
        isNightMode ? 'border-[#A68A56]/20' : 'border-[#D4AF37]/20'
      }`}>
        <h1 className={`font-marcellus text-2xl lg:text-3xl font-bold tracking-tight transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
        }`}>Diario</h1>
      </header>

      <div className="flex flex-col md:grid md:grid-cols-12 gap-4 lg:gap-6 flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4 overflow-y-auto pr-2 scroll-sm no-scrollbar">
          <div className={`p-4 lg:p-6 rounded-[2rem] lg:rounded-[3rem] shadow-2xl relative backdrop-blur-[15px] transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.6)] border-2 border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card border-[#F8C8DC] bg-white/70'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors duration-500 ${
                      isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                    }`}>Ánimo Académico</label>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                      isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                    }`}>{activeMood || 'Seleccionar'}</span>
                  </div>
                  <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                    {MOODS.map(mood => (
                      <button
                        key={mood.type}
                        onClick={() => setActiveMood(mood.type)}
                        className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${
                          activeMood === mood.type 
                            ? isNightMode
                              ? 'bg-[#C77DFF] text-white border-[#C77DFF] shadow-xl shadow-[#C77DFF]/30 scale-110'
                              : 'bg-[#E35B8F] text-white border-[#E35B8F] shadow-xl scale-110'
                            : isNightMode
                              ? 'bg-[rgba(48,43,79,0.4)] text-[#7A748E] border-[#A68A56]/40 hover:border-[#C77DFF]/50'
                              : 'bg-white/40 text-[#8B5E75] border-[#F8C8DC] hover:border-[#E35B8F]/30'
                        }`}
                      >
                        <MoodIcon type={mood.type} className="w-6 h-6 lg:w-7 lg:h-7" />
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Sello Cronológico</label>
                  <div className={`border-[0.5px] rounded-2xl overflow-hidden p-1 shadow-inner backdrop-blur-md transition-colors duration-500 ${
                    isNightMode 
                      ? 'border-[#A68A56] bg-[rgba(48,43,79,0.4)]' 
                      : 'border-[#D4AF37] bg-white/40'
                  }`}>
                    <input 
                      type="date" 
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className={`w-full bg-transparent px-4 py-3.5 text-base font-garamond font-bold outline-none transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                      }`}
                    />
                  </div>
               </div>
            </div>

            <div className="relative mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={randomPrompt}
                className={`w-full bg-transparent border-2 border-dashed rounded-[2rem] lg:rounded-[2.5rem] p-4 lg:p-6 text-2xl lg:text-2xl font-garamond leading-relaxed min-h-[200px] lg:min-h-[250px] focus:outline-none transition-all placeholder:italic resize-none ${
                  isNightMode 
                    ? 'border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]/50' 
                    : 'border-[#F8C8DC] text-[#2D1A26] placeholder:opacity-20 focus:border-[#D4AF37]/40'
                }`}
                style={isNightMode ? {} : {
                  backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
                  backgroundColor: '#FFFEF7'
                }}
              />
              {photos.length > 0 && (
                <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 flex flex-wrap gap-3 max-w-[200px] lg:max-w-[300px]">
                  {photos.map((photo, index) => (
                    <div 
                      key={index}
                      className="w-32 h-32 lg:w-48 lg:h-48 p-3 bg-white relative"
                      style={{ 
                        transform: `rotate(${photoRotations[index] || 0}deg)`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 0 0 12px white, 0 0 0 14px rgba(248,200,220,0.2)'
                      }}
                    >
                      <img src={photo} alt={`Memoria ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setPhotos(prev => prev.filter((_, i) => i !== index));
                          setPhotoRotations(prev => prev.filter((_, i) => i !== index));
                        }} 
                        className="absolute -top-3 -right-3 bg-red-400 text-white p-2 rounded-full shadow-lg z-10"
                      >
                        {getIcon('trash', 'w-4 h-4')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={() => fileInputRef.current?.click()} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-inter text-[10px] font-black uppercase tracking-widest border transition-all ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)] hover:text-[#E0E1DD]' 
                    : 'bg-white text-[#8B5E75] border-[#F8C8DC] hover:bg-[#FFF0F5]'
                }`}>
                  {getIcon('camera', 'w-4 h-4')} <span className="hidden lg:inline">Imagen</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
                <button onClick={() => setIsLocked(!isLocked)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-inter text-[10px] font-black uppercase tracking-widest border transition-all ${
                  isLocked 
                    ? isNightMode
                      ? 'bg-[rgba(48,43,79,0.8)] text-[#A68A56] border-[#A68A56]'
                      : 'bg-[#4A233E] text-[#D4AF37] border-[#4A233E]'
                    : isNightMode
                      ? 'bg-[rgba(48,43,79,0.6)] text-[#7A748E] border-[#A68A56]/40 hover:bg-[rgba(48,43,79,0.8)] hover:text-[#E0E1DD]'
                      : 'bg-white text-[#8B5E75] border-[#F8C8DC] hover:bg-[#FFF0F5]'
                }`}>
                  {getIcon(isLocked ? 'lock' : 'unlock', 'w-4 h-4')} <span className="hidden lg:inline">{isLocked ? 'Cierre Activo' : 'Biometría'}</span>
                </button>
              </div>
              <SealButton onClick={handleSave} size="md" className="w-full lg:w-auto" disabled={isSaving} />
            </div>
          </div>
        </div>

        {/* History Area - Persists on Tablet */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col overflow-hidden h-[400px] md:h-full">
          <div className={`flex-1 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-6 flex flex-col shadow-xl overflow-hidden transition-colors duration-500 ${
            isNightMode 
              ? 'bg-[rgba(48,43,79,0.6)] border-2 border-[#A68A56]/40 shadow-[0_0_30px_rgba(199,125,255,0.2)]' 
              : 'glass-card border-[#D4AF37]/20 bg-white/40'
          }`} style={isNightMode ? {} : { backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
            <h3 className={`font-marcellus text-2xl lg:text-2xl mb-4 lg:mb-5 uppercase tracking-widest font-bold border-b pb-3 flex-shrink-0 transition-colors duration-500 ${
              isNightMode 
                ? 'text-[#E0E1DD] border-[#A68A56]/40' 
                : 'text-[#2D1A26] border-[#D4AF37]/30'
            }`}>Historias Pasadas</h3>
            
            {/* Buscador Desktop */}
            <div className={`mb-4 backdrop-blur-sm rounded-xl p-2 border shadow-sm flex-shrink-0 transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                : 'bg-white/90 border-[#D4AF37]/20'
            }`}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en el cuaderno..."
                  className={`w-full bg-transparent px-3 py-2 pr-8 text-sm font-garamond focus:outline-none border rounded-lg transition-colors duration-500 ${
                    isNightMode 
                      ? 'text-[#E0E1DD] placeholder:text-[#7A748E]/50 border-[#A68A56]/40' 
                      : 'text-[#2D1A26] placeholder:text-[#8B5E75]/50 border-[#F8C8DC]'
                  }`}
                />
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]/50' : 'text-[#8B5E75]/50'
                }`}>
                  {getIcon('search', 'w-3 h-3') || (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
              </div>
              {searchQuery && (
                <p className={`text-[10px] mt-1 px-1 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'encontrada' : 'encontradas'}
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-base font-garamond italic transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>No se encontraron entradas que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                const mood = MOODS.find(m => m.type === entry.mood);
                const entryPhotoRotation = getEntryPhotoRotation(entry.id);
                return (
                  <div 
                    key={entry.id}
                    onClick={() => handleViewEntry(entry)}
                    className={`border-2 p-4 group transition-all relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 hover:border-[#A68A56]/60' 
                        : 'bg-white/80 border-[#F8C8DC] hover:border-[#D4AF37]/40'
                    }`}
                    style={{
                      borderImage: isNightMode 
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(166,138,86,0.3) 6px, rgba(166,138,86,0.3) 12px) 1'
                        : 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(212,175,55,0.2) 6px, rgba(212,175,55,0.2) 12px) 1',
                      borderStyle: 'solid',
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                    }}
                  >
                    {entry.isLocked && <div className={`absolute inset-0 backdrop-blur-[4px] z-10 flex items-center justify-center shadow-inner pointer-events-none transition-colors duration-500 ${
                      isNightMode 
                        ? 'bg-[rgba(166,138,86,0.2)] text-[#A68A56]' 
                        : 'bg-[#4A233E]/10 text-[#D4AF37]'
                    }`}>{getIcon('lock', 'w-8 h-8')}</div>}
                    <div className="flex justify-between items-start mb-3 relative z-20">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl border shadow-inner transition-colors duration-500 ${
                           isNightMode 
                             ? 'border-[#A68A56]/40 bg-[rgba(199,125,255,0.2)]' 
                             : 'border-[#F8C8DC]'
                         }`} style={isNightMode ? {} : { backgroundColor: `${mood?.color}15`, color: mood?.color }}>
                           {mood && <MoodIcon type={mood.type} className="w-4 h-4" />}
                         </div>
                         <div>
                            <p className={`text-[10px] font-serif font-bold italic transition-colors duration-500 ${
                              isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                            }`} style={{ fontFamily: 'Georgia, serif' }}>
                              {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className={`text-[8px] uppercase font-black tracking-widest opacity-60 transition-colors duration-500 ${
                              isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                            }`}>{entry.mood}</p>
                         </div>
                      </div>
                      <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(entry);
                          }} 
                          className={`px-2 py-1 rounded text-[9px] font-cinzel font-black uppercase tracking-wider shadow-md transition-colors relative z-30 ${
                            isNightMode 
                              ? 'bg-[#C77DFF] text-white hover:bg-[#B56DFF]' 
                              : 'bg-[#D4AF37] text-white hover:bg-[#C49F2F]'
                          }`}
                        >
                          EDITAR
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(entry.id, e);
                          }} 
                          className={`transition-colors p-2 relative z-30 ${
                            isNightMode 
                              ? 'text-[#7A748E]/40 hover:text-red-400' 
                              : 'text-[#8B5E75]/40 hover:text-red-500'
                          }`}
                        >
                          {getIcon('trash', 'w-3 h-3')}
                        </button>
                      </div>
                    </div>
                    {entry.isLocked && securityModuleActive ? (
                      <div className="text-center py-2">
                        <div className={`inline-flex items-center gap-2 font-garamond italic text-sm transition-colors duration-500 ${
                          isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                        }`}>
                          {getIcon('lock', 'w-4 h-4')}
                          <span>Contenido protegido</span>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-base lg:text-base font-garamond italic line-clamp-3 leading-relaxed opacity-80 transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#2D1A26]'
                      }`}>{entry.content}</p>
                    )}
                    {(() => {
                      // Obtener todas las fotos disponibles
                      const allPhotos = entry.photos || (entry.photo ? [entry.photo] : []);
                      // Filtrar solo valores válidos
                      const validPhotos = allPhotos.filter((photo: any) => {
                        if (!photo) return false;
                        if (typeof photo !== 'string') return false;
                        return photo.trim() !== '';
                      });
                      
                      if (validPhotos.length === 0) return null;
                      
                      return (
                        <div className="mt-3 flex flex-wrap gap-2 justify-center">
                          {validPhotos.map((photo: string, index: number) => (
                            <div 
                              key={`${entry.id}-desktop-photo-${index}`}
                              className={`w-24 h-24 lg:w-32 lg:h-32 p-2 transition-colors duration-500 ${
                                isNightMode ? 'bg-[rgba(48,43,79,0.8)]' : 'bg-white'
                              }`}
                              style={{ 
                                transform: `rotate(${getEntryPhotoRotation(entry.id + index)}deg)`,
                                boxShadow: isNightMode 
                                  ? '0 4px 12px rgba(0,0,0,0.4), 0 0 0 6px rgba(48,43,79,0.8), 0 0 0 8px rgba(166,138,86,0.3)'
                                  : '0 4px 12px rgba(0,0,0,0.15), 0 0 0 6px white, 0 0 0 8px rgba(248,200,220,0.3)'
                              }}
                            >
                              <img 
                                src={photo} 
                                alt={`Memoria ${index + 1}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Error cargando imagen en desktop:', photo, 'Entry ID:', entry.id);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Imagen cargada en desktop:', photo.substring(0, 50) + '...');
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Entrada Completa - Desktop */}
      {selectedEntry && (
        <EntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}

      {/* Modal de Confirmación de Borrado - Desktop */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-cinzel text-2xl lg:text-2xl text-[#2D1A26] mb-4">Confirmar Eliminación</h3>
            <p className="font-garamond text-[#8B5E75] mb-6">
              ¿Estás seguro de que deseas eliminar esta entrada? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest border-2 border-[#F8C8DC] text-[#8B5E75] hover:bg-[#FFF0F5] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="px-6 py-3 rounded-xl font-cinzel text-base font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de PIN - Desktop */}
      {showPinModal && (
        <PinInputModal
          onVerify={handleVerifyPin}
          onCancel={() => {
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
            setPendingEntryToView(null);
          }}
          pinInput={pinInput}
          setPinInput={setPinInput}
          pinError={pinError}
          setPinError={setPinError}
        />
      )}
    </div>
  );
};

// Componente Modal de PIN con auto-focus
const PinInputModal: React.FC<{
  onVerify: (pin?: string) => void;
  onCancel: () => void;
  pinInput: string;
  setPinInput: (pin: string) => void;
  pinError: string;
  setPinError: (error: string) => void;
}> = ({ onVerify, onCancel, pinInput, setPinInput, pinError, setPinError }) => {
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Auto-focus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (pinRefs[0].current) {
      pinRefs[0].current.focus();
    }
  }, []);

  const handlePinChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 1) return; // Solo un dígito por campo

    const currentPinArray = pinInput.split('');
    currentPinArray[index] = numericValue;
    const updatedPin = currentPinArray.join('').slice(0, 4);
    setPinInput(updatedPin);
    setPinError('');

    // Auto-focus al siguiente campo si hay un valor
    if (numericValue && index < 3 && pinRefs[index + 1].current) {
      setTimeout(() => {
        pinRefs[index + 1].current?.focus();
      }, 10);
    }

    // Si se completaron los 4 dígitos, verificar automáticamente
    // Pasar el PIN actualizado directamente para evitar problemas de sincronización de estado
    if (updatedPin.length === 4) {
      setTimeout(() => {
        // Verificar que el PIN tenga exactamente 4 dígitos antes de verificar
        if (updatedPin.length === 4 && /^\d{4}$/.test(updatedPin)) {
          onVerify(updatedPin);
        }
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
      // Si el campo está vacío y presionas backspace, ir al anterior
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleNumberClick = (num: string) => {
    const currentIndex = pinInput.length;
    if (currentIndex < 4) {
      handlePinChange(currentIndex, num);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4A233E]/10 flex items-center justify-center">
            {getIcon('lock', 'w-8 h-8 text-[#D4AF37]')}
          </div>
          <h3 className="font-cinzel text-2xl lg:text-2xl text-[#2D1A26] mb-2">Entrada Protegida</h3>
          <p className="font-garamond text-[#8B5E75] text-base">
            Ingresa tu PIN de 4 dígitos para acceder
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={pinRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={pinInput[index] || ''}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 text-center text-2xl font-cinzel font-black transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${
                  pinInput.length > index
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#2D1A26]'
                    : 'border-[#F8C8DC] bg-white/40 text-[#8B5E75]/30'
                }`}
              />
            ))}
          </div>
          {pinError && (
            <p className="text-red-500 text-base text-center mt-4 font-garamond">{pinError}</p>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#2D1A26] font-cinzel text-2xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-base font-black hover:bg-[#FFF0F5] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="py-4 rounded-xl bg-white border-2 border-[#F8C8DC] text-[#2D1A26] font-cinzel text-2xl font-black hover:bg-[#FFF0F5] hover:border-[#D4AF37] transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={() => {
              setPinInput(pinInput.slice(0, -1));
              setPinError('');
              const lastIndex = Math.max(0, pinInput.length - 1);
              pinRefs[lastIndex].current?.focus();
            }}
            className="py-4 rounded-xl bg-white/40 border-2 border-[#F8C8DC] text-[#8B5E75] font-cinzel text-base font-black hover:bg-[#FFF0F5] transition-all"
          >
            ←
          </button>
        </div>

      </div>
    </div>
  );
};

export default DiaryModule;
