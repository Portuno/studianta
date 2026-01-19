# 🎨 Reporte de Colorimetría - Studianta

## Paleta de Colores Base

### Colores Principales Definidos

| Color | Hex | RGB | Uso Principal |
|-------|-----|-----|---------------|
| **Rosa Sofisticado** | `#E35B8F` | rgb(227, 91, 143) | Color primario, botones activos, acentos |
| **Dorado Clásico** | `#D4AF37` | rgb(212, 175, 55) | Acentos dorados, elementos destacados |
| **Mauve Elegante** | `#8B5E75` | rgb(139, 94, 117) | Texto secundario, elementos deshabilitados |
| **Ciruela Oscuro** | `#4A233E` | rgb(74, 35, 62) | Texto principal modo diurno |
| **Rosa Claro** | `#F8C8DC` | rgb(248, 200, 220) | Bordes, elementos sutiles |
| **Fondo Rosado** | `#FFF0F5` | rgb(255, 240, 245) | Fondo principal modo diurno |
| **Fondo Rosado Alt** | `#FDEEF4` | rgb(253, 238, 244) | Variación de fondo |
| **Glass Pink** | `rgba(255, 245, 250, 0.92)` | rgba(255, 245, 250, 0.92) | Cards con efecto glass |

---

## 🌅 MODO DIURNO

### Fondos (Backgrounds)

#### Fondos Principales
- **Fondo de la aplicación**: `#FFF9FA` / `#FFF0F5`
  - Ubicación: `App.tsx`, área principal de contenido
  - Gradiente: `linear-gradient(135deg, #FFF0F5, #FDEEF4)` en `body`

#### Fondos de Componentes
- **Sidebar Desktop**: `glass-card` (rgba(255, 245, 250, 0.92))
  - Ubicación: `Navigation.tsx` (desktop)
  - Efecto: backdrop-filter blur(15px)
  
- **Top Bar Mobile**: `#FFF9FB`
  - Ubicación: `MobileTopBar.tsx`
  - Borde: `#F8C8DC` con opacidad 50%

- **Bottom Navigation Mobile**: `#FFF9FB`
  - Ubicación: `Navigation.tsx` (mobile)
  - Borde: `#F8C8DC`
  - Sombra: `rgba(74,35,62,0.15)`

- **Cards y Módulos**:
  - Cards glass: `rgba(255, 245, 250, 0.92)` con borde `#F8C8DC`
  - Headers de módulos: `rgba(255,240,245,0.4)` o `rgba(255,240,245,0.8)`
  - Backgrounds sutiles: `white/30`, `white/40`, `white/60`, `white/80`

### Textos

#### Texto Principal
- **Títulos principales**: `#4A233E` / `#2D1A26`
  - Ubicación: Headers de módulos, títulos principales
  - Ejemplos: Dashboard, Calculadora, Calendario, etc.

- **Texto secundario**: `#8B5E75`
  - Ubicación: Descripciones, subtítulos, texto de apoyo
  - Placeholders: `#8B5E75` con opacidad 50%

- **Texto en botones activos**: `white`
  - Ubicación: Botones con fondo `#E35B8F` o `#D4AF37`

### Bordes

- **Bordes principales**: `#F8C8DC`
  - Variaciones: `#F8C8DC/30`, `#F8C8DC/40`, `#F8C8DC/50`
  - Ubicación: Cards, inputs, separadores

- **Bordes dorados**: `#D4AF37`
  - Variaciones: `#D4AF37/10`, `#D4AF37/20`, `#D4AF37/30`, `#D4AF37/40`
  - Ubicación: Elementos destacados, calendario, acentos

### Botones y Elementos Interactivos

#### Botones Primarios
- **Botón activo principal**: `#E35B8F`
  - Texto: `white`
  - Ubicación: Botones de acción principal, navegación activa
  - Hover: `#E35B8F/90`

- **Botón dorado**: `#D4AF37`
  - Texto: `white` o `#2D1A26`
  - Ubicación: Botones de confirmación, acciones destacadas
  - Hover: `#D4AF37/90`

#### Botones Secundarios
- **Botón toggle tema**: `white/80`
  - Texto: `#4A233E`
  - Borde: `#F8C8DC`
  - Ubicación: Botón de cambio de tema

- **Botones hover**: `#FFD1DC/40` o `white/50`
  - Ubicación: Elementos de navegación en hover

### Elementos Específicos por Módulo

#### Dashboard
- Fondo: `#FFF9FA`
- Títulos: `#2D1A26`
- Texto secundario: `#8B5E75`
- Línea decorativa: `#D4AF37`

#### Calculadora
- Fondo principal: `#FFF0F5`
- Header: `rgba(255,240,245,0.4)`
- Tabs activos: `rgba(255,240,245,0.8)` con texto `#E35B8F`
- Tabs inactivos: `white/30` con texto `#8B5E75`

#### Calendario
- Día actual: `#D4AF37/5` (fondo), borde `#D4AF37/20`
- Días del mes: `#2D1A26`
- Días fuera del mes: `opacity-10`
- Botones: `#D4AF37` (fondo), `#E35B8F` (secundario)

#### Diario
- Fondo: `#FFF0F5`
- Texto principal: `#4A233E`
- Sello Studianta: Gradiente de `#E35B8F` a `#B8396A`
- Bordes laureles: `#D4AF37`

#### Enfoque (Focus)
- Fondo: `#FFF0F5`
- Temporizador activo: `#E35B8F`
- Botones: `#E35B8F` (primario), `#D4AF37` (secundario)

#### Oráculo
- Fondo: `#FFF9FB`
- Header: `white/60` con borde `#D4AF37/40`
- Título: `#4A233E`
- Mensajes usuario: `#E35B8F`
- Mensajes IA: `white` con fondo `#2D1A26`

#### Navegación (Sidebar Desktop)
- Módulo activo: `#E35B8F` con texto `white`
- Módulo inactivo: `#8B5E75` con hover `#FFD1DC/40`
- Botón Oráculo activo: `#E35B8F`
- Botón Oráculo inactivo: `#2D1A26` con texto `#D4AF37`
- Perfil activo: `#E35B8F`
- Perfil inactivo: `white/60` con borde `#F8C8DC`

#### Navegación Mobile (Bottom Bar)
- Fondo: `#FFF9FB`
- Borde superior: `#F8C8DC`
- Botón Atanor: `#E35B8F` (siempre activo)
- Módulos activos: `#E35B8F` con escala 105%
- Módulos inactivos: `#8B5E75`

---

## 🌙 MODO NOCTURNO

### Fondos (Backgrounds)

#### Fondos Principales
- **Fondo de la aplicación**: `#1A1A2E`
  - Ubicación: `App.tsx`, área principal de contenido
  - RGB: rgb(26, 26, 46)

#### Fondos de Componentes
- **Sidebar Desktop**: `rgba(26,26,46,0.95)`
  - Ubicación: `Navigation.tsx` (desktop)
  - Borde: `#A68A56/40`
  - Sombra: `rgba(199,125,255,0.2)`

- **Top Bar Mobile**: `#151525`
  - Ubicación: `MobileTopBar.tsx`
  - Borde: `#A68A56/40`
  - RGB: rgb(21, 21, 37)

- **Bottom Navigation Mobile**: `#151525`
  - Ubicación: `Navigation.tsx` (mobile)
  - Borde: `#A68A56/40`
  - Sombra: `rgba(199,125,255,0.2)`

- **Cards y Módulos**:
  - Cards principales: `rgba(48,43,79,0.6)` o `rgba(48,43,79,0.4)`
  - Headers: `rgba(48,43,79,0.4)` o `rgba(48,43,79,0.6)`
  - Backgrounds sutiles: `rgba(48,43,79,0.3)`, `rgba(48,43,79,0.8)`
  - RGB de base: rgb(48, 43, 79)

### Textos

#### Texto Principal
- **Títulos principales**: `#E0E1DD`
  - Ubicación: Headers de módulos, títulos principales
  - RGB: rgb(224, 225, 221)
  - Ejemplos: Dashboard, Calculadora, Calendario, etc.

- **Texto secundario**: `#7A748E`
  - Ubicación: Descripciones, subtítulos, texto de apoyo
  - RGB: rgb(122, 116, 142)
  - Placeholders: `#7A748E/50`

- **Texto en botones activos**: `white`
  - Ubicación: Botones con fondo `#C77DFF` o `#A68A56`

### Bordes

- **Bordes principales**: `#A68A56`
  - Variaciones: `#A68A56/10`, `#A68A56/20`, `#A68A56/30`, `#A68A56/40`
  - RGB: rgb(166, 138, 86)
  - Ubicación: Cards, inputs, separadores

- **Bordes morados**: `#C77DFF`
  - Variaciones: `#C77DFF/20`, `#C77DFF/30`
  - RGB: rgb(199, 125, 255)
  - Ubicación: Elementos destacados, acentos especiales

### Botones y Elementos Interactivos

#### Botones Primarios
- **Botón activo principal**: `#C77DFF`
  - Texto: `white`
  - Ubicación: Botones de acción principal, navegación activa
  - Sombra: `rgba(199,125,255,0.3)` o `rgba(199,125,255,0.2)`
  - Hover: `#B56DE6`

- **Botón dorado nocturno**: `#A68A56`
  - Texto: `white` o `#E0E1DD`
  - Ubicación: Botones de confirmación, acciones destacadas
  - Hover: `#A68A56` (más opaco)

#### Botones Secundarios
- **Botón toggle tema**: `rgba(48,43,79,0.6)`
  - Texto: `#A68A56`
  - Borde: `#A68A56/40`
  - Ubicación: Botón de cambio de tema

- **Botones hover**: `rgba(48,43,79,0.4)` o `rgba(48,43,79,0.5)`
  - Ubicación: Elementos de navegación en hover

### Elementos Específicos por Módulo

#### Dashboard
- Fondo: `#1A1A2E`
- Títulos: `#E0E1DD`
- Texto secundario: `#7A748E`
- Línea decorativa: `#D4AF37` (mantiene el dorado)

#### Calculadora
- Fondo principal: `#1A1A2E`
- Header: `rgba(48,43,79,0.4)`
- Tabs activos: `rgba(48,43,79,0.6)` con texto `#C77DFF`
- Tabs inactivos: `rgba(48,43,79,0.3)` con texto `#7A748E`

#### Calendario
- Día actual: `rgba(166,138,86,0.15)` (fondo), borde `#A68A56/20`
- Días del mes: `#E0E1DD` (día actual), `#7A748E` (otros días)
- Días fuera del mes: `opacity-10` con `#7A748E`
- Botones: `#A68A56` (fondo), `#C77DFF` (secundario)

#### Diario
- Fondo: `#1A1A2E`
- Texto principal: `#E0E1DD`
- Sello Studianta: Mantiene gradiente (visible sobre fondo oscuro)
- Bordes: `#A68A56`

#### Enfoque (Focus)
- Fondo: `#1A1A2E`
- Temporizador activo: `#C77DFF`
- Botones: `#C77DFF` (primario), `#A68A56` (secundario)

#### Oráculo
- Fondo: `#1A1A2E`
- Header: `rgba(48,43,79,0.6)` con borde `#A68A56/40`
- Título: `#E0E1DD`
- Mensajes usuario: `#C77DFF`
- Mensajes IA: `white` con fondo `rgba(48,43,79,0.95)`

#### Navegación (Sidebar Desktop)
- Módulo activo: `#C77DFF` con texto `white` y sombra `rgba(199,125,255,0.2)`
- Módulo inactivo: `#7A748E` con hover `rgba(48,43,79,0.4)`
- Módulo bloqueado: `#7A748E/30` con grayscale
- Botón Oráculo activo: `#C77DFF` con sombra `rgba(199,125,255,0.3)`
- Botón Oráculo inactivo: `rgba(48,43,79,0.6)` con texto `#A68A56` y borde `#A68A56/40`
- Perfil activo: `#C77DFF`
- Perfil inactivo: `rgba(48,43,79,0.6)` con borde `#A68A56/40`

#### Navegación Mobile (Bottom Bar)
- Fondo: `#151525`
- Borde superior: `#A68A56/40`
- Botón Atanor: `#E35B8F` (mantiene color rosa)
- Módulos activos: `#E35B8F` con escala 105%
- Módulos inactivos: `#8B5E75` (mantiene color mauve)

---

## 🎯 Colores por Categoría de Uso

### Colores de Estado

#### Modo Diurno
- **Éxito/Confirmación**: `#D4AF37` (dorado)
- **Acción principal**: `#E35B8F` (rosa sofisticado)
- **Información**: `#8B5E75` (mauve)
- **Deshabilitado**: `#8B5E75/30` con grayscale

#### Modo Nocturno
- **Éxito/Confirmación**: `#A68A56` (dorado nocturno)
- **Acción principal**: `#C77DFF` (morado/púrpura)
- **Información**: `#7A748E` (gris púrpura)
- **Deshabilitado**: `#7A748E/30` con grayscale

### Colores de Balanza (Finanzas)

#### Ingresos
- **Sueldo**: `#D4AF37` (diurno) / `#A68A56` (nocturno)
- **Ventas**: `#E35B8F` (diurno) / `#C77DFF` (nocturno)
- **Mesada**: `#8B5E75` (diurno) / `#7A748E` (nocturno)
- **Becas**: `#F8C8DC` (diurno) / `#A68A56` (nocturno)
- **Regalos**: `#D4AF37` (diurno) / `#C77DFF` (nocturno)

#### Egresos
- **Comida**: `#E35B8F` (diurno) / `#C77DFF` (nocturno)
- **Transporte**: `#8B5E75` (diurno) / `#7A748E` (nocturno)
- **Facultad**: `#D4AF37` (diurno) / `#A68A56` (nocturno)
- **Hogar**: `#F8C8DC` (diurno) / `#C77DFF` (nocturno)
- **Entretenimiento**: `#E35B8F` (ambos modos)
- **Salud**: `#8B5E75` (diurno) / `#7A748E` (nocturno)

### Colores de Estados de Ánimo (Diario)

- **Radiante**: Gradiente `#FFD700` → `#FFA500` → `#FF6347`
- **Enfocada**: Gradiente `#9370DB` → `#BA55D3` → `#E35B8F`
- **Equilibrada**: Gradiente `#87CEEB` → `#9370DB` → `#8B5E75`
- **Agotada**: Gradiente `#4A233E` → `#6B4C7A` → `#8B5E75`
- **Estresada**: Gradiente `#FFD700` → `#FF6347` → `#E35B8F`

---

## 📐 Variables CSS y Tailwind

### Variables CSS Definidas (`src/index.css`)

```css
:root {
  --color-rosy-bg: #FFF0F5;
  --color-rosy-bg-alt: #FDEEF4;
  --color-plum: #4A233E;
  --color-mauve: #8B5E75;
  --color-sophisticated-pink: #E35B8F;
  --color-gold: #D4AF37;
  --color-border-pink: #F8C8DC;
  --color-glass-pink: rgba(255, 245, 250, 0.92);
}
```

### Colores Tailwind Extendidos (`tailwind.config.js`)

```javascript
colors: {
  'rosy-bg': '#FFF0F5',
  'rosy-bg-alt': '#FDEEF4',
  'plum': '#4A233E',
  'mauve': '#8B5E75',
  'sophisticated-pink': '#E35B8F',
  'gold': '#D4AF37',
  'border-pink': '#F8C8DC',
  'glass-pink': 'rgba(255, 245, 250, 0.92)',
}
```

### Constantes TypeScript (`constants.tsx`)

```typescript
export const COLORS = {
  primary: '#E35B8F',
  gold: '#D4AF37',
  mauve: '#8B5E75',
  dark: '#4A233E',
  light: '#F8C8DC',
};
```

---

## 🎨 Efectos Visuales

### Glass Morphism
- **Clase CSS**: `.glass-card`
- **Fondo**: `rgba(255, 245, 250, 0.92)`
- **Backdrop Filter**: `blur(15px)`
- **Borde**: `1px solid #F8C8DC`
- **Uso**: Cards principales, modales, elementos flotantes

### Sombras

#### Modo Diurno
- **Sombra estándar**: `rgba(74,35,62,0.15)`
- **Sombra dorada**: `rgba(212,175,55,0.3)` o `rgba(212,175,55,0.4)`
- **Sombra rosa**: `rgba(227,91,143,0.4)`

#### Modo Nocturno
- **Sombra morada**: `rgba(199,125,255,0.2)` o `rgba(199,125,255,0.3)`
- **Sombra dorada**: `rgba(166,138,86,0.5)`

### Scrollbars

#### Modo Diurno
- **Thumb**: `#F8C8DC`
- **Track**: `rgba(248, 200, 220, 0.1)`

#### Modo Nocturno
- **Thumb**: `rgba(212, 175, 55, 0.4)`
- **Track**: `rgba(248, 200, 220, 0.1)`
- **Hover thumb**: `rgba(212, 175, 55, 0.6)`

---

## 🔄 Transiciones

Todos los cambios de color incluyen transiciones suaves:
- **Duración**: `duration-500` (500ms)
- **Easing**: `transition-colors`
- **Aplicación**: Fondos, textos, bordes en cambio de tema

---

## 📱 Responsive Considerations

Los colores se mantienen consistentes en todas las resoluciones:
- **Mobile**: Mismos colores, ajustes de opacidad para legibilidad
- **Tablet**: Sin cambios de color
- **Desktop**: Mismos colores, efectos adicionales de hover

---

## 🎯 Resumen de Paletas

### Modo Diurno - Paleta Principal
- **Primario**: `#E35B8F` (Rosa Sofisticado)
- **Secundario**: `#D4AF37` (Dorado Clásico)
- **Terciario**: `#8B5E75` (Mauve Elegante)
- **Fondo**: `#FFF0F5` / `#FFF9FA`
- **Texto**: `#4A233E` / `#2D1A26`

### Modo Nocturno - Paleta Principal
- **Primario**: `#C77DFF` (Morado/Púrpura)
- **Secundario**: `#A68A56` (Dorado Nocturno)
- **Terciario**: `#7A748E` (Gris Púrpura)
- **Fondo**: `#1A1A2E` / `#151525`
- **Texto**: `#E0E1DD`

---

*Documento generado para Studianta - Santuario de Conocimiento*
*Última actualización: Diciembre 2024*
