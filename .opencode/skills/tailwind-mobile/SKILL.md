---
name: tailwind-mobile
description: Use when writing or reviewing Tailwind CSS styles for tutorNow. Covers mobile-first approach, rem units, BEM fallback, design tokens, and responsive conventions.
---

# Tailwind CSS + Mobile First Conventions - tutorNow

## Approach
- **Mobile First**: estilos base siempre para mobile
- **Desktop**: `@media (min-width: ...)` vía breakpoints de Tailwind
- **Unidades**: `rem` para tipografía y espaciado, nunca `px`

## Breakpoints Tailwind
```css
sm: 640px    /* Large phones */
md: 768px    /* Tablets */
lg: 1024px   /* Small desktops */
xl: 1280px   /* Desktops */
2xl: 1536px  /* Large screens */
```

## Uso de rem
```html
<!-- Correcto: usar rem via Tailwind -->
<h1 class="text-2xl">Título</h1>           /* 1.5rem = 24px */
<p class="text-base">Párrafo</p>             /* 1rem = 16px */
<div class="p-4">Padding</div>               /* 1rem = 16px -->

<!-- Incorrecto: usar px directamente -->
<h1 style="font-size: 24px">Título</h1>
```

## Mobile First Pattern
```html
<!-- Base: mobile -->
<div class="grid grid-cols-1 gap-4 p-4">

  <!-- Tablet: 2 columnas -->
  <div class="md:grid-cols-2">

    <!-- Desktop: 3 columnas -->
    <div class="lg:grid-cols-3">
    </div>
  </div>
</div>
```

## BEM - Solo cuando no se usa Tailwind
Si un componente requiere estilos custom que Tailwind no puede expresar limpiamente:
```css
/* auth-form.css */
.auth-form { }
.auth-form__field { }
.auth-form__field--error { }
.auth-form__submit { }
```
En todos los demás casos, usar Tailwind directamente.

## Componentes reutilizables
- **Nunca** redefinir estilos que ya existen en un componente
- **Solo** agregar clases de layout al usar componentes base
```tsx
// Correcto: extender con layout
<Card className="w-full max-w-md mx-auto">
  <CardContent className="space-y-4">
    ...
  </CardContent>
</Card>

// Incorrecto: redefinir estilos del Card
<Card className="bg-white border rounded-lg shadow-sm p-6">
```

## Design Tokens (CSS Variables)
```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #7c3aed;
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #f59e0b;
  --spacing-section: 4rem;
  --radius-default: 0.5rem;
}
```
Referenciar en Tailwind config para uso consistente.

## Transiciones
- Toda interacción visible debe tener transición
- Prefijo `transition` de Tailwind:
```html
<button class="transition-colors duration-200 hover:bg-blue-600">
  ...
</button>
```

## Espaciado consistente
- **Secciones**: `py-8` o `py-12` (2rem / 3rem)
- **Cards**: `p-4` o `p-6` (1rem / 1.5rem)
- **Inputs**: `px-3 py-2` (0.75rem / 0.5rem)
- **Gaps**: `gap-2` a `gap-6` según contexto
- **Entre elementos**: `space-y-4` o `gap-4`

## Formularios
- Inputs con `text-base` para确保 tamaño legible en mobile
- `min-h-[44px]` para touch targets accesibles
- Labels siempre visibles (no solo placeholder)
- Estados: focus, error, disabled claros

## Reglas
- Sin comentarios ni emojis en el código
- Preferir utility classes sobre custom CSS
- No usar `@apply` excesivamente
- Mobile first siempre
