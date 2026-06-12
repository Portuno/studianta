import React, { useRef } from 'react';
import { CanvasElement } from '../../types';
import { FONT_CLASS } from './canvasUtils';

interface CanvasElementViewProps {
  element: CanvasElement;
  selected: boolean;
  isInBlock: boolean;
  canEdit: boolean;
  isNightMode?: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDoubleActivate: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onTextChange?: (id: string, text: string) => void;
}

const CanvasElementView: React.FC<CanvasElementViewProps> = ({
  element,
  selected,
  isInBlock,
  canEdit,
  isNightMode = false,
  onSelect,
  onDoubleActivate,
  onMove,
  onTextChange,
}) => {
  const dragRef = useRef<{
    startX: number; startY: number; origX: number; origY: number; dragging: boolean;
  } | null>(null);
  const lastTapRef = useRef(0);
  const DRAG_THRESHOLD = 8;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canEdit) return;
    e.stopPropagation();
    const additive = e.ctrlKey || e.metaKey;
    onSelect(element.id, additive);

    if (element.type === 'text' && (e.target as HTMLElement).tagName === 'TEXTAREA') return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: element.x,
      origY: element.y,
      dragging: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canEdit) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragRef.current.dragging = true;
    }
    onMove(element.id, Math.max(0, dragRef.current.origX + dx), Math.max(0, dragRef.current.origY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      dragRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      onDoubleActivate(element.id);
    }
    lastTapRef.current = now;
  };

  const borderClass = selected
    ? 'ring-2 ring-[#E35B8F] ring-offset-1'
    : isInBlock
      ? 'ring-1 ring-[#D4AF37]/60'
      : '';

  const fontClass = FONT_CLASS[element.fontFamily || 'garamond'] || 'font-garamond';

  return (
    <div
      className={`absolute touch-none select-none ${borderClass} ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      {element.type === 'image' && element.imageUrl ? (
        <img
          src={element.imageUrl}
          alt=""
          className="w-full h-full object-cover rounded-lg shadow-md pointer-events-none"
          draggable={false}
        />
      ) : (
        <div
          className={`w-full h-full rounded-lg shadow-sm p-2 flex items-center justify-center ${
            isNightMode ? 'bg-[#302B4F]/90' : 'bg-white/90'
          }`}
          style={{ backgroundColor: element.backgroundColor }}
        >
          {canEdit ? (
            <textarea
              value={element.text || ''}
              onChange={e => onTextChange?.(element.id, e.target.value)}
              onPointerDown={e => e.stopPropagation()}
              className={`w-full h-full bg-transparent resize-none outline-none text-center ${fontClass}`}
              style={{
                fontSize: element.fontSize || 18,
                fontWeight: element.fontWeight || 'normal',
                color: element.color || (isNightMode ? '#E0E1DD' : '#4A233E'),
              }}
              placeholder="Escribe aquí..."
            />
          ) : (
            <p
              className={`text-center ${fontClass}`}
              style={{
                fontSize: element.fontSize || 18,
                fontWeight: element.fontWeight || 'normal',
                color: element.color || (isNightMode ? '#E0E1DD' : '#4A233E'),
              }}
            >
              {element.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CanvasElementView;
