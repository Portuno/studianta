# 🔐 Configuración Segura de Gemini API en Vercel

## ⚠️ Problema Resuelto

Las variables de entorno que empiezan con `VITE_` se exponen en el código del cliente (frontend), lo cual es un **riesgo de seguridad** para las API keys.

## ✅ Solución Implementada

He creado un **endpoint del servidor** (`/api/gemini`) que:
- ✅ Ejecuta las llamadas a Gemini en el **servidor** (Vercel Functions)
- ✅ **Nunca expone** la API key al cliente
- ✅ Protege tu API key de ser "leakeada"

## 📋 Pasos para Configurar en Vercel

### 1. Obtener una Nueva API Key de Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Crea una nueva API key
3. **Copia la nueva clave** (no la compartas)

### 2. Configurar en Vercel Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega una nueva variable:
   - **Name**: `GEMINI_API_KEY` (⚠️ **NO** uses `VITE_GEMINI_API_KEY`)
   - **Value**: Tu nueva API key de Gemini
   - **Environment**: Selecciona todas (Production, Preview, Development)

### 3. Eliminar Variables Antiguas (Opcional pero Recomendado)

Si tienes `VITE_GEMINI_API_KEY` configurada en Vercel:
1. Ve a **Settings** → **Environment Variables**
2. Elimina `VITE_GEMINI_API_KEY` (ya no es necesaria)

### 4. Redeploy

Después de agregar la variable de entorno:
1. Ve a **Deployments**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **Redeploy**

## 🧪 Desarrollo Local

Para desarrollo local, necesitas configurar la variable de entorno en tu archivo `.env` o `.env.local`:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

**Nota**: En desarrollo local, el endpoint `/api/gemini` funcionará automáticamente cuando despliegues en Vercel. Para desarrollo local completo, podrías necesitar usar `vercel dev` o configurar un proxy local.

## 📁 Archivos Creados/Modificados

- ✅ `api/gemini.js` - Endpoint del servidor (protege la API key)
- ✅ `services/geminiService.ts` - Actualizado para usar el endpoint del servidor
- ✅ `vercel.json` - Configuración de Vercel para las funciones serverless

## 🔍 Verificación

Después de configurar:
1. Despliega en Vercel
2. Prueba el Oráculo Académico o la Balanza de Latón
3. Verifica en las DevTools del navegador que **NO** aparece la API key en el código fuente

## 🚨 Importante

- ❌ **NO** uses `VITE_GEMINI_API_KEY` en Vercel
- ✅ **SÍ** usa `GEMINI_API_KEY` en Vercel
- La API key ahora está **solo en el servidor**, nunca en el cliente

