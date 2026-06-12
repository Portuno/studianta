import { CanvasElement, BoardBlock } from '../../types';

export const CANVAS_WIDTH = 1400;
export const CANVAS_HEIGHT = 2000;

export function getElementBounds(elements: CanvasElement[]) {
  if (!elements.length) return null;
  const xs = elements.map(e => e.x);
  const ys = elements.map(e => e.y);
  const rights = elements.map(e => e.x + e.width);
  const bottoms = elements.map(e => e.y + e.height);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...rights) - Math.min(...xs),
    height: Math.max(...bottoms) - Math.min(...ys),
  };
}

export function getBlockElements(block: BoardBlock, elements: CanvasElement[]): CanvasElement[] {
  return elements.filter(e => e.blockId === block.id || block.elementIds.includes(e.id));
}

export function getActiveCanvasElements(elements: CanvasElement[], blocks: BoardBlock[]): CanvasElement[] {
  const achievedBlockIds = new Set(
    blocks.filter(b => b.status === 'conseguido').map(b => b.id)
  );
  return elements.filter(e => !e.blockId || !achievedBlockIds.has(e.blockId));
}

export function getViewportCenter(scrollLeft: number, scrollTop: number, viewportWidth: number, viewportHeight: number) {
  return {
    x: scrollLeft + Math.max(80, viewportWidth / 2 - 100),
    y: scrollTop + Math.max(80, viewportHeight / 2 - 80),
  };
}

export const FONT_CLASS: Record<string, string> = {
  cinzel: 'font-cinzel',
  garamond: 'font-garamond',
  inter: 'font-inter',
};
