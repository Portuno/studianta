# Actualización de Modo Nocturno - Paleta Aquelarre Arcano

## Colores a reemplazar:

### Textos:
- `text-[#4A233E]` → `isNightMode ? 'text-[#E0E1DD]' : 'text-[#4A233E]'`
- `text-[#8B5E75]` → `isNightMode ? 'text-[#7A748E]' : 'text-[#8B5E75]'`

### Fondos:
- `bg-[#FFF...]` → `isNightMode ? 'bg-[#1A1A2E]' : 'bg-[#FFF...]'`
- `glass-card` → `isNightMode ? 'bg-[rgba(48,43,79,0.6)] backdrop-blur-[15px] border border-[#A68A56]/40' : 'glass-card'`

### Bordes:
- `border-[#F8C8DC]` → `isNightMode ? 'border-[#A68A56]/40' : 'border-[#F8C8DC]'`
- `border-[#D4AF37]` → `isNightMode ? 'border-[#A68A56]' : 'border-[#D4AF37]'`

### Botones activos:
- `bg-[#E35B8F]` → `isNightMode ? 'bg-[#C77DFF]' : 'bg-[#E35B8F]'`
