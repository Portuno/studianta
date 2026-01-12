import React from 'react';

interface MacroRingProps {
  value: number;
  goal: number;
  label: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const MacroRing: React.FC<MacroRingProps> = ({
  value,
  goal,
  label,
  color,
  size = 120,
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, (value / goal) * 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {Math.round(percentage)}%
          </span>
          <span className="text-xs opacity-70 mt-1">
            {Math.round(value)}/{Math.round(goal)}g
          </span>
        </div>
      </div>
      <span className="text-sm font-medium mt-2">{label}</span>
    </div>
  );
};

export default MacroRing;
