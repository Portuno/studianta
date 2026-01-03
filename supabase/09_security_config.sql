-- Tabla de configuración de seguridad para usuarios
-- Permite almacenar PIN de seguridad y preferencias de biometría

CREATE TABLE IF NOT EXISTS security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  security_pin TEXT, -- Hash del PIN (en producción usar bcrypt)
  biometrics_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_security_config_user_id ON security_config(user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_security_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_config_updated_at
  BEFORE UPDATE ON security_config
  FOR EACH ROW
  EXECUTE FUNCTION update_security_config_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver y modificar su propia configuración
CREATE POLICY "Users can view their own security config"
  ON security_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security config"
  ON security_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security config"
  ON security_config
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own security config"
  ON security_config
  FOR DELETE
  USING (auth.uid() = user_id);

