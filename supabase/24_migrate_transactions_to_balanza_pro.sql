    -- ============================================
    -- MIGRACIÓN: transactions → balanza_pro_transactions
    -- Descripción: Migra todos los datos de la tabla transactions antigua a balanza_pro_transactions
    -- ============================================

    -- Migrar todos los registros de transactions a balanza_pro_transactions
    -- Mapeo de campos:
    --   type: 'Gasto' → 'Egreso', 'Ingreso' → 'Ingreso'
    --   category → payment_method
    --   description → description
    --   amount → amount
    --   date → date
    --   Valores por defecto: is_extra = false, is_recurring = false, tags = [], status = 'Completado'

    INSERT INTO public.balanza_pro_transactions (
    user_id,
    type,
    amount,
    payment_method,
    is_extra,
    is_recurring,
    tags,
    status,
    description,
    date,
    created_at,
    updated_at
    )
    SELECT 
    user_id,
    CASE 
        WHEN type = 'Gasto' THEN 'Egreso'
        WHEN type = 'Ingreso' THEN 'Ingreso'
        ELSE 'Egreso' -- Por defecto si hay algún valor inesperado
    END as type,
    amount,
    category as payment_method,
    false as is_extra,
    false as is_recurring,
    '[]'::jsonb as tags,
    'Completado' as status,
    description,
    date,
    created_at,
    updated_at
    FROM public.transactions
    WHERE NOT EXISTS (
    -- Evitar duplicados: verificar si ya existe una transacción con los mismos datos
    SELECT 1 
    FROM public.balanza_pro_transactions bpt
    WHERE bpt.user_id = transactions.user_id
        AND bpt.amount = transactions.amount
        AND bpt.date = transactions.date
        AND bpt.description = transactions.description
        AND bpt.type = CASE 
        WHEN transactions.type = 'Gasto' THEN 'Egreso'
        WHEN transactions.type = 'Ingreso' THEN 'Ingreso'
        ELSE 'Egreso'
        END
    );

    -- Nota: Después de verificar que la migración fue exitosa, 
    -- puedes eliminar la tabla transactions si lo deseas con:
    -- DROP TABLE IF EXISTS public.transactions CASCADE;
