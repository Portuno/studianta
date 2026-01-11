/**
 * Hook para sonidos táctiles de la calculadora
 */

import { useEffect, useRef } from 'react';

interface UseCalculatorSoundsProps {
  enabled: boolean;
  volume: number;
}

export const useCalculatorSounds = ({ enabled, volume }: UseCalculatorSoundsProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    if (enabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [enabled]);
  
  const playTone = (frequency: number, duration: number = 50) => {
    if (!enabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.1, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      // Silenciar errores de audio
    }
  };
  
  const playNumberSound = () => {
    playTone(800, 30);
  };
  
  const playOperatorSound = () => {
    playTone(600, 40);
  };
  
  const playEqualsSound = () => {
    playTone(1000, 60);
  };
  
  const playErrorSound = () => {
    playTone(300, 100);
  };
  
  return {
    playNumberSound,
    playOperatorSound,
    playEqualsSound,
    playErrorSound,
  };
};
