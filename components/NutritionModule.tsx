import React, { useState, useEffect, useRef } from 'react';
import { NutritionEntry, NutritionGoals, DailyNutritionSummary, FoodItem, EnergyCurve } from '../types';
import { getIcon } from '../constants';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';
import { calculateEnergyCurve } from '../utils/energyCurve';
import { classifyBrainFood } from '../utils/brainFoodClassifier';
import MacroRing from './nutrition/MacroRing';
import EnergyCurveChart from './nutrition/EnergyCurveChart';
import FoodConfirmationCard from './nutrition/FoodConfirmationCard';
import NutritionHistoryItem from './nutrition/NutritionHistoryItem';
import CorrelationInsights from './nutrition/CorrelationInsights';

interface NutritionModuleProps {
  userId?: string;
  isMobile: boolean;
  isNightMode?: boolean;
  onNavigateToBazar?: () => void;
}

const NutritionModule: React.FC<NutritionModuleProps> = ({
  userId,
  isMobile,
  isNightMode = false,
  onNavigateToBazar,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFoods, setPendingFoods] = useState<FoodItem[]>([]);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [energyCurves, setEnergyCurves] = useState<EnergyCurve[]>([]);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [correlations, setCorrelations] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data
  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId, selectedDate]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Cargar datos con manejo individual de errores
      let entriesData: NutritionEntry[] = [];
      let goalsData: NutritionGoals | null = null;
      let correlationsData: any[] = [];

      try {
        entriesData = await supabaseService.getNutritionEntries(userId, selectedDate);
      } catch (error) {
        console.warn('Error loading nutrition entries:', error);
        entriesData = [];
      }

      try {
        goalsData = await supabaseService.getNutritionGoals(userId);
      } catch (error) {
        console.warn('Error loading nutrition goals:', error);
        goalsData = null;
      }

      try {
        correlationsData = await supabaseService.getNutritionCorrelations(userId, 10);
      } catch (error) {
        console.warn('Error loading nutrition correlations:', error);
        correlationsData = [];
      }
      
      setCorrelations(correlationsData);
      
      setEntries(entriesData);
      setGoals(goalsData || {
        id: '',
        user_id: userId,
        daily_calories: 2000,
        protein_grams: 150,
        carbs_grams: 250,
        fats_grams: 65,
        activity_level: 'moderate',
        updated_at: new Date().toISOString(),
      });

      // Calculate summary
      const totalCalories = entriesData.reduce((sum, e) => sum + e.total_calories, 0);
      const totalProtein = entriesData.reduce((sum, e) => sum + e.total_protein, 0);
      const totalCarbs = entriesData.reduce((sum, e) => sum + e.total_carbs, 0);
      const totalFats = entriesData.reduce((sum, e) => sum + e.total_fats, 0);
      
      const goalCalories = goalsData?.daily_calories || 2000;
      const goalProtein = goalsData?.protein_grams || 150;
      const goalCarbs = goalsData?.carbs_grams || 250;
      const goalFats = goalsData?.fats_grams || 65;

      setSummary({
        date: selectedDate,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fats: totalFats,
        entries: entriesData,
        goal_calories: goalCalories,
        goal_protein: goalProtein,
        goal_carbs: goalCarbs,
        goal_fats: goalFats,
        progress_percentage: {
          calories: (totalCalories / goalCalories) * 100,
          protein: (totalProtein / goalProtein) * 100,
          carbs: (totalCarbs / goalCarbs) * 100,
          fats: (totalFats / goalFats) * 100,
        },
      });

      // Calculate energy curves from latest entry
      if (entriesData.length > 0) {
        const latestEntry = entriesData[0];
        const curves = calculateEnergyCurve(latestEntry);
        setEnergyCurves(curves);
      } else {
        setEnergyCurves([]);
      }
    } catch (error: any) {
      console.error('Error loading nutrition data:', error);
      // Si es un error de tabla no encontrada, usar valores por defecto
      if (error?.message?.includes('Could not find the table') || error?.code === 'PGRST205' || error?.status === 406) {
        // Las tablas no existen aún, usar valores por defecto
        setEntries([]);
        setGoals({
          id: '',
          user_id: userId || '',
          daily_calories: 2000,
          protein_grams: 150,
          carbs_grams: 250,
          fats_grams: 65,
          activity_level: 'moderate',
          updated_at: new Date().toISOString(),
        });
        setCorrelations([]);
        setSummary({
          date: selectedDate,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fats: 0,
          entries: [],
          goal_calories: 2000,
          goal_protein: 150,
          goal_carbs: 250,
          goal_fats: 65,
          progress_percentage: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
          },
        });
        setEnergyCurves([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim() || !userId) return;
    
    setAnalyzing(true);
    try {
      const analysis = await geminiService.analyzeNutritionText(inputText);
      
      // Classify brain food tags
      const brainTags = classifyBrainFood(analysis.foods);
      analysis.brain_food_tags = brainTags;
      
      setPendingFoods(analysis.foods);
      setPendingPhoto(null);
      setShowConfirmation(true);
      
      // Check for alert
      if (analysis.estimated_glucose_impact === 'spike' || analysis.total_carbs > 80) {
        setAlertMessage('Este almuerzo podría darte sueño en 30 min. Programá tareas mecánicas (organizar carpetas) en lugar de estudio intenso ahora.');
      }
    } catch (error: any) {
      console.error('Error analyzing text:', error);
      alert('Error al analizar el texto. Por favor, intenta nuevamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    setPendingPhotoFile(file);
    setAnalyzing(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        setPendingPhoto(base64);
        
        const analysis = await geminiService.analyzeNutritionPhoto(base64);
        
        // Validar que la respuesta tenga la estructura esperada
        if (!analysis || !analysis.foods || !Array.isArray(analysis.foods)) {
          throw new Error('La respuesta de la IA no tiene el formato esperado');
        }
        
        // Classify brain food tags
        const brainTags = classifyBrainFood(analysis.foods);
        analysis.brain_food_tags = brainTags;
        
        setPendingFoods(analysis.foods);
        setShowConfirmation(true);
        
        // Check for alert
        if (analysis.estimated_glucose_impact === 'spike' || analysis.total_carbs > 80) {
          setAlertMessage('Este almuerzo podría darte sueño en 30 min. Programá tareas mecánicas en lugar de estudio intenso ahora.');
        }
      } catch (error: any) {
        console.error('Error analyzing photo:', error);
        const errorMessage = error?.message || 'Error desconocido';
        if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          alert('Error en el servidor de IA. Por favor, verifica que el endpoint esté configurado correctamente.');
        } else {
          alert(`Error al analizar la foto: ${errorMessage}. Por favor, intenta nuevamente.`);
        }
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmEntry = async (foods: FoodItem[]) => {
    if (!userId) return;

    const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
    const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
    const totalFats = foods.reduce((sum, f) => sum + f.fats, 0);

    // Estimate glucose impact
    let glucoseImpact: 'low' | 'medium' | 'high' | 'spike' = 'medium';
    if (totalCarbs > 80 && totalCarbs > totalProtein * 2) {
      glucoseImpact = 'spike';
    } else if (totalCarbs > 50) {
      glucoseImpact = 'high';
    } else if (totalCarbs < 20) {
      glucoseImpact = 'low';
    }

    // Estimate energy score (1-10)
    let energyScore = 5;
    if (totalProtein > 30 && totalCarbs < 50) {
      energyScore = 8;
    } else if (totalCarbs > 80) {
      energyScore = 4;
    } else if (totalProtein > 20 && totalCarbs > 30 && totalCarbs < 60) {
      energyScore = 7;
    }

    const brainTags = classifyBrainFood(foods);

    try {
      let photoUrl: string | undefined;
      
      // Upload photo if exists
      if (pendingPhotoFile) {
        const tempEntryId = `temp-${Date.now()}`;
        photoUrl = await supabaseService.uploadNutritionPhoto(userId, tempEntryId, pendingPhotoFile);
      }

      const now = new Date();
      const entry = await supabaseService.createNutritionEntry(userId, {
        date: selectedDate,
        time: now.toTimeString().substring(0, 5),
        input_type: pendingPhoto ? 'photo' : 'text',
        input_text: pendingPhoto ? undefined : inputText,
        photo_url: photoUrl,
        foods,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fats: totalFats,
        estimated_glucose_impact: glucoseImpact,
        energy_score: energyScore,
        brain_food_tags: brainTags,
      });

      // Reset state
      setInputText('');
      setPendingFoods([]);
      setPendingPhoto(null);
      setPendingPhotoFile(null);
      setShowConfirmation(false);
      setAlertMessage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Error al guardar la entrada. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('¿Estás segura de que quieres eliminar esta entrada?')) return;
    
    try {
      await supabaseService.deleteNutritionEntry(entryId);
      await loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error al eliminar la entrada.');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="text-center">
          {getIcon('apple', 'w-12 h-12 mx-auto mb-4 animate-pulse')}
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
              Nutrición & Macros
            </h1>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${isNightMode ? 'bg-[#16213E] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
          <div className="flex gap-2">
            {onNavigateToBazar && (
              <button
                onClick={onNavigateToBazar}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${isNightMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
              >
                {getIcon('bazar', 'w-4 h-4')}
                <span>Bazar</span>
              </button>
            )}
            <button
              onClick={() => setShowGoalsModal(true)}
              className={`px-4 py-2 rounded-lg font-medium ${isNightMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
            >
              Objetivos
            </button>
          </div>
        </div>

        {/* Calorie summary */}
        {summary && (
          <div className={`p-4 rounded-lg ${isNightMode ? 'bg-[#16213E]' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Calorías del día</span>
              <span className={`text-2xl font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(summary.total_calories)} / {summary.goal_calories}
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E35B8F] transition-all duration-500"
                style={{ width: `${Math.min(100, summary.progress_percentage.calories)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Alert */}
      {alertMessage && (
        <div className={`mb-4 p-4 rounded-lg ${isNightMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className={`text-sm ${isNightMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            {alertMessage}
          </p>
          <button
            onClick={() => setAlertMessage(null)}
            className="mt-2 text-xs underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className={`mb-6 p-4 rounded-lg ${isNightMode ? 'bg-[#16213E]' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-3 ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
          Registro Rápido
        </h2>
        
        <div className="flex gap-3 mb-3">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ej: Un café con leche, una tostada con palta y dos huevos"
            className={`flex-1 px-4 py-3 rounded-lg border resize-none ${isNightMode ? 'bg-[#0F1624] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleTextSubmit();
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${isNightMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} disabled:opacity-50`}
            aria-label="Subir foto"
          >
            {getIcon('camera', 'w-5 h-5')}
          </button>
        </div>

        <button
          onClick={handleTextSubmit}
          disabled={!inputText.trim() || analyzing}
          className="w-full px-4 py-3 rounded-lg font-medium bg-[#E35B8F] text-white hover:bg-[#D14A7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? 'Analizando...' : 'Analizar con IA'}
        </button>
      </div>

      {/* Macros Dashboard */}
      {summary && (
        <div className={`mb-6 p-4 rounded-lg ${isNightMode ? 'bg-[#16213E]' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
            Macros del Día
          </h2>
          {isMobile ? (
            // Mobile: Horizontal bars
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Proteínas</span>
                  <span className="text-sm">{Math.round(summary.total_protein)}/{summary.goal_protein}g</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.progress_percentage.protein)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Carbohidratos</span>
                  <span className="text-sm">{Math.round(summary.total_carbs)}/{summary.goal_carbs}g</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.progress_percentage.carbs)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Grasas</span>
                  <span className="text-sm">{Math.round(summary.total_fats)}/{summary.goal_fats}g</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.progress_percentage.fats)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Desktop: Rings
            <div className="flex justify-center gap-8">
              <MacroRing
                value={summary.total_protein}
                goal={summary.goal_protein}
                label="Proteínas"
                color="#3b82f6"
              />
              <MacroRing
                value={summary.total_carbs}
                goal={summary.goal_carbs}
                label="Carbohidratos"
                color="#f97316"
              />
              <MacroRing
                value={summary.total_fats}
                goal={summary.goal_fats}
                label="Grasas"
                color="#eab308"
              />
            </div>
          )}
        </div>
      )}

      {/* Energy Curve */}
      {energyCurves.length > 0 && (
        <div className="mb-6">
          <EnergyCurveChart curves={energyCurves} isNightMode={isNightMode} />
        </div>
      )}

      {/* History */}
      <div className={`mb-6 ${isNightMode ? 'bg-[#16213E]' : 'bg-white'} rounded-lg p-4`}>
        <h2 className={`text-lg font-semibold mb-4 ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
          Historial
        </h2>
        {entries.length === 0 ? (
          <p className={`text-sm ${isNightMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No hay registros para este día. ¡Agrega tu primera comida!
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <NutritionHistoryItem
                key={entry.id}
                entry={entry}
                onDelete={handleDeleteEntry}
                isNightMode={isNightMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <FoodConfirmationCard
          foods={pendingFoods}
          onConfirm={handleConfirmEntry}
          onCancel={() => {
            setShowConfirmation(false);
            setPendingFoods([]);
            setPendingPhoto(null);
            setPendingPhotoFile(null);
          }}
          isNightMode={isNightMode}
        />
      )}

      {/* Correlations Section */}
      {correlations.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg ${isNightMode ? 'bg-[#16213E]' : 'bg-white'}`}>
          <CorrelationInsights correlations={correlations} isNightMode={isNightMode} />
        </div>
      )}

      {/* Goals Modal - Simplified for now */}
      {showGoalsModal && goals && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isNightMode ? 'bg-black/70' : 'bg-black/50'}`}>
          <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 ${isNightMode ? 'bg-[#1A1A2E]' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
              Objetivos Nutricionales
            </h2>
            <p className={`text-sm mb-4 ${isNightMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Los objetivos se pueden configurar desde el perfil. Por ahora, usa los valores por defecto.
            </p>
            <button
              onClick={() => setShowGoalsModal(false)}
              className="w-full px-4 py-2 rounded-lg font-medium bg-[#E35B8F] text-white hover:bg-[#D14A7A]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionModule;
