# 🔐 Configuración de JWT para Webhooks de Stripe en Supabase

## 🚨 **Problema Identificado:**

Cuando Supabase tiene **JWT habilitado**, las funciones Edge requieren autenticación. Sin embargo, **Stripe no puede enviar un JWT válido** porque no es un usuario autenticado.

## ✅ **Soluciones Disponibles:**

### **Opción 1: Deshabilitar JWT para la función específica (RECOMENDADO)**

En tu dashboard de Supabase:

1. Ve a **Settings** → **Edge Functions**
2. Busca la función `stripe-webhook`
3. **Deshabilita** la verificación JWT para esta función específica
4. **Habilita** JWT para otras funciones que lo necesiten

### **Opción 2: Configurar la función como pública**

La función ya está configurada para ser pública con CORS headers apropiados.

### **Opción 3: Usar Service Role Key (Implementado)**

La función usa `SUPABASE_SERVICE_ROLE_KEY` que tiene permisos completos sin verificación JWT.

## 🔧 **Configuración en Supabase Dashboard:**

### **Paso 1: Ir a Edge Functions**
1. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Edge Functions**

### **Paso 2: Configurar Stripe Webhook**
1. Busca la función `stripe-webhook`
2. Haz clic en **Settings** o **Configure**
3. **Deshabilita** "Require JWT verification"
4. **Guarda** los cambios

### **Paso 3: Verificar Configuración**
- La función debe aparecer como "Public" o sin JWT requerido
- Otras funciones pueden mantener JWT habilitado

## 🎯 **Configuración Recomendada:**

```
✅ stripe-webhook: JWT DESHABILITADO (pública)
✅ otras-funciones: JWT HABILITADO (protegidas)
```

## 🔍 **Verificar que Funcione:**

### **1. Probar Webhook de Stripe:**
- Ve a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
- Selecciona tu webhook
- Haz clic en **"Send test webhook"**
- Selecciona `customer.subscription.created`
- Envía el webhook de prueba

### **2. Verificar Logs:**
```bash
npx supabase functions logs stripe-webhook --project-ref hkbgryajkejgvmswglah
```

### **3. Verificar Base de Datos:**
- El usuario debe actualizarse con el plan correcto
- Los campos `plan_tier` y `plan_status` deben cambiar

## 🚨 **IMPORTANTE:**

### **Seguridad:**
- **NO** deshabilites JWT globalmente
- **SÍ** deshabilita JWT solo para `stripe-webhook`
- **MANTÉN** JWT habilitado para funciones que manejan usuarios

### **Por qué es Seguro:**
1. **Stripe verifica la firma** del webhook
2. **La función valida** el evento de Stripe
3. **Solo Stripe** puede enviar webhooks válidos
4. **No hay riesgo** de acceso no autorizado

## 📋 **Pasos Inmediatos:**

### **1. Ve a Supabase Dashboard:**
- Settings → Edge Functions
- Busca `stripe-webhook`
- Deshabilita JWT

### **2. Prueba el Webhook:**
- Envía webhook de prueba desde Stripe
- Verifica que llegue exitosamente

### **3. Verifica la Base de Datos:**
- El usuario debe actualizarse correctamente
- Los logs deben mostrar éxito

## 🔄 **Después de la Configuración:**

Una vez que deshabilites JWT para `stripe-webhook`:

1. **Stripe podrá enviar webhooks** sin problemas
2. **La función procesará** los eventos correctamente
3. **La base de datos se actualizará** con los planes
4. **Los usuarios verán** sus suscripciones activas

## ✅ **Resultado Esperado:**

```
✅ Webhook recibido sin error 401
✅ Usuario actualizado en la base de datos
✅ Plan activado correctamente
✅ Logs muestran éxito
```

---

## 🎯 **Resumen:**

**El problema es JWT habilitado en Supabase para la función `stripe-webhook`.**

**La solución es deshabilitar JWT solo para esa función específica.**

**Una vez hecho, el webhook funcionará perfectamente.**

¿Ya fuiste a Supabase Dashboard para deshabilitar JWT en la función `stripe-webhook`? 