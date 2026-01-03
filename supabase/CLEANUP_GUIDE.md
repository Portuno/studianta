# 🧹 Guía de Limpieza - Eliminar Todas las Tablas

## ⚠️ ADVERTENCIA

Estos scripts eliminarán **TODAS las tablas, datos, funciones y políticas** de tu base de datos. **Esta acción NO se puede deshacer**.

## 📋 Opciones Disponibles

### Opción 1: Script Simple (Recomendado)
**Archivo:** `99_drop_all_simple.sql`

- Elimina todas las tablas con CASCADE
- Elimina todas las funciones
- Más rápido y simple
- Muestra mensajes de progreso

**Uso:**
1. Abre el SQL Editor en Supabase
2. Copia y pega el contenido de `99_drop_all_simple.sql`
3. Ejecuta el script
4. Verifica que el resultado muestre `tablas_restantes: 0`

### Opción 2: Script Detallado
**Archivo:** `99_drop_all_tables.sql`

- Elimina en orden específico
- Más control sobre el proceso
- Muestra qué tablas quedan (si hay alguna)

**Uso:**
1. Abre el SQL Editor en Supabase
2. Copia y pega el contenido de `99_drop_all_tables.sql`
3. Ejecuta el script
4. Revisa los mensajes NOTICE para ver el progreso

## ✅ Verificación Post-Limpieza

Después de ejecutar cualquiera de los scripts, verifica con:

```sql
-- Verificar tablas restantes
SELECT COUNT(*) as tablas_restantes
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- Debería retornar 0
```

```sql
-- Ver todas las tablas que quedan (si hay alguna)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## 🔄 Después de la Limpieza

Una vez eliminadas todas las tablas, puedes:

1. **Ejecutar el esquema completo de nuevo:**
   - `01_complete_schema.sql`
   - `02_rls_policies.sql`
   - `03_storage_buckets.sql`
   - `04_integration_auth_users.sql` (opcional)

2. **O empezar con un esquema personalizado**

## 🆘 Problemas Comunes

### Error: "cannot drop table X because other objects depend on it"
- **Solución:** Usa el script `99_drop_all_simple.sql` que usa CASCADE automáticamente

### Error: "permission denied"
- **Solución:** Asegúrate de estar ejecutando como administrador del proyecto

### Algunas tablas no se eliminan
- **Solución:** Ejecuta el script de nuevo, o elimínalas manualmente:
  ```sql
  DROP TABLE nombre_tabla CASCADE;
  ```

## 💡 Nota sobre Storage

Los scripts **NO eliminan** los buckets de Storage. Si quieres eliminarlos también:

1. Ve a **Storage** en el dashboard de Supabase
2. Elimina manualmente los buckets:
   - `avatars`
   - `study-materials`
   - `journal-photos`
   - `community-resources`
   - `community-assets`

O ejecuta:
```sql
-- Eliminar buckets de Storage
DELETE FROM storage.buckets WHERE id IN (
  'avatars',
  'study-materials',
  'journal-photos',
  'community-resources',
  'community-assets'
);
```

