import React from 'react';
import { NutritionCorrelation } from '../../types';

interface CorrelationInsightsProps {
  correlations: NutritionCorrelation[];
  isNightMode?: boolean;
}

const CorrelationInsights: React.FC<CorrelationInsightsProps> = ({
  correlations,
  isNightMode = false,
}) => {
  if (correlations.length === 0) {
    return (
      <div className={`p-4 rounded-lg ${isNightMode ? 'bg-[#16213E] border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
        <p className={`text-sm ${isNightMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Aún no hay suficientes datos para generar insights. Registra comidas y sesiones de estudio para ver correlaciones.
        </p>
      </div>
    );
  }

  const positiveCorrelations = correlations.filter(c => c.correlation_type === 'positive');
  const negativeCorrelations = correlations.filter(c => c.correlation_type === 'negative');

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-bold ${isNightMode ? 'text-white' : 'text-gray-900'}`}>
        Reporte de Enfoque
      </h3>

      {/* Positive correlations */}
      {positiveCorrelations.length > 0 && (
        <div className={`p-4 rounded-lg ${isNightMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
          <h4 className={`font-semibold mb-2 ${isNightMode ? 'text-green-300' : 'text-green-800'}`}>
            Correlaciones Positivas
          </h4>
          <div className="space-y-2">
            {positiveCorrelations.slice(0, 3).map((corr) => (
              <div key={corr.id} className={`text-sm ${isNightMode ? 'text-green-200' : 'text-green-700'}`}>
                <p>{corr.insights}</p>
                <p className={`text-xs mt-1 ${isNightMode ? 'text-green-400' : 'text-green-600'}`}>
                  Sesión de calidad {corr.session_quality_score}/10, {corr.time_between} min después de la comida
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negative correlations */}
      {negativeCorrelations.length > 0 && (
        <div className={`p-4 rounded-lg ${isNightMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
          <h4 className={`font-semibold mb-2 ${isNightMode ? 'text-red-300' : 'text-red-800'}`}>
            Correlaciones Negativas
          </h4>
          <div className="space-y-2">
            {negativeCorrelations.slice(0, 3).map((corr) => (
              <div key={corr.id} className={`text-sm ${isNightMode ? 'text-red-200' : 'text-red-700'}`}>
                <p>{corr.insights}</p>
                <p className={`text-xs mt-1 ${isNightMode ? 'text-red-400' : 'text-red-600'}`}>
                  Sesión de calidad {corr.session_quality_score}/10, {corr.time_between} min después de la comida
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {correlations.length >= 5 && (
        <div className={`p-4 rounded-lg ${isNightMode ? 'bg-[#16213E] border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-sm ${isNightMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Basado en {correlations.length} correlaciones analizadas. 
            {positiveCorrelations.length > negativeCorrelations.length 
              ? ' Tus mejores sesiones ocurren después de comidas equilibradas.' 
              : ' Considera ajustar el timing de tus comidas antes de estudiar.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CorrelationInsights;
