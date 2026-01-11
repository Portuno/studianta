import { BalanzaProTransaction } from '../types';

// Dynamic import for xlsx (optional dependency)
let XLSX: any = null;
const loadXLSX = async () => {
  if (!XLSX) {
    try {
      XLSX = await import('xlsx');
      return XLSX;
    } catch (error) {
      console.warn('xlsx library not available. Excel export will not work. Install with: npm install xlsx');
      return null;
    }
  }
  return XLSX;
};

/**
 * Exporta datos a CSV
 */
export const exportToCSV = (data: BalanzaProTransaction[], filename: string) => {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Crear encabezados
  const headers = [
    'Fecha',
    'Tipo',
    'Monto',
    'Método de Pago',
    'Descripción',
    'Tags',
    'Gasto Extra',
    'Recurrente',
    'Estado',
  ];

  // Crear filas de datos
  const rows = data.map((transaction) => [
    transaction.date,
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.payment_method,
    transaction.description || '',
    transaction.tags.join(', '),
    transaction.is_extra ? 'Sí' : 'No',
    transaction.is_recurring ? 'Sí' : 'No',
    transaction.status,
  ]);

  // Combinar encabezados y filas
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta datos a Excel
 */
export const exportToExcel = async (data: BalanzaProTransaction[], filename: string) => {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const xlsxLib = await loadXLSX();
  if (!xlsxLib) {
    alert('La librería xlsx no está disponible. Por favor, instálala con: npm install xlsx\n\nExportando como CSV en su lugar...');
    exportToCSV(data, filename.replace('.xlsx', '.csv'));
    return;
  }

  // Preparar datos para Excel
  const worksheetData = [
    [
      'Fecha',
      'Tipo',
      'Monto',
      'Método de Pago',
      'Descripción',
      'Tags',
      'Gasto Extra',
      'Recurrente',
      'Estado',
      'Fecha de Vencimiento',
    ],
    ...data.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.amount,
      transaction.payment_method,
      transaction.description || '',
      transaction.tags.join(', '),
      transaction.is_extra ? 'Sí' : 'No',
      transaction.is_recurring ? 'Sí' : 'No',
      transaction.status,
      transaction.due_date || '',
    ]),
  ];

  // Crear workbook y worksheet
  const workbook = xlsxLib.utils.book_new();
  const worksheet = xlsxLib.utils.aoa_to_sheet(worksheetData);

  // Ajustar ancho de columnas
  worksheet['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 10 }, // Tipo
    { wch: 12 }, // Monto
    { wch: 18 }, // Método de Pago
    { wch: 30 }, // Descripción
    { wch: 25 }, // Tags
    { wch: 12 }, // Gasto Extra
    { wch: 12 }, // Recurrente
    { wch: 12 }, // Estado
    { wch: 18 }, // Fecha de Vencimiento
  ];

  // Agregar worksheet al workbook
  xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Balanza Pro');

  // Generar archivo y descargar
  xlsxLib.writeFile(workbook, filename);
};

/**
 * Formatea el nombre del archivo con el período
 */
export const formatFilename = (
  prefix: string,
  startDate: string,
  endDate: string,
  extension: 'csv' | 'xlsx'
): string => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${prefix}_${start}_${end}.${extension}`;
};
