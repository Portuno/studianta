-- ============================================
-- TABLA: balanza_pro_transactions
-- Descripción: Transacciones financieras avanzadas del módulo Balanza Pro
-- ============================================

-- Crear la tabla balanza_pro_transactions
CREATE TABLE IF NOT EXISTS public.balanza_pro_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Ingreso', 'Egreso')),
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  is_extra BOOLEAN DEFAULT false NOT NULL,
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Completado' NOT NULL CHECK (status IN ('Pendiente', 'Completado')),
  recurring_config JSONB,
  due_date DATE,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.balanza_pro_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias transacciones
CREATE POLICY "Users can view own balanza pro transactions"
  ON public.balanza_pro_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias transacciones
CREATE POLICY "Users can insert own balanza pro transactions"
  ON public.balanza_pro_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias transacciones
CREATE POLICY "Users can update own balanza pro transactions"
  ON public.balanza_pro_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias transacciones
CREATE POLICY "Users can delete own balanza pro transactions"
  ON public.balanza_pro_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_balanza_pro_transactions
  BEFORE UPDATE ON public.balanza_pro_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_user_id_idx ON public.balanza_pro_transactions(user_id);
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_date_idx ON public.balanza_pro_transactions(date);
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_type_idx ON public.balanza_pro_transactions(type);
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_payment_method_idx ON public.balanza_pro_transactions(payment_method);
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_status_idx ON public.balanza_pro_transactions(status);
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_is_recurring_idx ON public.balanza_pro_transactions(is_recurring);
CREATE INDEX IF NOT EXISTS balanza_pro_transactions_due_date_idx ON public.balanza_pro_transactions(due_date);
