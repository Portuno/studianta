# 🔒 Migración de Mabot a Supabase Edge Functions

## 🎯 **Objetivo**
Mover las credenciales sensibles de Mabot del frontend (variables de entorno) a Supabase Edge Functions para mayor seguridad.

## ✅ **Cambios Realizados**

### 1. **Frontend (Chat.tsx)**
- ❌ Removidas variables `VITE_MABOT_*`
- ❌ Removidas funciones de autenticación directa
- ✅ Integrado con Supabase Edge Functions
- ✅ Manejo seguro de tokens

### 2. **Edge Functions Creadas**
- `mabot-auth`: Autenticación con Mabot
- `mabot-chat`: Comunicación con Mabot
- `mabot-refresh`: Renovación de tokens

## 🚀 **Pasos para Completar la Migración**

### **Paso 1: Limpiar Variables del Frontend**
```bash
# Remover del archivo .env.local
VITE_MABOT_BASE_URL=...
VITE_MABOT_USERNAME=...
VITE_MABOT_PASSWORD=...

# Remover de Vercel Environment Variables
# (hacer desde el dashboard de Vercel)
```

### **Paso 2: Configurar Secrets en Supabase**
1. **Ir a Supabase Dashboard** > Settings > Edge Functions
2. **Agregar estas variables:**
   ```
   MABOT_BASE_URL = https://tu-servidor-mabot.com
   MABOT_USERNAME = tu_usuario_mabot
   MABOT_PASSWORD = tu_password_mabot
   ```

### **Paso 3: Desplegar Edge Functions**
```bash
# Desde la raíz del proyecto
supabase functions deploy mabot-auth
supabase functions deploy mabot-chat
```

### **Paso 4: Verificar Funcionamiento**
1. **Ir a Edge Functions** en Supabase Dashboard
2. **Verificar que estén "Active"**
3. **Probar el chat** en la aplicación

## 🔧 **Estructura de Archivos**

```
supabase/
├── functions/
│   ├── mabot-auth/
│   │   ├── index.ts          # Autenticación
│   │   └── deno.json         # Config Deno
│   └── mabot-chat/
│       ├── index.ts          # Chat principal
│       └── deno.json         # Config Deno
└── 01_mabot_secrets.sql      # Instrucciones SQL
```

## 🛡️ **Beneficios de Seguridad**

### **Antes (Frontend)**
- ❌ Credenciales visibles en el código fuente
- ❌ Accesibles desde DevTools del navegador
- ❌ Expuestas en el bundle de producción

### **Después (Edge Functions)**
- ✅ Credenciales solo en Supabase (servidor)
- ✅ No visibles para el usuario final
- ✅ Acceso controlado por autenticación
- ✅ Logs centralizados en Supabase

## 🚨 **Troubleshooting**

### **Error: "Mabot configuration missing"**
- Verificar que los secrets estén configurados en Supabase
- Verificar que las Edge Functions estén desplegadas

### **Error: "Unauthorized"**
- Verificar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configurados
- Verificar que el usuario esté autenticado en Supabase

### **Error: "Function not found"**
- Verificar que las Edge Functions estén desplegadas
- Verificar que los nombres de las funciones sean correctos

## 📝 **Notas Importantes**

1. **Las credenciales de Mabot ya NO están en el frontend**
2. **Todas las comunicaciones pasan por Supabase Edge Functions**
3. **Los tokens se almacenan localmente pero se validan en el servidor**
4. **La seguridad ahora depende de Supabase, no del frontend**

## 🔄 **Rollback (si es necesario)**

Si necesitas volver a la configuración anterior:
1. Restaurar las variables `VITE_MABOT_*` en `.env.local` y Vercel
2. Revertir los cambios en `Chat.tsx`
3. Remover las Edge Functions de Supabase

---

**Estado:** ✅ **Frontend migrado** | ⏳ **Edge Functions listas para desplegar** 