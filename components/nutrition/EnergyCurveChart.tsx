import React from 'react';
import { EnergyCurve } from '../../types';

interface EnergyCurveChartProps {
  curves: EnergyCurve[];
  isNightMode?: boolean;
}

const EnergyCurveChart: React.FC<EnergyCurveChartProps> = ({ curves, isNightMode = false }) => {
  if (curves.length === 0) return null;

  const width = 300;
  const height = 150;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min/max for scaling
  const minEnergy = Math.min(...curves.map(c => c.estimated_energy));
  const maxEnergy = Math.max(...curves.map(c => c.estimated_energy));
  const energyRange = maxEnergy - minEnergy || 1;

  // Determine line color based on pattern
  const firstEnergy = curves[0]?.estimated_energy || 5;
  const lastEnergy = curves[curves.length - 1]?.estimated_energy || 5;
  const isSpike = firstEnergy < lastEnergy && curves.some((c, i) => i > 0 && c.estimated_energy < curves[i - 1].estimated_energy);
  const lineColor = isSpike ? '#ef4444' : '#22c55e'; // red for spike, green for stable

  // Generate path
  const points = curves.map((curve, index) => {
    const x = padding + (index / (curves.length - 1)) * chartWidth;
    const normalizedEnergy = (curve.estimated_energy - minEnergy) / energyRange;
    const y = padding + chartHeight - (normalizedEnergy * chartHeight);
    return { x, y, energy: curve.estimated_energy, time: curve.time };
  });

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className={`rounded-lg p-4 ${isNightMode ? 'bg-[#16213E]' : 'bg-white'}`}>
      <h3 className="text-sm font-semibold mb-3">Curva de Energía (4 horas)</h3>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * chartHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke={isNightMode ? '#2D3748' : '#E5E7EB'}
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          );
        })}
        
        {/* Energy line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill={lineColor}
              className="transition-all duration-300"
            />
            {/* Time labels */}
            {index % 2 === 0 && (
              <text
                x={point.x}
                y={height - 5}
                textAnchor="middle"
                className={`text-xs ${isNightMode ? 'fill-gray-400' : 'fill-gray-600'}`}
              >
                {point.time}
              </text>
            )}
          </g>
        ))}
        
        {/* Y-axis labels */}
        <text
          x={5}
          y={padding + 5}
          className={`text-xs ${isNightMode ? 'fill-gray-400' : 'fill-gray-600'}`}
        >
          {Math.round(maxEnergy)}
        </text>
        <text
          x={5}
          y={height - padding + 5}
          className={`text-xs ${isNightMode ? 'fill-gray-400' : 'fill-gray-600'}`}
        >
          {Math.round(minEnergy)}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Equilibrada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className={isNightMode ? 'text-gray-400' : 'text-gray-600'}>Pico y caída</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyCurveChart;
