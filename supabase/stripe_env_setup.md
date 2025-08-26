# 🔑 Configuración de Variables de Entorno para Stripe

## 📋 Variables Requeridas

Para que el webhook de Stripe funcione correctamente, necesitas configurar estas variables en tu proyecto de Supabase:

### **1. STRIPE_SECRET_KEY**
```bash
# Clave secreta de Stripe (empieza con sk_test_ o sk_live_)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### **2. STRIPE_WEBHOOK_SECRET**
```bash
# Clave secreta del webhook (empieza con whsec_)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### **3. STRIPE_BASIC_PRICE_ID**
```bash
# ID del precio del plan básico (empieza con price_)
supabase secrets set STRIPE_BASIC_PRICE_ID=price_...
```

### **4. STRIPE_PRO_PRICE_ID**
```bash
# ID del precio del plan pro (empieza con price_)
supabase secrets set STRIPE_PRO_PRICE_ID=price_...
```

## 🚀 Pasos para Configurar

### **Opción 1: Usando Supabase CLI**
```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login en Supabase
supabase login

# Navegar a tu proyecto
cd tu-proyecto

# Configurar variables
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_BASIC_PRICE_ID=price_...
supabase secrets set STRIPE_PRO_PRICE_ID=price_...
```

### **Opción 2: Usando Dashboard de Supabase**
1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Edge Functions**
4. En la sección **Environment Variables**, agrega cada variable

### **Opción 3: Usando .env.local (solo desarrollo)**
```bash
# Crear archivo .env.local en la raíz del proyecto
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

## 🔍 Cómo Obtener las Claves

### **STRIPE_SECRET_KEY**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copia la **Secret key** (empieza con `sk_test_` o `sk_live_`)

### **STRIPE_WEBHOOK_SECRET**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Crea un nuevo webhook o selecciona uno existente
3. Copia la **Signing secret** (empieza con `whsec_`)

### **STRIPE_BASIC_PRICE_ID y STRIPE_PRO_PRICE_ID**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Selecciona tu producto
3. En la pestaña **Pricing**, copia el **Price ID** (empieza con `price_`)

## ✅ Verificar Configuración

Después de configurar las variables, puedes verificar que estén funcionando:

```bash
# Listar variables configuradas
supabase secrets list

# Ver logs del webhook
supabase functions logs stripe-webhook
```

## 🚨 Solución de Problemas

### **Error 401: Unauthorized**
- Verifica que `STRIPE_SECRET_KEY` esté configurada correctamente
- Asegúrate de que la clave no tenga espacios extra

### **Error 400: Bad Signature**
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcta
- Asegúrate de que el webhook en Stripe apunte a la URL correcta

### **Error: Missing Environment Variables**
- Ejecuta `supabase secrets list` para ver qué variables están configuradas
- Verifica que todas las variables requeridas estén presentes

## 🔗 URLs del Webhook

### **Desarrollo (Local)**
```
http://localhost:54321/functions/v1/stripe-webhook
```

### **Producción**
```
https://tu-proyecto.supabase.co/functions/v1/stripe-webhook
```

## 📝 Notas Importantes

- **Nunca** compartas las claves secretas
- **Usa** `sk_test_` para desarrollo y `sk_live_` para producción
- **Verifica** que el webhook esté configurado en Stripe Dashboard
- **Prueba** el webhook usando el modo test de Stripe

## 🧪 Probar el Webhook

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Selecciona tu webhook
3. Haz clic en **Send test webhook**
4. Selecciona el evento `checkout.session.completed`
5. Envía el webhook de prueba
6. Verifica los logs en Supabase

---

## 🎯 Próximos Pasos

1. **Configura** todas las variables de entorno
2. **Verifica** que el webhook funcione con eventos de prueba
3. **Prueba** un pago real en modo test
4. **Verifica** que la base de datos se actualice correctamente
5. **Monitorea** los logs para detectar problemas

¡Con estas variables configuradas, tu webhook de Stripe debería funcionar perfectamente! 🎉 