import React, { useState, useEffect, useMemo } from 'react';
import { BalanzaProTransaction, RecurringConfig } from '../types';
import { getIcon } from '../constants';
import { supabaseService } from '../services/supabaseService';
import { recurringTransactionsService } from '../services/recurringTransactionsService';
import { exportToCSV, exportToExcel, formatFilename } from '../utils/exportUtils';
import { formatCurrency } from '../utils/currencyFormatter';

interface BalanzaModuleProps {
  userId: string;
  isMobile: boolean;
  isNightMode?: boolean;
}

type ViewTab = 'movements' | 'payment_method' | 'classification';
type TimeFilter = 'week' | 'month' | 'year' | 'custom';

const DEFAULT_PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Teléfono', 'Cripto'];

// Categorías para Ingresos
const INCOME_CATEGORIES = ['Sueldo', 'Venta', 'Mesada', 'Becas / Ayudas', 'Regalos', 'Freelance'];

// Categorías para Gastos
const EXPENSE_CATEGORIES = ['Estudios', 'Servicios', 'Comida', 'Transporte', 'Cuidado Personal', 'Ocio'];

// Mapeo de colores consistente por categoría
const getCategoryColor = (category: string, isNightMode: boolean, viewMode: 'ingresos' | 'egresos' | 'total'): string => {
  // Colores para Ingresos
  const incomeColors: Record<string, { light: string; dark: string }> = {
    'Sueldo': { light: '#D4AF37', dark: '#A68A56' },
    'Ventas': { light: '#E35B8F', dark: '#C77DFF' },
    'Mesada': { light: '#8B5E75', dark: '#7A748E' },
    'Becas': { light: '#F8C8DC', dark: '#A68A56' },
    'Regalos': { light: '#D4AF37', dark: '#C77DFF' },
    'Reintegros': { light: '#E35B8F', dark: '#E35B8F' },
    'Otros': { light: '#8B5E75', dark: '#7A748E' },
  };

  // Colores para Egresos
  const expenseColors: Record<string, { light: string; dark: string }> = {
    'Comida': { light: '#E35B8F', dark: '#C77DFF' },
    'Transporte': { light: '#8B5E75', dark: '#7A748E' },
    'Facultad': { light: '#D4AF37', dark: '#A68A56' },
    'Hogar': { light: '#F8C8DC', dark: '#C77DFF' },
    'Entretenimiento': { light: '#E35B8F', dark: '#E35B8F' },
    'Salud': { light: '#8B5E75', dark: '#7A748E' },
    'Otros': { light: '#D4AF37', dark: '#A68A56' },
  };

  // Colores para Total (Ingresos vs Egresos)
  if (viewMode === 'total') {
    if (category === 'Ingresos') {
      return isNightMode ? '#A68A56' : '#D4AF37';
    } else if (category === 'Egresos') {
      return isNightMode ? '#C77DFF' : '#E35B8F';
    }
  }

  // Colores por categoría según el modo
  if (viewMode === 'ingresos') {
    const colorMap = incomeColors[category] || incomeColors['Otros'];
    return isNightMode ? colorMap.dark : colorMap.light;
  } else {
    const colorMap = expenseColors[category] || expenseColors['Otros'];
    return isNightMode ? colorMap.dark : colorMap.light;
  }
};

// Helper para obtener icono de método de pago
const getPaymentMethodIcon = (method: string) => {
  const icons: Record<string, React.ReactElement> = {
    'Efectivo': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    'Tarjeta': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    'Teléfono': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    'Cripto': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[method] || icons['Efectivo'];
};

// Componente de Gráfico Donut
const DonutChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  isNightMode?: boolean;
  viewMode?: 'ingresos' | 'egresos' | 'total';
  balance?: number;
  totalIngresos?: number;
  totalEgresos?: number;
  showLegend?: boolean;
  currency?: string;
}> = ({ data, size = 200, isNightMode = false, viewMode = 'total', balance = 0, totalIngresos = 0, totalEgresos = 0, showLegend = true, currency = 'EUR' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 25;
  const circumference = 2 * Math.PI * radius;
  
  // Normalizar datos y calcular offsets acumulativos
  const normalizedData = useMemo(() => {
    if (total === 0 || data.length === 0) return [];
    
    const calculatedTotal = data.reduce((sum, item) => sum + item.value, 0);
    let accumulatedOffset = 0;
    
    return data.map((item, index) => {
      const percentage = calculatedTotal > 0 ? (item.value / calculatedTotal) * 100 : 0;
      const segmentLength = (percentage / 100) * circumference;
      const startOffset = accumulatedOffset;
      
      accumulatedOffset += segmentLength;
      
      return {
        ...item,
        normalizedValue: item.value,
        percentage,
        segmentLength,
        startOffset,
        endOffset: accumulatedOffset,
      };
    });
  }, [data, total, circumference]);
  
  if (total === 0 || data.length === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <svg width={size} height={size} className="transform -rotate-90" style={{ display: 'block' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isNightMode ? 'rgba(166, 138, 86, 0.3)' : 'rgba(212, 175, 55, 0.25)'}
            strokeWidth="24"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className={`text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70 transition-colors duration-500 ${
              isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
            }`}>Aún sin registros</p>
          </div>
        </div>
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<SVGElement>, index: number) => {
    const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (!rect) return;
    
    const item = normalizedData[index];
    if (!item) return;
    
    // Calcular el ángulo medio del segmento
    const midOffset = item.startOffset + (item.segmentLength / 2);
    const midAngle = (midOffset / circumference) * 360 - 90;
    const midAngleRad = (midAngle * Math.PI) / 180;
    
    // Posicionar el tooltip fuera del círculo
    const tooltipDistance = radius + 50;
    const x = size / 2 + tooltipDistance * Math.cos(midAngleRad);
    const y = size / 2 + tooltipDistance * Math.sin(midAngleRad);
    
    setTooltipPosition({ x, y });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Gráfico Donut */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90" 
          style={{ display: 'block' }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isNightMode ? 'rgba(122, 116, 142, 0.15)' : 'rgba(139, 94, 117, 0.1)'}
            strokeWidth="24"
          />
          
          <defs>
            {normalizedData.map((item, index) => (
              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.9" />
              </linearGradient>
            ))}
          </defs>
          
          {normalizedData.map((item, index) => {
            const strokeDasharray = `${item.segmentLength} ${circumference}`;
            const strokeDashoffset = circumference - item.startOffset;

            return (
              <g key={index}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: hoveredIndex === null ? 1 : hoveredIndex === index ? 1 : 0.3,
                    strokeWidth: hoveredIndex === index ? '28' : '24',
                    filter: hoveredIndex === index ? 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' : 'none',
                  }}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Contenido central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {hoveredIndex !== null && normalizedData[hoveredIndex] ? (
              <>
                <p className={`text-[10px] md:text-xs uppercase font-black tracking-widest transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>{normalizedData[hoveredIndex]?.label}</p>
                <p className={`font-marcellus text-lg md:text-xl font-black transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>
                  {normalizedData[hoveredIndex]?.percentage.toFixed(1)}%
                </p>
              </>
            ) : viewMode === 'total' ? (
              <>
                <p className={`text-[10px] uppercase font-black tracking-widest opacity-60 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Balance</p>
                <p className={`font-marcellus text-xl md:text-2xl font-black transition-colors duration-500 ${
                  balance < 0 
                    ? 'text-red-500' 
                    : isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>
                  {formatCurrency(balance, currency)}
                </p>
              </>
            ) : viewMode === 'ingresos' ? (
              <>
                <p className={`text-[10px] uppercase font-black tracking-widest opacity-60 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Ingresos</p>
                <p className={`font-marcellus text-xl md:text-2xl font-black transition-colors duration-500 ${
                  isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                }`}>
                  {formatCurrency(totalIngresos, currency)}
                </p>
              </>
            ) : (
              <>
                <p className={`text-[10px] uppercase font-black tracking-widest opacity-60 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Egresos</p>
                <p className={`font-marcellus text-xl md:text-2xl font-black transition-colors duration-500 ${
                  isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                }`}>
                  {formatCurrency(totalEgresos, currency)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Tooltip flotante */}
        {hoveredIndex !== null && normalizedData[hoveredIndex] && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`px-3 py-2 rounded-lg border backdrop-blur-md shadow-xl ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.95)] border-[#A68A56]/60'
                : 'bg-white/95 border-[#F8C8DC]'
            }`}>
              <p className={`text-xs font-black uppercase tracking-wider transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>{normalizedData[hoveredIndex]?.label}</p>
              <p className={`text-sm font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                {formatCurrency(normalizedData[hoveredIndex]?.normalizedValue || 0, currency)}
              </p>
              <p className={`text-[10px] transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                {normalizedData[hoveredIndex]?.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda debajo del gráfico */}
      {showLegend && normalizedData.length > 0 && (
        <div className="w-full grid grid-cols-2 gap-3 px-4">
          {normalizedData.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-300 ${
                hoveredIndex === index
                  ? isNightMode
                    ? 'bg-[rgba(48,43,79,0.8)]'
                    : 'bg-white/80'
                  : isNightMode
                    ? 'bg-transparent'
                    : 'bg-transparent'
              }`}
              style={{
                opacity: hoveredIndex === null ? 1 : hoveredIndex === index ? 1 : 0.5,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 border-2"
                style={{ 
                  backgroundColor: item.color,
                  borderColor: isNightMode ? 'rgba(166, 138, 86, 0.3)' : 'rgba(248, 200, 220, 0.5)'
                }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black truncate transition-colors duration-500 ${
                  isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>{item.label}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-[10px] font-black transition-colors duration-500 ${
                    isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                  }`}>
                    {formatCurrency(item.normalizedValue, currency)}
                  </p>
                  <p className={`text-[10px] transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BalanzaModule: React.FC<BalanzaModuleProps> = ({ userId, isMobile, isNightMode = false }) => {
  const [transactions, setTransactions] = useState<BalanzaProTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>('EUR');
  const [transType, setTransType] = useState<'Ingreso' | 'Egreso'>('Egreso');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isExtra, setIsExtra] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'diaria' | 'semanal' | 'mensual' | 'anual'>('mensual');
  const [recurringStartDate, setRecurringStartDate] = useState('');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [status, setStatus] = useState<'Pendiente' | 'Completado'>('Completado');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewTab, setViewTab] = useState<ViewTab>('movements');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('custom');
  
  // Inicializar fechas por defecto: inicio del mes actual y hoy
  const getDefaultStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  };
  
  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const [customStartDate, setCustomStartDate] = useState(getDefaultStartDate());
  const [customEndDate, setCustomEndDate] = useState(getDefaultEndDate());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [modalType, setModalType] = useState<'Ingreso' | 'Egreso' | 'Recurrente'>('Egreso');
  const [editingTransaction, setEditingTransaction] = useState<BalanzaProTransaction | null>(null);

  // Cargar perfil del usuario para obtener la moneda
  useEffect(() => {
    const loadUserProfile = async () => {
      if (userId) {
        try {
          const profile = await supabaseService.getProfile(userId);
          if (profile?.currency) {
            setCurrency(profile.currency);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [userId]);

  // Cargar transacciones y verificar recurrentes al montar
  useEffect(() => {
    if (userId) {
      loadTransactions();
      checkRecurringTransactions();
      loadPaymentMethods();
      loadTags();
    }
  }, [userId]);

  // Verificar transacciones recurrentes periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        checkRecurringTransactions();
      }
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [userId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getBalanzaProTransactions(userId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRecurringTransactions = async () => {
    try {
      await recurringTransactionsService.checkAndCreateRecurringTransactions(userId);
      // Recargar transacciones después de crear recurrentes
      await loadTransactions();
    } catch (error) {
      console.error('Error checking recurring transactions:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await supabaseService.getBalanzaProPaymentMethods(userId);
      const allMethods = Array.from(new Set([...DEFAULT_PAYMENT_METHODS, ...methods]));
      setAvailablePaymentMethods(allMethods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagList = await supabaseService.getBalanzaProTags(userId);
      setAvailableTags(tagList);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleAddPaymentMethod = () => {
    if (newPaymentMethod.trim() && !availablePaymentMethods.includes(newPaymentMethod.trim())) {
      setAvailablePaymentMethods([...availablePaymentMethods, newPaymentMethod.trim()]);
      setPaymentMethod(newPaymentMethod.trim());
      setNewPaymentMethod('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentMethod || !date) return;

    try {
      const transactionData: any = {
        type: transType,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        is_extra: isExtra,
        is_recurring: isRecurring,
        tags: tags,
        status: status,
        description: description || undefined,
        date: date,
      };

      if (isRecurring) {
        transactionData.recurring_config = {
          frequency: recurringFrequency,
          start_date: recurringStartDate || date,
          end_date: recurringEndDate || undefined,
        };
        if (dueDate) {
          transactionData.due_date = dueDate;
        }
      } else if (dueDate) {
        transactionData.due_date = dueDate;
      }

      if (editingTransaction) {
        // Actualizar transacción existente
        await supabaseService.updateBalanzaProTransaction(userId, editingTransaction.id, transactionData);
      } else {
        // Crear nueva transacción
        await supabaseService.addBalanzaProTransaction(userId, transactionData);
      }
      
      // Reset form
      setAmount('');
      setDescription('');
      setTags([]);
      setIsExtra(false);
      setIsRecurring(false);
      setStatus('Completado');
      setDueDate('');
      setRecurringStartDate('');
      setRecurringEndDate('');
      setPaymentMethod('');
      setEditingTransaction(null);
      
      // Cerrar modal y recargar datos
      setShowTransactionModal(false);
      await loadTransactions();
      await loadPaymentMethods();
      await loadTags();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error al guardar transacción. Por favor, intenta nuevamente.');
    }
  };

  const handleEditTransaction = (transaction: BalanzaProTransaction) => {
    setEditingTransaction(transaction);
    setTransType(transaction.type);
    setAmount(transaction.amount.toString());
    setPaymentMethod(transaction.payment_method);
    setIsExtra(transaction.is_extra);
    setIsRecurring(transaction.is_recurring);
    setTags(transaction.tags || []);
    setStatus(transaction.status);
    setDescription(transaction.description || '');
    setDate(transaction.date);
    setDueDate(transaction.due_date || '');
    
    if (transaction.is_recurring && transaction.recurring_config) {
      setRecurringFrequency(transaction.recurring_config.frequency || 'mensual');
      setRecurringStartDate(transaction.recurring_config.start_date || transaction.date);
      setRecurringEndDate(transaction.recurring_config.end_date || '');
    } else {
      setRecurringFrequency('mensual');
      setRecurringStartDate('');
      setRecurringEndDate('');
    }
    
    setModalType(transaction.is_recurring ? 'Recurrente' : transaction.type);
    setShowTransactionModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás segura de que deseas eliminar esta transacción?')) return;
    
    try {
      await supabaseService.deleteBalanzaProTransaction(userId, id);
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error al eliminar transacción.');
    }
  };

  // Filtrar transacciones según el filtro de tiempo
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (timeFilter) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0); // Inicio del día
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Fin del día
        } else {
          // Si no hay fechas custom, usar mes actual por defecto
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date();
        }
        break;
      default:
        return filtered;
    }

    return filtered.filter(t => {
      const transDate = new Date(t.date);
      transDate.setHours(0, 0, 0, 0);
      return transDate >= startDate && transDate <= endDate;
    });
  }, [transactions, timeFilter, customStartDate, customEndDate]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const ingresos = filteredTransactions.filter(t => t.type === 'Ingreso').reduce((acc, t) => acc + t.amount, 0);
    const egresos = filteredTransactions.filter(t => t.type === 'Egreso').reduce((acc, t) => acc + t.amount, 0);
    const gastosFijos = filteredTransactions.filter(t => t.type === 'Egreso' && t.is_recurring).reduce((acc, t) => acc + t.amount, 0);
    const gastosExtra = filteredTransactions.filter(t => t.type === 'Egreso' && t.is_extra).reduce((acc, t) => acc + t.amount, 0);
    const balance = ingresos - egresos;

    let status: 'saludable' | 'precario' | 'crítico' = 'saludable';
    if (balance < 0) {
      status = 'crítico';
    } else if (balance < ingresos * 0.2) {
      status = 'precario';
    }

    return {
      balance,
      ingresos,
      egresos,
      gastosFijos,
      gastosExtra,
      status,
    };
  }, [filteredTransactions]);

  // Agrupar por método de pago
  const transactionsByPaymentMethod = useMemo(() => {
    const grouped: Record<string, { transactions: BalanzaProTransaction[]; balance: number }> = {};
    
    filteredTransactions.forEach(t => {
      if (!grouped[t.payment_method]) {
        grouped[t.payment_method] = { transactions: [], balance: 0 };
      }
      grouped[t.payment_method].transactions.push(t);
      if (t.type === 'Ingreso') {
        grouped[t.payment_method].balance += t.amount;
      } else {
        grouped[t.payment_method].balance -= t.amount;
      }
    });

    return grouped;
  }, [filteredTransactions]);

  // Agrupar por clasificación
  const transactionsByClassification = useMemo(() => {
    const fixed: BalanzaProTransaction[] = [];
    const extra: BalanzaProTransaction[] = [];
    const ingresos: BalanzaProTransaction[] = [];
    const byTagIngresos: Record<string, BalanzaProTransaction[]> = {};
    const byTagEgresos: Record<string, BalanzaProTransaction[]> = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'Ingreso') {
        ingresos.push(t);
        t.tags.forEach(tag => {
          if (!byTagIngresos[tag]) {
            byTagIngresos[tag] = [];
          }
          byTagIngresos[tag].push(t);
        });
      } else if (t.type === 'Egreso') {
        if (t.is_recurring) {
          fixed.push(t);
        }
        if (t.is_extra) {
          extra.push(t);
        }
        t.tags.forEach(tag => {
          if (!byTagEgresos[tag]) {
            byTagEgresos[tag] = [];
          }
          byTagEgresos[tag].push(t);
        });
      }
    });

    return { fixed, extra, ingresos, byTagIngresos, byTagEgresos };
  }, [filteredTransactions]);

  const handleGenerateReport = () => {
    const start = reportStartDate || filteredTransactions[filteredTransactions.length - 1]?.date || new Date().toISOString().split('T')[0];
    const end = reportEndDate || filteredTransactions[0]?.date || new Date().toISOString().split('T')[0];
    setReportStartDate(start);
    setReportEndDate(end);
    setShowReportModal(true);
  };

  const handleExportCSV = () => {
    const reportData = filteredTransactions.filter(t => {
      const transDate = new Date(t.date);
      const start = new Date(reportStartDate);
      const end = new Date(reportEndDate);
      return transDate >= start && transDate <= end;
    });
    const filename = formatFilename('balanza_pro', reportStartDate, reportEndDate, 'csv');
    exportToCSV(reportData, filename);
  };

  const handleExportExcel = async () => {
    const reportData = filteredTransactions.filter(t => {
      const transDate = new Date(t.date);
      const start = new Date(reportStartDate);
      const end = new Date(reportEndDate);
      return transDate >= start && transDate <= end;
    });
    const filename = formatFilename('balanza_pro', reportStartDate, reportEndDate, 'xlsx');
    await exportToExcel(reportData, filename);
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-500 ${
        isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
      }`}>
        <div className={`font-marcellus text-lg transition-colors duration-500 ${
          isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
        }`}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-inter transition-colors duration-500 ${
      isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF0F5]'
    }`}>
      {/* Header */}
      <header className={`pt-2 pb-2 px-4 flex-shrink-0 backdrop-blur-md border-b transition-colors duration-500 ${
        isNightMode 
          ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/30' 
          : 'bg-[#FFF0F5]/80 border-[#F8C8DC]/30'
      }`}>
        <div className="max-w-7xl mx-auto w-full">
          <h1 className={`font-marcellus text-lg md:text-2xl font-black tracking-widest uppercase mb-1 transition-colors duration-500 ${
            isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
          }`}>Balanza</h1>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-6 max-w-7xl mx-auto w-full pt-3 overflow-y-auto flex flex-col gap-3">
        {/* Área Superior: Componente de Balance Maestro */}
        <section className={`p-4 md:p-6 rounded-2xl border-2 backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-[0_0_50px_rgba(199,125,255,0.3),0_20px_60px_rgba(0,0,0,0.3)]' 
            : 'glass-card border-[#F8C8DC]/60 bg-white/75 shadow-[0_0_50px_rgba(248,200,220,0.3),0_20px_60px_rgba(0,0,0,0.1)]'
        }`}>
          {/* Selector de Fechas con Glassmorphism y Atajos */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            {/* Cápsula de Cristal con Fechas */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-md transition-colors duration-500 ${
              isNightMode
                ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/40'
                : 'bg-white/60 border-[#F8C8DC]/60'
            }`}>
              <div className={`transition-colors duration-500 ${
                isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
              }`}>
                {getIcon('calendar', 'w-4 h-4')}
              </div>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={`bg-transparent border-none outline-none text-xs font-bold transition-colors duration-500 ${
                  isNightMode 
                    ? 'text-[#E0E1DD]' 
                    : 'text-[#4A233E]'
                }`}
                style={{ width: '110px' }}
              />
              <span className={`text-xs font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={`bg-transparent border-none outline-none text-xs font-bold transition-colors duration-500 ${
                  isNightMode 
                    ? 'text-[#E0E1DD]' 
                    : 'text-[#4A233E]'
                }`}
                style={{ width: '110px' }}
              />
            </div>
            
            {/* Atajos Rápidos */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - 7);
                  setCustomStartDate(start.toISOString().split('T')[0]);
                  setCustomEndDate(end.toISOString().split('T')[0]);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,0.8)]'
                    : 'bg-white/60 border border-[#F8C8DC]/60 text-[#4A233E] hover:bg-white/80'
                }`}
              >
                7d
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date(end.getFullYear(), end.getMonth(), 1);
                  setCustomStartDate(start.toISOString().split('T')[0]);
                  setCustomEndDate(end.toISOString().split('T')[0]);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,0.8)]'
                    : 'bg-white/60 border border-[#F8C8DC]/60 text-[#4A233E] hover:bg-white/80'
                }`}
              >
                1m
              </button>
              <button
                onClick={() => {
                  const end = new Date();
                  const start = new Date(end.getFullYear(), 0, 1);
                  setCustomStartDate(start.toISOString().split('T')[0]);
                  setCustomEndDate(end.toISOString().split('T')[0]);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${
                  isNightMode
                    ? 'bg-[rgba(48,43,79,0.6)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,0.8)]'
                    : 'bg-white/60 border border-[#F8C8DC]/60 text-[#4A233E] hover:bg-white/80'
                }`}
              >
                Año
              </button>
            </div>

            {/* Botón Generar Reporte */}
            <button
              onClick={handleGenerateReport}
              className={`ml-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-sm transition-all hover:scale-105 active:scale-95 ${
                isNightMode
                  ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/60 hover:bg-[rgba(48,43,79,0.9)]'
                  : 'bg-white/60 border-[#D4AF37]/60 hover:bg-white/80'
              }`}
            >
              {getIcon('file', 'w-4 h-4')}
              <span className={`text-xs font-black uppercase tracking-wider transition-colors duration-500 ${
                isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
              }`}>Generar Reporte</span>
            </button>
          </div>
          
          {/* Layout Horizontal: Ingresos, Egresos y Balance Total */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Total Ingresos */}
            <div className={`p-4 md:p-5 rounded-xl border-2 backdrop-blur-sm transition-colors duration-500 flex flex-col ${
              isNightMode 
                ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]/50' 
                : 'bg-[#D4AF37]/10 border-[#D4AF37]/40'
            }`}>
              <div className="flex items-center gap-2 mb-4 md:mb-5">
                <svg className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <p className={`text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70 transition-colors duration-500 truncate ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Ingresos</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className={`font-marcellus text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black transition-colors duration-500 text-center leading-none ${
                  isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                }`}>{formatCurrency(stats.ingresos, currency)}</p>
              </div>
            </div>
            
            {/* Total Egresos */}
            <div className={`p-4 md:p-5 rounded-xl border-2 backdrop-blur-sm transition-colors duration-500 flex flex-col ${
              isNightMode 
                ? 'bg-[rgba(199,125,255,0.2)] border-[#C77DFF]/50' 
                : 'bg-[#E35B8F]/10 border-[#E35B8F]/40'
            }`}>
              <div className="flex items-center gap-2 mb-4 md:mb-5">
                <svg className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <p className={`text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70 transition-colors duration-500 truncate ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Egresos</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className={`font-marcellus text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black transition-colors duration-500 text-center leading-none ${
                  isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                }`}>{formatCurrency(stats.egresos, currency)}</p>
              </div>
            </div>

            {/* Balance Total */}
            <div className={`p-4 md:p-5 rounded-xl border-2 backdrop-blur-sm transition-colors duration-500 flex flex-col ${
              stats.balance < 0
                ? isNightMode
                  ? 'bg-red-900/20 border-red-400/50'
                  : 'bg-red-50 border-red-400/50'
                : isNightMode
                  ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50'
                  : 'bg-white/60 border-[#F8C8DC]/60'
            }`}>
              <div className="mb-4 md:mb-5">
                <p className={`text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70 transition-colors duration-500 truncate ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Balance Total</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <h2 className={`font-marcellus text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight transition-colors duration-500 text-center leading-none ${
                  stats.balance < 0 
                    ? 'text-red-500' 
                    : isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                }`}>
                  {formatCurrency(stats.balance, currency)}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* Botones de Acción: Centro - Ingresos y Egresos más grandes (1/3 cada uno) */}
        <section className={`p-4 md:p-6 rounded-2xl border-2 backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-[0_0_50px_rgba(199,125,255,0.3),0_20px_60px_rgba(0,0,0,0.3)]' 
            : 'glass-card border-[#F8C8DC]/60 bg-white/75 shadow-[0_0_50px_rgba(248,200,220,0.3),0_20px_60px_rgba(0,0,0,0.1)]'
        }`}>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {/* Botón: Ingreso (+) - 1/3 del ancho */}
            <button
              onClick={() => {
                setModalType('Ingreso');
                setTransType('Ingreso');
                setShowTransactionModal(true);
              }}
              className={`p-6 md:p-8 rounded-xl border-2 transition-all active:scale-95 hover:scale-105 flex flex-col items-center justify-center gap-3 min-h-[100px] md:min-h-[120px] ${
                isNightMode
                  ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56] hover:bg-[rgba(166,138,86,0.3)]'
                  : 'bg-[#D4AF37]/10 border-[#D4AF37] hover:bg-[#D4AF37]/20'
              }`}
            >
              <div className={`text-5xl md:text-6xl lg:text-7xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
              }`}>+</div>
              <p className={`font-marcellus text-lg md:text-xl font-black uppercase tracking-wider transition-colors duration-500 ${
                isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
              }`}>Ingreso</p>
            </button>

            {/* Botón: Gasto (-) - 1/3 del ancho */}
            <button
              onClick={() => {
                setModalType('Egreso');
                setTransType('Egreso');
                setShowTransactionModal(true);
              }}
              className={`p-6 md:p-8 rounded-xl border-2 transition-all active:scale-95 hover:scale-105 flex flex-col items-center justify-center gap-3 min-h-[100px] md:min-h-[120px] ${
                isNightMode
                  ? 'bg-[rgba(199,125,255,0.2)] border-[#C77DFF] hover:bg-[rgba(199,125,255,0.3)]'
                  : 'bg-[#E35B8F]/10 border-[#E35B8F] hover:bg-[#E35B8F]/20'
              }`}
            >
              <div className={`text-5xl md:text-6xl lg:text-7xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
              }`}>-</div>
              <p className={`font-marcellus text-lg md:text-xl font-black uppercase tracking-wider transition-colors duration-500 ${
                isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
              }`}>Gasto</p>
            </button>

            {/* Botón: Recurrente (↻) - 1/3 del ancho */}
            <button
              onClick={() => {
                setModalType('Recurrente');
                setTransType('Egreso');
                setIsRecurring(true);
                setShowTransactionModal(true);
              }}
              className={`p-6 md:p-8 rounded-xl border-2 transition-all active:scale-95 hover:scale-105 flex flex-col items-center justify-center gap-3 min-h-[100px] md:min-h-[120px] ${
                isNightMode
                  ? 'bg-[rgba(122,116,142,0.2)] border-[#7A748E] hover:bg-[rgba(122,116,142,0.3)]'
                  : 'bg-[#8B5E75]/10 border-[#8B5E75] hover:bg-[#8B5E75]/20'
              }`}
            >
              <div className={`text-4xl md:text-5xl lg:text-6xl font-black transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>↻</div>
              <p className={`font-marcellus text-lg md:text-xl font-black uppercase tracking-wider transition-colors duration-500 ${
                isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>Recurrente</p>
            </button>
          </div>
        </section>

        {/* Módulo Unificado: Últimos Movimientos, Métodos de Pago y Clasificación */}
        <section className={`p-4 md:p-6 rounded-2xl border-2 backdrop-blur-[15px] transition-colors duration-500 ${
          isNightMode 
            ? 'bg-[rgba(48,43,79,0.6)] border-[#A68A56]/50 shadow-[0_0_50px_rgba(199,125,255,0.3),0_20px_60px_rgba(0,0,0,0.3)]' 
            : 'glass-card border-[#F8C8DC]/60 bg-white/75 shadow-[0_0_50px_rgba(248,200,220,0.3),0_20px_60px_rgba(0,0,0,0.1)]'
        }`}>
          {/* Tabs - 3 columnas iguales */}
          <div className="grid grid-cols-3 gap-2 mb-4 md:mb-6">
            <button
              onClick={() => setViewTab('movements')}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                viewTab === 'movements'
                  ? isNightMode
                    ? 'bg-[rgba(166,138,86,0.3)] border-[#A68A56]'
                    : 'bg-[#D4AF37]/20 border-[#D4AF37]'
                  : isNightMode
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 hover:border-[#A68A56]/60'
                    : 'bg-white/80 border-[#F8C8DC] hover:border-[#D4AF37]/40'
              }`}
            >
              <p className={`text-xs md:text-sm font-black uppercase tracking-wider transition-colors duration-500 ${
                viewTab === 'movements'
                  ? isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>Últimos Movimientos</p>
              <p className={`text-[10px] md:text-xs mt-1 transition-colors duration-500 ${
                viewTab === 'movements'
                  ? isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                  : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                {filteredTransactions.length} movimientos
              </p>
            </button>

            <button
              onClick={() => setViewTab('payment_method')}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                viewTab === 'payment_method'
                  ? isNightMode
                    ? 'bg-[rgba(166,138,86,0.3)] border-[#A68A56]'
                    : 'bg-[#D4AF37]/20 border-[#D4AF37]'
                  : isNightMode
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 hover:border-[#A68A56]/60'
                    : 'bg-white/80 border-[#F8C8DC] hover:border-[#D4AF37]/40'
              }`}
            >
              <p className={`text-xs md:text-sm font-black uppercase tracking-wider transition-colors duration-500 ${
                viewTab === 'payment_method'
                  ? isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>Métodos de Pago</p>
              <p className={`text-[10px] md:text-xs mt-1 transition-colors duration-500 ${
                viewTab === 'payment_method'
                  ? isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                  : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                {Object.keys(transactionsByPaymentMethod).length} métodos
              </p>
            </button>

            <button
              onClick={() => setViewTab('classification')}
              className={`p-3 md:p-4 rounded-xl border-2 transition-all active:scale-95 ${
                viewTab === 'classification'
                  ? isNightMode
                    ? 'bg-[rgba(199,125,255,0.3)] border-[#C77DFF]'
                    : 'bg-[#E35B8F]/20 border-[#E35B8F]'
                  : isNightMode
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 hover:border-[#A68A56]/60'
                    : 'bg-white/80 border-[#F8C8DC] hover:border-[#E35B8F]/40'
              }`}
            >
              <p className={`text-xs md:text-sm font-black uppercase tracking-wider transition-colors duration-500 ${
                viewTab === 'classification'
                  ? isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                  : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>Clasificación</p>
              <p className={`text-[10px] md:text-xs mt-1 transition-colors duration-500 ${
                viewTab === 'classification'
                  ? isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                  : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
              }`}>
                {Object.keys(transactionsByClassification.byTagIngresos).length + Object.keys(transactionsByClassification.byTagEgresos).length + (transactionsByClassification.fixed.length > 0 ? 1 : 0) + (transactionsByClassification.extra.length > 0 ? 1 : 0) + (transactionsByClassification.ingresos.length > 0 ? 1 : 0)} categorías
              </p>
            </button>
          </div>

          {/* Contenido según el tab activo */}
          {viewTab === 'movements' && (
            <>
              {filteredTransactions.length === 0 ? (
                <p className={`text-sm md:text-base text-center py-8 transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>
                  No hay movimientos registrados
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                  {filteredTransactions.map(transaction => (
                    <button
                      key={transaction.id}
                      onClick={() => handleEditTransaction(transaction)}
                      className={`p-3 md:p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-left min-h-[120px] md:min-h-[140px] ${
                        transaction.type === 'Ingreso'
                          ? isNightMode
                            ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]/40 hover:border-[#A68A56]/60'
                            : 'bg-[#D4AF37]/10 border-[#D4AF37]/40 hover:border-[#D4AF37]/60'
                          : isNightMode
                            ? 'bg-[rgba(199,125,255,0.2)] border-[#C77DFF]/40 hover:border-[#C77DFF]/60'
                            : 'bg-[#E35B8F]/10 border-[#E35B8F]/40 hover:border-[#E35B8F]/60'
                      }`}
                    >
                      <p className={`text-xs md:text-sm font-black line-clamp-2 mb-2 transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>
                        {transaction.description || 'Sin descripción'}
                      </p>
                      <div className="space-y-1 mb-3">
                        <p className={`text-[10px] md:text-xs transition-colors duration-500 ${
                          isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                        }`}>
                          {transaction.date}
                        </p>
                        <p className={`text-[10px] md:text-xs transition-colors duration-500 ${
                          isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                        }`}>
                          {transaction.type} • {transaction.payment_method}
                        </p>
                      </div>
                      <p className={`text-base md:text-lg font-black transition-colors duration-500 ${
                        transaction.type === 'Ingreso'
                          ? isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                          : isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                      }`}>
                        {transaction.type === 'Ingreso' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {viewTab === 'payment_method' && (
            <div className="space-y-3">
              {Object.entries(transactionsByPaymentMethod).map(([method, data]) => (
                <div 
                  key={method}
                  className={`p-3 rounded-lg border transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                      : 'bg-[#FDEEF4] border-[#F8C8DC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-marcellus text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>{method}</h5>
                      <p className={`text-xs transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {data.transactions.length} movimientos
                      </p>
                    </div>
                    <p className={`text-base font-black transition-colors duration-500 ${
                      data.balance >= 0 
                        ? isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                        : 'text-red-500'
                    }`}>{formatCurrency(data.balance, currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewTab === 'classification' && (
            <div className="space-y-3">
              {/* Ingresos */}
              {transactionsByClassification.ingresos.length > 0 && (
                <div className={`p-3 rounded-lg border transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]/40' 
                    : 'bg-[#D4AF37]/10 border-[#D4AF37]/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-marcellus text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Ingresos</h5>
                      <p className={`text-xs transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {transactionsByClassification.ingresos.length} movimientos
                      </p>
                    </div>
                    <p className={`text-base font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                    }`}>
                      {formatCurrency(transactionsByClassification.ingresos.reduce((acc, t) => acc + t.amount, 0), currency)}
                    </p>
                  </div>
                </div>
              )}

              {/* Gastos Fijos */}
              {transactionsByClassification.fixed.length > 0 && (
                <div className={`p-3 rounded-lg border transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                    : 'bg-[#FDEEF4] border-[#F8C8DC]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-marcellus text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Gastos Fijos</h5>
                      <p className={`text-xs transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {transactionsByClassification.fixed.length} movimientos
                      </p>
                    </div>
                    <p className={`text-base font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                    }`}>
                      {formatCurrency(transactionsByClassification.fixed.reduce((acc, t) => acc + t.amount, 0), currency)}
                    </p>
                  </div>
                </div>
              )}

              {/* Gastos Extra */}
              {transactionsByClassification.extra.length > 0 && (
                <div className={`p-3 rounded-lg border transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                    : 'bg-[#FDEEF4] border-[#F8C8DC]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-marcellus text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Gastos Extra</h5>
                      <p className={`text-xs transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {transactionsByClassification.extra.length} movimientos
                      </p>
                    </div>
                    <p className={`text-base font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                    }`}>
                      {formatCurrency(transactionsByClassification.extra.reduce((acc, t) => acc + t.amount, 0), currency)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags de Ingresos */}
              {Object.entries(transactionsByClassification.byTagIngresos).map(([tag, trans]) => (
                <div 
                  key={`ingreso-${tag}`}
                  className={`p-3 rounded-lg border transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(166,138,86,0.2)] border-[#A68A56]/40' 
                      : 'bg-[#D4AF37]/10 border-[#D4AF37]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-marcellus text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Ingreso: {tag}</h5>
                      <p className={`text-xs transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {trans.length} movimientos
                      </p>
                    </div>
                    <p className={`text-base font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                    }`}>
                      {formatCurrency(trans.reduce((acc, t) => acc + t.amount, 0), currency)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Tags de Egresos */}
              {Object.entries(transactionsByClassification.byTagEgresos).map(([tag, trans]) => (
                <div 
                  key={`egreso-${tag}`}
                  className={`p-3 rounded-lg border transition-colors duration-500 ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                      : 'bg-[#FDEEF4] border-[#F8C8DC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={`font-marcellus text-sm font-black transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Egreso: {tag}</h5>
                      <p className={`text-xs transition-colors duration-500 ${
                        isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {trans.length} movimientos
                      </p>
                    </div>
                    <p className={`text-base font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                    }`}>
                      {formatCurrency(trans.reduce((acc, t) => acc + t.amount, 0), currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modales para Vistas Agrupadas - ELIMINADOS, ahora son vistas compactas */}

      {/* Modal de Transacción */}
      {showTransactionModal && (
        <div 
          className={`fixed inset-0 z-[500] backdrop-blur-2xl flex items-center justify-center p-0 md:p-4 transition-colors duration-500 ${
            isNightMode ? 'bg-[#1A1A2E]/95' : 'bg-[#FFF0F5]/95'
          }`}
          onClick={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
            if (modalType !== 'Recurrente') {
              setIsRecurring(false);
            }
            setAmount('');
            setDescription('');
            setTags([]);
            setPaymentMethod('');
          }}
        >
          <div 
            className={`w-full h-full md:h-auto md:max-w-3xl md:rounded-[2rem] shadow-2xl backdrop-blur-[15px] transition-colors duration-500 flex flex-col ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.95)] border-0 md:border border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
                : 'glass-card border-0 md:border-[#F8C8DC] bg-white/90'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b transition-colors duration-500 ${
              isNightMode ? 'border-[#A68A56]/40' : 'border-[#F8C8DC]/50'
            }`}>
              <h2 className={`font-marcellus text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-[0.3em] transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>
                {editingTransaction 
                  ? (modalType === 'Ingreso' ? 'Ingreso' : modalType === 'Recurrente' ? 'Recurrente' : 'Gasto')
                  : (modalType === 'Ingreso' ? 'Ingreso' : modalType === 'Recurrente' ? 'Recurrente' : 'Gasto')
                }
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowTransactionModal(false);
                  if (modalType !== 'Recurrente') {
                    setIsRecurring(false);
                  }
                  setAmount('');
                  setDescription('');
                  setTags([]);
                  setPaymentMethod('');
                }}
                className={`p-2 rounded-xl transition-colors duration-500 ${
                  isNightMode 
                    ? 'hover:bg-[rgba(48,43,79,0.8)] text-[#E0E1DD]' 
                    : 'hover:bg-white/80 text-[#4A233E]'
                }`}
              >
                {getIcon('x', 'w-5 h-5')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
              {/* Nombre y Monto */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={`text-sm font-black uppercase tracking-widest mb-3 block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Nombre</label>
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={modalType === 'Ingreso' ? 'Ej: Sueldo de enero' : 'Ej: Zapatillas nuevas'}
                    className={`w-full border-2 rounded-lg px-5 py-4 text-base font-bold outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]' 
                        : 'bg-white/80 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:border-[#E35B8F]'
                    }`} 
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className={`text-sm font-black uppercase tracking-widest mb-3 block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Monto</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className={`w-full border-2 rounded-lg px-5 py-4 text-base font-black outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#E0E1DD] placeholder:text-[#7A748E]/50 focus:border-[#C77DFF]' 
                        : 'bg-white/80 border-[#F8C8DC] text-[#4A233E] placeholder:text-[#8B5E75]/50 focus:border-[#E35B8F]'
                    }`} 
                  />
                </div>
              </div>

              {/* Métodos de Pago */}
              <div>
                <label className={`text-sm font-black uppercase tracking-widest mb-3 block transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Método de Pago</label>
                <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
                  {availablePaymentMethods.slice(0, 4).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-4 rounded-lg border transition-all ${
                        paymentMethod === method
                          ? isNightMode
                            ? 'bg-[rgba(199,125,255,0.3)] border-[#C77DFF] shadow-sm'
                            : 'bg-[#E35B8F]/20 border-[#E35B8F] shadow-sm'
                          : isNightMode
                            ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 hover:border-[#A68A56]/60'
                            : 'bg-white/80 border-[#F8C8DC] hover:border-[#E35B8F]/40'
                      }`}
                    >
                      <div className={`transition-colors duration-500 ${
                        paymentMethod === method
                          ? isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                          : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>
                        {getPaymentMethodIcon(method)}
                      </div>
                      <p className={`text-xs font-black mt-2 transition-colors duration-500 ${
                        paymentMethod === method
                          ? isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                          : isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                      }`}>{method}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className={`text-sm font-black uppercase tracking-widest mb-3 block transition-colors duration-500 ${
                  isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                }`}>Categoría</label>
                <select
                  value={tags[0] || ''}
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== 'new' && !tags.includes(e.target.value)) {
                      setTags([e.target.value]);
                    } else if (e.target.value === 'new') {
                      const newTag = prompt('Nombre de la nueva categoría:');
                      if (newTag && newTag.trim()) {
                        setTags([newTag.trim()]);
                        if (!availableTags.includes(newTag.trim())) {
                          setAvailableTags([...availableTags, newTag.trim()]);
                        }
                      }
                    } else if (!e.target.value) {
                      setTags([]);
                    }
                  }}
                  className={`w-full border-2 rounded-lg px-5 py-4 text-base font-bold outline-none transition-all ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]' 
                      : 'bg-white/80 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {(transType === 'Ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
                    .map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new">+ Nueva categoría</option>
                </select>
              </div>

              {/* Opción Extra (solo para Egresos) */}
              {transType === 'Egreso' && (
                <div className={`p-4 rounded-lg border transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                    : 'bg-[#FDEEF4] border-[#F8C8DC]'
                }`}>
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExtra}
                      onChange={(e) => setIsExtra(e.target.checked)}
                      className={`w-6 h-6 rounded border-2 transition-colors duration-500 cursor-pointer ${
                        isNightMode
                          ? 'border-[#A68A56]/60 bg-[rgba(48,43,79,0.8)] checked:bg-[#C77DFF] checked:border-[#C77DFF]'
                          : 'border-[#F8C8DC] bg-white/80 checked:bg-[#E35B8F] checked:border-[#E35B8F]'
                      }`}
                    />
                    <span className={`text-base font-black transition-colors duration-500 ${
                      isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                    }`}>
                      Gasto Extra
                    </span>
                  </label>
                  <p className={`text-xs mt-2 ml-10 transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>
                    Marca esta opción si es un gasto adicional fuera de lo habitual
                  </p>
                </div>
              )}

              {/* Configuración de Recurrencia (solo para Recurrente) */}
              {modalType === 'Recurrente' && (
                <div className={`p-4 rounded-lg border space-y-3 transition-colors duration-500 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40' 
                    : 'bg-[#FDEEF4] border-[#F8C8DC]'
                }`}>
                  <label className={`text-sm font-black uppercase tracking-widest block transition-colors duration-500 ${
                    isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                  }`}>Frecuencia</label>
                  <select 
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value as any)}
                    className={`w-full border-2 rounded-lg px-5 py-4 text-base font-bold outline-none transition-all ${
                      isNightMode 
                        ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#E0E1DD] focus:border-[#C77DFF]' 
                        : 'bg-white/80 border-[#F8C8DC] text-[#4A233E] focus:border-[#E35B8F]'
                    }`}
                  >
                    <option value="mensual">Mensual</option>
                    <option value="semanal">Semanal</option>
                    <option value="diaria">Diaria</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              )}

              {/* Botón Eliminar (solo cuando se está editando) */}
              {editingTransaction && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('¿Estás segura de que deseas eliminar esta transacción?')) {
                      try {
                        await handleDelete(editingTransaction.id);
                        setShowTransactionModal(false);
                        setEditingTransaction(null);
                        // Reset form
                        setAmount('');
                        setDescription('');
                        setTags([]);
                        setPaymentMethod('');
                      } catch (error) {
                        console.error('Error deleting transaction:', error);
                      }
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-marcellus text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 hover:brightness-105 mb-3 ${
                    isNightMode ? 'bg-red-600/80 hover:bg-red-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Eliminar
                </button>
              )}

              {/* Botón Confirmar */}
              <button 
                type="submit" 
                className={`w-full py-4 rounded-xl font-marcellus text-lg font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 hover:brightness-105 ${
                  transType === 'Egreso' 
                    ? isNightMode ? 'bg-[#C77DFF]' : 'bg-[#E35B8F]'
                    : isNightMode ? 'bg-[#A68A56]' : 'bg-[#D4AF37]'
                }`}
              >
                {editingTransaction ? 'Guardar Cambios' : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Reporte */}
      {showReportModal && (
        <div 
          className={`fixed inset-0 z-[400] backdrop-blur-2xl flex items-center justify-center p-6 transition-colors duration-500 ${
            isNightMode ? 'bg-[#1A1A2E]/95' : 'bg-[#FFF0F5]/95'
          }`}
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className={`max-w-4xl w-full max-h-[85vh] flex flex-col rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-[15px] transition-colors duration-500 ${
              isNightMode 
                ? 'bg-[rgba(48,43,79,0.95)] border border-[#A68A56]/40 shadow-[0_0_40px_rgba(199,125,255,0.3)]' 
                : 'glass-card border-[#F8C8DC] bg-white/80'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex-shrink-0 text-center pt-8 pb-6 px-8 border-b transition-colors duration-500 ${
              isNightMode ? 'border-[#A68A56]/40' : 'border-[#F8C8DC]/50'
            }`}>
              <h2 className={`font-marcellus text-2xl md:text-4xl font-black mb-3 uppercase tracking-[0.3em] transition-colors duration-500 ${
                isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
              }`}>Generar Reporte</h2>
              <div className="flex gap-4 justify-center">
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className={`border rounded-xl px-4 py-2 text-sm font-bold outline-none transition-all ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#E0E1DD]' 
                      : 'bg-white/80 border-[#F8C8DC] text-[#4A233E]'
                  }`}
                />
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className={`border rounded-xl px-4 py-2 text-sm font-bold outline-none transition-all ${
                    isNightMode 
                      ? 'bg-[rgba(48,43,79,0.8)] border-[#A68A56]/40 text-[#E0E1DD]' 
                      : 'bg-white/80 border-[#F8C8DC] text-[#4A233E]'
                  }`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b transition-colors duration-500 ${
                      isNightMode ? 'border-[#A68A56]/40' : 'border-[#F8C8DC]'
                    }`}>
                      <th className={`text-left py-2 px-4 font-black uppercase transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Fecha</th>
                      <th className={`text-left py-2 px-4 font-black uppercase transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Tipo</th>
                      <th className={`text-left py-2 px-4 font-black uppercase transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Monto</th>
                      <th className={`text-left py-2 px-4 font-black uppercase transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Método</th>
                      <th className={`text-left py-2 px-4 font-black uppercase transition-colors duration-500 ${
                        isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'
                      }`}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions
                      .filter(t => {
                        const transDate = new Date(t.date);
                        const start = new Date(reportStartDate);
                        const end = new Date(reportEndDate);
                        return transDate >= start && transDate <= end;
                      })
                      .map(transaction => (
                        <tr 
                          key={transaction.id}
                          className={`border-b transition-colors duration-500 ${
                            isNightMode ? 'border-[#A68A56]/20' : 'border-[#F8C8DC]/30'
                          }`}
                        >
                          <td className={`py-2 px-4 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>{transaction.date}</td>
                          <td className={`py-2 px-4 transition-colors duration-500 ${
                            transaction.type === 'Ingreso' 
                              ? isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                              : isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                          }`}>{transaction.type}</td>
                          <td className={`py-2 px-4 font-black transition-colors duration-500 ${
                            transaction.type === 'Ingreso' 
                              ? isNightMode ? 'text-[#A68A56]' : 'text-[#D4AF37]'
                              : isNightMode ? 'text-[#C77DFF]' : 'text-[#E35B8F]'
                          }`}>{formatCurrency(transaction.amount, currency)}</td>
                          <td className={`py-2 px-4 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>{transaction.payment_method}</td>
                          <td className={`py-2 px-4 transition-colors duration-500 ${
                            isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'
                          }`}>{transaction.description || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`flex-shrink-0 flex gap-4 p-6 border-t backdrop-blur-sm transition-colors duration-500 ${
              isNightMode 
                ? 'border-[#A68A56]/40 bg-[rgba(48,43,79,0.8)]' 
                : 'border-[#F8C8DC]/50 bg-white/60'
            }`}>
              <button 
                onClick={handleExportCSV}
                className={`flex-1 py-4 rounded-[2rem] font-marcellus text-sm font-black uppercase tracking-[0.3em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,1)]' 
                    : 'glass-card border-[#F8C8DC] text-[#4A233E] hover:bg-white/80'
                }`}
              >
                {getIcon('download', 'w-5 h-5')}
                Exportar CSV
              </button>
              <button 
                onClick={handleExportExcel}
                className={`flex-1 py-4 rounded-[2rem] font-marcellus text-sm font-black uppercase tracking-[0.3em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] border border-[#A68A56]/40 text-[#E0E1DD] hover:bg-[rgba(48,43,79,1)]' 
                    : 'glass-card border-[#F8C8DC] text-[#4A233E] hover:bg-white/80'
                }`}
              >
                {getIcon('download', 'w-5 h-5')}
                Exportar Excel
              </button>
              <button 
                onClick={() => setShowReportModal(false)}
                className={`flex-1 py-4 rounded-[2rem] font-marcellus text-sm font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 ${
                  isNightMode 
                    ? 'bg-[rgba(48,43,79,0.8)] text-[#A68A56] border border-[#A68A56]/40 hover:bg-[rgba(48,43,79,1)]' 
                    : 'bg-[#4A233E] text-[#D4AF37] hover:bg-[#321829]'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanzaModule;
