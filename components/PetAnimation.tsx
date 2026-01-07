import React, { useState, useEffect } from 'react';

interface PetAnimationProps {
  show: boolean;
  onAnimationEnd?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

const PetAnimation: React.FC<PetAnimationProps> = ({ show, onAnimationEnd, className = '', size = 'medium' }) => {
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (show && !hasShown) {
      setHasShown(true);
    }
  }, [show, hasShown]);

  if (!show || !hasShown) return null;

  // Tamaños según el prop
  const sizeClasses = {
    small: 'w-24 h-24 md:w-28 md:h-28',
    medium: 'w-32 h-32 md:w-40 md:h-40',
    large: 'w-48 h-48 md:w-56 md:h-56',
    xlarge: 'w-64 h-64 md:w-80 md:h-80'
  };

  // Datos de la mascota "Ati" - Polishes geometric orb
  const petData = {
    name: "Polishes geometric orb",
    animation_webm: "https://assets.masco.dev/8b1953/ati-a2c8/polishes-geometric-orb-f4f00f0a.webm",
    animation_mov: "https://assets.masco.dev/8b1953/ati-a2c8/polishes-geometric-orb-38ac361f.mov",
    video: "https://assets.masco.dev/8b1953/ati-a2c8/polishes-geometric-orb-31083d0b.mp4",
    transparent_image: "https://assets.masco.dev/8b1953/ati-a2c8/polishes-geometric-orb-d3779b19.png",
    image: "https://assets.masco.dev/8b1953/ati-a2c8/polishes-geometric-orb-38002529.png"
  };

  const handleVideoEnd = () => {
    if (onAnimationEnd) {
      onAnimationEnd();
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Video/Animación de la mascota - solo el búho, sin efectos de fondo */}
      <video
        autoPlay
        loop={false}
        muted
        playsInline
        onEnded={handleVideoEnd}
        className={`${sizeClasses[size]} object-contain`}
        style={{ 
          animation: 'fadeIn 0.5s ease-in'
        }}
      >
        {/* Intentar diferentes formatos para mejor compatibilidad */}
        <source src={petData.animation_webm} type="video/webm" />
        <source src={petData.video} type="video/mp4" />
        <source src={petData.animation_mov} type="video/quicktime" />
        {/* Fallback a imagen si el video no carga */}
        <img 
          src={petData.transparent_image} 
          alt={petData.name}
          className={`${sizeClasses[size]} object-contain`}
        />
      </video>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default PetAnimation;

