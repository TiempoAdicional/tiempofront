# Cambios Necesarios en el Backend para Secciones

## Resumen
Se ha implementado un sistema de secciones que permite asignar automáticamente noticias, eventos y partidos a las secciones correspondientes. Este documento describe los cambios que deben realizarse en el backend para soportar esta funcionalidad.

## 📋 Cambios Requeridos en Base de Datos

### 1. Tabla de Secciones
Si no existe, crear la tabla `secciones`:

```sql
CREATE TABLE secciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo ENUM('NOTICIAS', 'EVENTOS', 'PARTIDOS') NOT NULL,
    orden INT NOT NULL DEFAULT 1,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Agregar seccion_id a las tablas existentes

**Tabla eventos:**
```sql
ALTER TABLE eventos ADD COLUMN seccion_id INT NULL;
ALTER TABLE eventos ADD FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL;
```

**Tabla noticias:**
```sql
ALTER TABLE noticias ADD COLUMN seccion_id INT NULL;
ALTER TABLE noticias ADD FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL;
```

**Tabla partidos:**
```sql
ALTER TABLE partidos ADD COLUMN seccion_id INT NULL;
ALTER TABLE partidos ADD FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE SET NULL;
```

## 🔧 Cambios en Endpoints del Backend

### 1. API de Secciones (ya implementado en el frontend)

**Base URL:** `/api/secciones`

```php
// GET /api/secciones - Listar todas las secciones
// POST /api/secciones/crear - Crear nueva sección
// GET /api/secciones/{id} - Obtener sección por ID
// PUT /api/secciones/actualizar/{id} - Actualizar sección
// DELETE /api/secciones/{id} - Eliminar sección
// PUT /api/secciones/reordenar - Reordenar secciones
// PATCH /api/secciones/{id}/estado - Cambiar estado activa/inactiva
// GET /api/secciones/vista-previa - Vista previa del periódico completo
// GET /api/secciones/activas/contenido - Secciones activas con contenido
```

### 2. Modificaciones en APIs Existentes

**A. API de Eventos**
```php
// POST /api/eventos/crear
// Agregar soporte para recibir seccionId en FormData
// Si no se proporciona seccionId, buscar automáticamente la sección tipo 'EVENTOS'

// Ejemplo en controlador:
$seccionId = $request->get('seccionId');
if (!$seccionId) {
    $seccionEventos = Seccion::where('tipo', 'EVENTOS')
                              ->where('activa', true)
                              ->first();
    $seccionId = $seccionEventos ? $seccionEventos->id : null;
}
```

**B. API de Noticias**
```php
// POST /api/noticias/crear
// Agregar soporte para recibir seccionId en FormData
// Si no se proporciona seccionId, buscar automáticamente la sección tipo 'NOTICIAS'

// Ejemplo en controlador:
$seccionId = $request->get('seccionId');
if (!$seccionId) {
    $seccionNoticias = Seccion::where('tipo', 'NOTICIAS')
                               ->where('activa', true)
                               ->first();
    $seccionId = $seccionNoticias ? $seccionNoticias->id : null;
}
```

**C. API de Partidos**
```php
// POST /api/partidos/crear (nuevo endpoint si no existe)
// Agregar soporte para recibir seccionId en FormData
// Si no se proporciona seccionId, buscar automáticamente la sección tipo 'PARTIDOS'

// Ejemplo en controlador:
$seccionId = $request->get('seccionId');
if (!$seccionId) {
    $seccionPartidos = Seccion::where('tipo', 'PARTIDOS')
                               ->where('activa', true)
                               ->first();
    $seccionId = $seccionPartidos ? $seccionPartidos->id : null;
}
```

## 📊 Vista Previa del Periódico

### Endpoint: GET /api/secciones/vista-previa

**Respuesta esperada:**
```json
{
  "secciones": [
    {
      "seccion": {
        "id": 1,
        "titulo": "Noticias Destacadas",
        "tipo": "NOTICIAS",
        "orden": 1,
        "descripcion": "Las noticias más importantes",
        "activa": true,
        "fechaCreacion": "2025-01-01T00:00:00Z"
      },
      "contenido": [
        {
          "id": 1,
          "tipo": "NOTICIA",
          "titulo": "Título de la noticia",
          "descripcion": "Resumen de la noticia",
          "fecha": "2025-01-01T00:00:00Z",
          "imagen": "url_de_la_imagen.jpg"
        }
      ]
    },
    {
      "seccion": {
        "id": 2,
        "titulo": "Eventos Próximos",
        "tipo": "EVENTOS",
        "orden": 2,
        "descripcion": "Próximos eventos deportivos",
        "activa": true,
        "fechaCreacion": "2025-01-01T00:00:00Z"
      },
      "contenido": [
        {
          "id": 1,
          "tipo": "EVENTO",
          "titulo": "Nombre del evento",
          "descripcion": "Descripción del evento",
          "fecha": "2025-01-01T00:00:00Z",
          "imagen": "url_de_la_imagen.jpg"
        }
      ]
    }
  ]
}
```

## 🚀 Datos de Prueba Recomendados

Insertar secciones por defecto:

```sql
INSERT INTO secciones (titulo, descripcion, tipo, orden, activa) VALUES
('Noticias', 'Sección de noticias del sitio', 'NOTICIAS', 1, TRUE),
('Eventos', 'Sección de eventos del sitio', 'EVENTOS', 2, TRUE),
('Partidos', 'Sección de partidos del sitio', 'PARTIDOS', 3, TRUE);
```

## ⚠️ Consideraciones Importantes

1. **Retrocompatibilidad:** Los contenidos existentes sin sección asignada deben seguir funcionando.

2. **Asignación Automática:** Cuando se crea nuevo contenido, debe buscarse automáticamente la sección correspondiente si no se especifica una.

3. **Ordenamiento:** Las secciones deben aparecer ordenadas por el campo `orden` en todas las consultas.

4. **Validaciones:** Validar que no existan dos secciones del mismo tipo si es necesario.

5. **Migraciones:** Crear migraciones para los cambios de base de datos y poblar con datos por defecto.

## 🔍 Testing

Probar los siguientes escenarios:
- Crear evento sin especificar sección (debe asignarse automáticamente)
- Crear noticia sin especificar sección (debe asignarse automáticamente)
- Crear contenido especificando sección específica
- Vista previa del periódico con y sin contenido
- Reordenamiento de secciones
- Activar/desactivar secciones

## 📝 Notas Adicionales

- El frontend está preparado para manejar casos donde no existan secciones o donde falle la asignación automática.
- El sistema es flexible y permite múltiples secciones del mismo tipo si es necesario en el futuro.
- La vista previa está optimizada para mostrar solo secciones activas con contenido relevante.
