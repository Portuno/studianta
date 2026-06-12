import React, { useEffect, useState } from 'react';
import { VisionBoard, BoardBlock } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import VisionBoardGrid from './VisionBoardGrid';

interface PublicVisionBoardPageProps {
  shareToken: string;
}

const PublicVisionBoardPage: React.FC<PublicVisionBoardPageProps> = ({ shareToken }) => {
  const [board, setBoard] = useState<VisionBoard | null>(null);
  const [blocks, setBlocks] = useState<BoardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await supabaseService.getPublicBoardByShareToken(shareToken);
        if (!result) {
          setError('Tablero no encontrado o no es público');
        } else {
          setBoard(result.board);
          setBlocks(result.blocks.filter(b => b.status === 'en_proceso'));
        }
      } catch {
        setError('Error al cargar el tablero');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF0F5]">
        <p className="text-[#8B5E75] font-cinzel">Cargando Vision Board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF0F5] px-4">
        <p className="text-[#4A233E] font-cinzel text-xl mb-2">Vision Board</p>
        <p className="text-[#8B5E75]">{error || 'No disponible'}</p>
        <a href="/" className="mt-4 text-[#E35B8F] text-sm hover:underline">
          Ir a Studianta
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] to-[#FDEEF4]">
      <header className="px-4 py-6 text-center border-b border-[#F8C8DC]/50">
        <p className="text-[#8B5E75] text-xs mb-1">Vision Board compartido</p>
        <h1 className="font-cinzel text-2xl text-[#4A233E]">{board.title}</h1>
        <p className="text-[#8B5E75] text-xs mt-1">Solo lectura</p>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <VisionBoardGrid
          blocks={blocks}
          progressLogs={{}}
          canEdit={false}
          onBlockClick={() => {}}
          onToggleChecklistItem={() => {}}
        />
      </main>
      <footer className="text-center py-6">
        <a href="/" className="text-[#E35B8F] text-sm hover:underline font-cinzel">
          Creado con Studianta
        </a>
      </footer>
    </div>
  );
};

export default PublicVisionBoardPage;
