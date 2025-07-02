# Modificaciones Necesarias en el Backend para Endpoints Públicos

## 1. Endpoints Públicos Faltantes

Agregar estos endpoints como públicos en la configuración de Spring Security:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> {}) // ✅ CORS habilitado
        .authorizeHttpRequests(auth -> auth
            // ========== ENDPOINTS PÚBLICOS EXISTENTES ==========
            .requestMatchers("/auth/**").permitAll()
            .requestMatchers("/api/noticias/publicas").permitAll()
            .requestMatchers("/api/noticias/buscar").permitAll()
            .requestMatchers("/api/noticias/publicadas").permitAll()
            .requestMatchers("/api/noticias/ver/**").permitAll()
            .requestMatchers("/api/noticias/destacadas").permitAll()
            .requestMatchers("/api/eventos/proximos").permitAll()
            .requestMatchers("/api/eventos/valores-permitidos").permitAll()
            .requestMatchers("/api/partidos/**").permitAll()
            .requestMatchers("/api/liga-colombiana/**").permitAll()
            
            // ========== NUEVOS ENDPOINTS PÚBLICOS NECESARIOS ==========
            .requestMatchers(HttpMethod.GET, "/api/noticias/recientes").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/noticias/limitadas").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/eventos/limitados").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/eventos/publicos").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/partidos/recientes").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/partidos/limitados").permitAll()
            
            // ========== RESTO DE LA CONFIGURACIÓN ==========
            // ... resto de la configuración existente
        )
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
```

## 2. Controladores que Necesitan Nuevos Métodos

### NoticiasController.java

```java
/**
 * Endpoint público para obtener noticias limitadas para usuarios no registrados
 */
@GetMapping("/limitadas")
public ResponseEntity<Map<String, Object>> obtenerNoticiasLimitadas(
    @RequestParam(defaultValue = "10") int limite
) {
    try {
        // Obtener solo noticias públicas y destacadas
        List<Noticia> noticias = noticiaService.obtenerNoticiasPublicasLimitadas(limite);
        
        Map<String, Object> response = new HashMap<>();
        response.put("noticias", noticias);
        response.put("total", noticias.size());
        response.put("limite", limite);
        response.put("esPublico", true);
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Error al obtener noticias: " + e.getMessage()));
    }
}

/**
 * Endpoint público para obtener noticias recientes
 */
@GetMapping("/recientes")
public ResponseEntity<List<Noticia>> obtenerNoticiasRecientes(
    @RequestParam(defaultValue = "5") int limite
) {
    try {
        List<Noticia> noticias = noticiaService.obtenerNoticiasRecientesPublicas(limite);
        return ResponseEntity.ok(noticias);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
    }
}
```

### EventosController.java

```java
/**
 * Endpoint público para obtener eventos limitados para usuarios no registrados
 */
@GetMapping("/limitados")
public ResponseEntity<Map<String, Object>> obtenerEventosLimitados(
    @RequestParam(defaultValue = "8") int limite
) {
    try {
        List<Evento> eventos = eventoService.obtenerEventosPublicosLimitados(limite);
        
        Map<String, Object> response = new HashMap<>();
        response.put("eventos", eventos);
        response.put("total", eventos.size());
        response.put("limite", limite);
        response.put("esPublico", true);
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Error al obtener eventos: " + e.getMessage()));
    }
}

/**
 * Endpoint público alternativo (alias de /proximos)
 */
@GetMapping("/publicos")
public ResponseEntity<List<Evento>> obtenerEventosPublicos(
    @RequestParam(defaultValue = "8") int limite
) {
    try {
        List<Evento> eventos = eventoService.obtenerEventosProximosPublicos(limite);
        return ResponseEntity.ok(eventos);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
    }
}
```

### PartidosController.java

```java
/**
 * Endpoint público para obtener partidos limitados
 */
@GetMapping("/limitados")
public ResponseEntity<Map<String, Object>> obtenerPartidosLimitados(
    @RequestParam(defaultValue = "6") int limite
) {
    try {
        List<Partido> partidos = partidoService.obtenerPartidosRecientesLimitados(limite);
        
        Map<String, Object> response = new HashMap<>();
        response.put("partidos", partidos);
        response.put("total", partidos.size());
        response.put("limite", limite);
        response.put("esPublico", true);
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Error al obtener partidos: " + e.getMessage()));
    }
}

/**
 * Endpoint público para obtener partidos recientes
 */
@GetMapping("/recientes")
public ResponseEntity<List<Partido>> obtenerPartidosRecientes(
    @RequestParam(defaultValue = "6") int limite
) {
    try {
        List<Partido> partidos = partidoService.obtenerPartidosRecientes(limite);
        return ResponseEntity.ok(partidos);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
    }
}
```

## 3. Servicios que Necesitan Nuevos Métodos

### NoticiaService.java

```java
/**
 * Obtiene noticias públicas limitadas para usuarios no registrados
 */
public List<Noticia> obtenerNoticiasPublicasLimitadas(int limite) {
    return noticiaRepository.findByEsPublicaTrueOrderByFechaPublicacionDescLimit(limite);
}

/**
 * Obtiene noticias recientes públicas
 */
public List<Noticia> obtenerNoticiasRecientesPublicas(int limite) {
    LocalDateTime fechaLimite = LocalDateTime.now().minusDays(7);
    return noticiaRepository.findByEsPublicaTrueAndFechaPublicacionAfterOrderByFechaPublicacionDescLimit(fechaLimite, limite);
}
```

### EventoService.java

```java
/**
 * Obtiene eventos públicos limitados
 */
public List<Evento> obtenerEventosPublicosLimitados(int limite) {
    return eventoRepository.findEventosProximosLimitados(limite);
}

/**
 * Obtiene eventos próximos públicos
 */
public List<Evento> obtenerEventosProximosPublicos(int limite) {
    LocalDateTime ahora = LocalDateTime.now();
    return eventoRepository.findByFechaAfterOrderByFechaAscLimit(ahora, limite);
}
```

### PartidoService.java

```java
/**
 * Obtiene partidos recientes limitados
 */
public List<Partido> obtenerPartidosRecientesLimitados(int limite) {
    return partidoRepository.findTop(limite).orderByFechaDesc();
}

/**
 * Obtiene partidos recientes
 */
public List<Partido> obtenerPartidosRecientes(int limite) {
    return partidoRepository.findPartidosRecientes(limite);
}
```

## 4. Configuración CORS Adicional

Asegurar que CORS esté bien configurado:

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## 5. Repositories que Necesitan Nuevos Métodos

### NoticiaRepository.java

```java
@Query("SELECT n FROM Noticia n WHERE n.esPublica = true ORDER BY n.fechaPublicacion DESC")
List<Noticia> findByEsPublicaTrueOrderByFechaPublicacionDescLimit(Pageable pageable);

default List<Noticia> findByEsPublicaTrueOrderByFechaPublicacionDescLimit(int limite) {
    return findByEsPublicaTrueOrderByFechaPublicacionDescLimit(PageRequest.of(0, limite));
}

@Query("SELECT n FROM Noticia n WHERE n.esPublica = true AND n.fechaPublicacion > :fechaLimite ORDER BY n.fechaPublicacion DESC")
List<Noticia> findByEsPublicaTrueAndFechaPublicacionAfterOrderByFechaPublicacionDescLimit(
    @Param("fechaLimite") LocalDateTime fechaLimite, 
    Pageable pageable
);

default List<Noticia> findByEsPublicaTrueAndFechaPublicacionAfterOrderByFechaPublicacionDescLimit(
    LocalDateTime fechaLimite, 
    int limite
) {
    return findByEsPublicaTrueAndFechaPublicacionAfterOrderByFechaPublicacionDescLimit(
        fechaLimite, 
        PageRequest.of(0, limite)
    );
}
```

### EventoRepository.java

```java
@Query("SELECT e FROM Evento e WHERE e.fecha > :fecha ORDER BY e.fecha ASC")
List<Evento> findByFechaAfterOrderByFechaAscLimit(@Param("fecha") LocalDateTime fecha, Pageable pageable);

default List<Evento> findByFechaAfterOrderByFechaAscLimit(LocalDateTime fecha, int limite) {
    return findByFechaAfterOrderByFechaAscLimit(fecha, PageRequest.of(0, limite));
}

@Query("SELECT e FROM Evento e WHERE e.fecha > CURRENT_TIMESTAMP ORDER BY e.fecha ASC")
List<Evento> findEventosProximosLimitados(Pageable pageable);

default List<Evento> findEventosProximosLimitados(int limite) {
    return findEventosProximosLimitados(PageRequest.of(0, limite));
}
```

### PartidoRepository.java

```java
@Query("SELECT p FROM Partido p ORDER BY p.fecha DESC")
List<Partido> findPartidosRecientes(Pageable pageable);

default List<Partido> findPartidosRecientes(int limite) {
    return findPartidosRecientes(PageRequest.of(0, limite));
}
```

## Resumen de Cambios Prioritarios

1. **Agregar endpoints públicos** en SecurityFilterChain
2. **Crear métodos públicos** en controladores
3. **Implementar servicios** para contenido limitado
4. **Verificar CORS** está bien configurado
5. **Agregar queries** en repositories para límites

Con estos cambios, el frontend podrá acceder a contenido real sin autenticación.
