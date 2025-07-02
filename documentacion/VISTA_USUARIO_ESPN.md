# Vista Usuario - Interfaz Tipo ESPN

## Descripción
Implementación de una interfaz moderna tipo ESPN para usuarios del periódico deportivo "Tiempo Adicional", utilizando la paleta de colores definida y respetando las restricciones de contenido según el rol del usuario.

## Características Principales

### 🎨 **Diseño Visual**
- **Estilo ESPN moderno** con adaptación a la identidad de "Tiempo Adicional"
- **Paleta de colores** de `styles.scss` totalmente integrada:
  - Verde Selva (`#1a8000`) - Color primario
  - Verde Lima (`#b4ff15`) - Color de acento
  - Verde Bosque (`#045204`) - Color de énfasis
  - Purpura Real (`#3e0ea4`) - Color secundario
- **Tipografía** coherente usando 'Anton' para títulos y 'League Spartan' para texto

### 📱 **Responsive Design**
- **Mobile First**: Adaptado para todos los dispositivos
- **Breakpoints**:
  - Móvil: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
  - Desktop XL: > 1400px
- **Navegación adaptativa** con tabs en móvil

### 🔒 **Sistema de Restricciones**

#### **Usuarios NO Registrados:**
- ✅ **10 noticias** máximo visibles
- ✅ **8 eventos** máximo visibles  
- ✅ **6 partidos** máximo visibles
- ❌ Contenido adicional **bloqueado** con overlay
- 🔔 **Call-to-Action** para registro

#### **Usuarios Registrados:**
- ✅ **Acceso completo** a todas las noticias
- ✅ **Acceso completo** a todos los eventos
- ✅ **Acceso completo** a partidos y liga
- ✅ **Sin restricciones** de contenido

## Estructura de Componentes

### **📰 Hero Section**
```html
- Noticia principal destacada
- Imagen de fondo con overlay
- Título principal estilo ESPN
- Botón de acción "Leer Completa"
- Chip de sección deportiva
```

### **🏆 Navegación Deportiva**
```html
- Tabs por categorías deportivas:
  ⚽ Fútbol | 🏀 Basketball | 🎾 Tenis | 🏐 Volleyball
- Estilo ESPN con indicador verde
- Responsive con scrolling horizontal en móvil
```

### **📰 Grid de Noticias**
```html
- Layout tipo Pinterest/ESPN
- Cards con imagen, título, resumen
- Indicadores de sección
- Overlay de bloqueo para contenido restringido
- Animaciones hover suaves
```

### **📅 Sidebar de Eventos**
```html
- Lista vertical de próximos eventos
- Fecha destacada estilo calendario
- Información de competición y ubicación
- Indicadores de contenido bloqueado
```

### **⚽ Sección de Partidos**
```html
- Partidos en vivo y próximos
- Marcadores en tiempo real
- Estados: "En Vivo", "Próximo", "Finalizado"
- Chips de estado con colores temáticos
```

### **🏆 Liga Colombiana**
```html
- Tabla de posiciones resumida
- Top 5 equipos con puntos
- Botón para ver tabla completa
- Integración con API de liga
```

## Funcionalidades Implementadas

### **🔐 Control de Acceso**
```typescript
// Verificación de límites
private verificarLimites(): void {
  const estaAutenticado = this.authService.estaAutenticado();
  
  if (!estaAutenticado) {
    // Aplicar límites de contenido
    this.aplicarLimitesContenido();
  }
}

// Manejo de contenido bloqueado
verNoticia(noticia: NoticiaLimitada): void {
  if (noticia.bloqueada) {
    this.mostrarMensajeRegistro('noticias');
    return;
  }
  // Navegar a la noticia
}
```

### **📊 Carga de Contenido**
```typescript
// Servicios integrados
- NoticiasService: Obtención de noticias públicas
- EventosService: Obtención de eventos próximos  
- PartidosService: Datos de partidos en tiempo real
- LigaService: Tabla de posiciones y estadísticas
```

### **🎯 Call-to-Action**
```typescript
// Promoción de registro
private mostrarMensajeRegistro(tipo: string): void {
  this.snackBar.open(
    `¡Regístrate para ver más ${tipo}!`, 
    'Registrarse',
    {
      duration: 5000,
      action: () => this.router.navigate(['/auth/register'])
    }
  );
}
```

## Elementos de UX/UI

### **🎨 Paleta de Colores Aplicada**
```scss
// Hero Section
background: linear-gradient(135deg, var(--verde-selva), var(--verde-bosque));

// Chips de sección
background: var(--verde-lima);
color: var(--verde-bosque);

// Call-to-Action
background: linear-gradient(135deg, var(--purpura-real), var(--purpura-profundo));

// Estados de partidos
.en-vivo { background: var(--verde-lima); }
.proximo { background: var(--purpura-real); }
.finalizado { background: var(--gris-carbon); }
```

### **📱 Animaciones y Transiciones**
```scss
// Hover effects en cards
&:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

// Transiciones suaves
transition: all var(--transition-fast);

// Efectos de imagen
.card-image img {
  transition: transform var(--transition-fast);
  
  &:hover {
    transform: scale(1.05);
  }
}
```

### **🔒 Indicadores de Contenido Bloqueado**
```scss
.bloqueada {
  opacity: 0.7;
  
  .block-overlay {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    .lock-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
  }
}
```

## Integración con Backend

### **🔌 Endpoints Utilizados**
```typescript
// Según documentación de permisos USUARIO:
GET /api/noticias/publicas          // Noticias públicas limitadas
GET /api/eventos/proximos           // Eventos próximos limitados  
GET /api/partidos/**                // Partidos completos (público)
GET /api/liga-colombiana/**         // Liga completa (público)
```

### **📊 Estados de Carga**
```typescript
// Loading states
cargandoNoticias: boolean = true;
cargandoEventos: boolean = true;
cargandoPartidos: boolean = true;

// Error handling
errorNoticias: string | null = null;
errorEventos: string | null = null;
```

## Próximos Pasos

### **🚀 Funcionalidades Pendientes**
1. **Integración real** con API de partidos
2. **Sistema de comentarios** para noticias (usuarios registrados)
3. **Notificaciones push** para partidos en vivo
4. **Favoritos** para equipos y competiciones
5. **Búsqueda avanzada** de contenido
6. **Modo oscuro** alternativo

### **📈 Mejoras de UX**
1. **Lazy loading** para imágenes
2. **Infinite scroll** para noticias
3. **Filtros dinámicos** por categoría
4. **PWA** capabilities
5. **Offline mode** básico

## Archivos Creados

### **Componente Principal**
- `src/app/shared/vista/vista.component.ts` - Lógica del componente
- `src/app/shared/vista/vista.component.html` - Template ESPN-style
- `src/app/shared/vista/vista.component.scss` - Estilos responsive

### **Integración Requerida**
- Actualizar `app.routes.ts` con ruta pública
- Crear header específico para usuarios
- Configurar guards para contenido premium

---

**Fecha:** 2 de julio de 2025  
**Versión:** 1.0  
**Autor:** GitHub Copilot
