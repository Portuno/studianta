# Fix para Edge Function: create-checkout-session

## Problema Identificado

La función edge `create-checkout-session` está usando incorrectamente el **Product ID** (`prod_TpNYbWp1N8BZUH`) donde debería usar el **Price ID** (`price_...`).

### Error Actual
```
Stripe API error: 400 - {
  "error": {
    "code": "resource_missing",
    "message": "No such price: 'prod_TpNYbWp1N8BZUH'",
    "param": "line_items[0][price]",
    "type": "invalid_request_error"
  }
}
```

## Solución

La función edge debe usar la variable de entorno `STRIPE_PRICE_ID` en lugar de hardcodear el Product ID.

### Código que necesita corrección

En la función edge `create-checkout-session`, busca donde se crea el checkout session de Stripe y asegúrate de que use:

```typescript
const priceId = Deno.env.get('STRIPE_PRICE_ID');

if (!priceId) {
  return new Response(
    JSON.stringify({ error: 'STRIPE_PRICE_ID not configured' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

// En lugar de usar prod_TpNYbWp1N8BZUH directamente, usa:
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: priceId, // ✅ Usar Price ID desde variable de entorno
      quantity: 1,
    },
  ],
  // ... resto de la configuración
});
```

### Verificación

1. Ve a Stripe Dashboard > Products
2. Busca el producto `prod_TpNYbWp1N8BZUH`
3. Copia el **Price ID** asociado (formato `price_...`)
4. Configura `STRIPE_PRICE_ID` en Supabase Edge Functions Secrets con ese valor
5. Asegúrate de que la función edge lea esta variable de entorno

## Estado Actual

- ✅ **Autenticación**: Funcionando correctamente (error cambió de 401 a 500)
- ❌ **Edge Function**: Usa Product ID en lugar de Price ID
- ⚠️ **Variable de entorno**: `STRIPE_PRICE_ID` debe estar configurada en Supabase

## Notas

- El Product ID (`prod_TpNYbWp1N8BZUH`) es correcto según el README
- El Price ID debe obtenerse del Stripe Dashboard para el producto mencionado
- La función debe leer `STRIPE_PRICE_ID` de las variables de entorno de Supabase
