import React, { useRef, useState, useCallback, useEffect } from 'react';
import { BoardBlock, CanvasElement } from '../../types';
import CanvasElementView from './CanvasElementView';
import LinkElementsToolbar from './LinkElementsToolbar';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  getActiveCanvasElements,
  getBlockElements,
  getElementBounds,
  getViewportCenter,
} from './canvasUtils';

interface InteractiveCanvasProps {
  elements: CanvasElement[];
  blocks: BoardBlock[];
  canEdit: boolean;
  isMobile?: boolean;
  isNightMode?: boolean;
  onElementsChange: (elements: CanvasElement[]) => void;
  onOpenBlock: (block: BoardBlock) => void;
  onLinkSelection: (elementIds: string[]) => Promise<void>;
}

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  elements,
  blocks,
  canEdit,
  isMobile = false,
  isNightMode = false,
  onElementsChange,
  onOpenBlock,
  onLinkSelection,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [linkMode, setLinkMode] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeBlocks = blocks.filter(b => b.status === 'en_proceso');
  const visibleElements = getActiveCanvasElements(elements, blocks);

  const persistElements = useCallback((next: CanvasElement[]) => {
    onElementsChange(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {}, 300);
  }, [onElementsChange]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const handleSelect = (id: string, additive: boolean) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;

    if (el.blockId) {
      const block = blocks.find(b => b.id === el.blockId);
      if (block && !additive && !linkMode) {
        onOpenBlock(block);
        return;
      }
    }

    if (linkMode || additive) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const handleDoubleActivate = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el?.blockId) {
      const block = blocks.find(b => b.id === el.blockId);
      if (block) onOpenBlock(block);
    }
  };

  const handleMove = (id: string, x: number, y: number) => {
    const next = elements.map(el => (el.id === id ? { ...el, x, y } : el));
    persistElements(next);
  };

  const handleTextChange = (id: string, text: string) => {
    const next = elements.map(el => (el.id === id ? { ...el, text } : el));
    persistElements(next);
  };

  const handleCanvasClick = () => {
    if (!linkMode) setSelectedIds(new Set());
  };

  const handleLink = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length < 2) return;
    await onLinkSelection(ids);
    setSelectedIds(new Set());
    setLinkMode(false);
  };

  return (
    <div className="space-y-2">
      {canEdit && (
        <LinkElementsToolbar
          count={selectedIds.size}
          isMobile={isMobile}
          isNightMode={isNightMode}
          linkMode={linkMode}
          onToggleLinkMode={() => {
            setLinkMode(m => !m);
            setSelectedIds(new Set());
          }}
          onLink={handleLink}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      <div
        ref={scrollRef}
        className={`relative overflow-auto rounded-2xl border touch-pan-x touch-pan-y ${
          isNightMode
            ? 'border-[#D4AF37]/20 bg-[#1A1A2E]'
            : 'border-[#F8C8DC] bg-[#FFF0F5]/50'
        }`}
        style={{ height: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 240px)', minHeight: 400 }}
        onClick={handleCanvasClick}
      >
        <div
          className="relative"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundImage: isNightMode
              ? 'radial-gradient(circle, rgba(212,175,55,0.06) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(227,91,143,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Group overlays for defined blocks */}
          {activeBlocks
            .filter(b => b.elementIds.length > 0)
            .map(block => {
              const blockEls = getBlockElements(block, visibleElements);
              const bounds = getElementBounds(blockEls);
              if (!bounds) return null;
              const progressColor = block.progressPercentage >= 100 ? '#D4AF37' : '#E35B8F';
              return (
                <div
                  key={`group-${block.id}`}
                  className="absolute pointer-events-none rounded-xl border-2 border-dashed border-[#D4AF37]/50"
                  style={{
                    left: bounds.x - 8,
                    top: bounds.y - 8,
                    width: bounds.width + 16,
                    height: bounds.height + 16,
                  }}
                >
                  <div
                    className="absolute -top-3 left-2 px-2 py-0.5 rounded-full text-[10px] font-cinzel text-white shadow"
                    style={{ backgroundColor: progressColor }}
                  >
                    {block.name || 'Objetivo'} · {block.progressPercentage}%
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-xl overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${block.progressPercentage}%`, backgroundColor: progressColor }}
                    />
                  </div>
                </div>
              );
            })}

          {visibleElements.map(el => (
            <CanvasElementView
              key={el.id}
              element={el}
              selected={selectedIds.has(el.id)}
              isInBlock={!!el.blockId}
              canEdit={canEdit}
              isNightMode={isNightMode}
              onSelect={handleSelect}
              onDoubleActivate={handleDoubleActivate}
              onMove={handleMove}
              onTextChange={handleTextChange}
            />
          ))}

          {visibleElements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8 text-center">
              <p className={`font-cinzel text-lg mb-2 ${isNightMode ? 'text-[#E0E1DD]/70' : 'text-[#8B5E75]'}`}>
                Tu lienzo está vacío
              </p>
              <p className={`text-sm ${isNightMode ? 'text-[#E0E1DD]/50' : 'text-[#8B5E75]/80'}`}>
                Añade imágenes y textos, luego enlázalos con Ctrl+clic (o modo enlazar en móvil)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { getViewportCenter };
export default InteractiveCanvas;
