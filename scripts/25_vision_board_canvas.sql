-- Vision Board: lienzo interactivo (canvas elements)
-- Ejecutar después de 24_vision_board.sql

ALTER TABLE public.vision_boards
  ADD COLUMN IF NOT EXISTS canvas_elements JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.board_blocks
  ADD COLUMN IF NOT EXISTS element_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_vision_boards_canvas_elements
  ON public.vision_boards USING gin (canvas_elements);
