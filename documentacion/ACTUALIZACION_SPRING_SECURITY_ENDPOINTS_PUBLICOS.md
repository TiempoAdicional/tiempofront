# Actualización Spring Security - Endpoints Públicos

## Configuración Actual vs Requerida

### Tu configuración actual (parcial):
```java
.requestMatchers(HttpMethod.GET, "/api/noticias/todas").permitAll()
.requestMatchers(HttpMethod.GET, "/api/eventos/listar").permitAll()
```

### Configuración actualizada necesaria:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints públicos para el frontend modernizado
                .requestMatchers(HttpMethod.GET, "/api/noticias/publicas").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/eventos/publicos").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/partidos/publicos").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/secciones/publicas").permitAll()
                
                // Endpoints públicos existentes (mantener)
                .requestMatchers(HttpMethod.GET, "/api/noticias/todas").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/eventos/listar").permitAll()
                
                // Endpoints de autenticación
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/usuarios/registrar").permitAll()
                
                // Endpoints de administración
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/super-admin/**").hasRole("SUPER_ADMIN")
                
                // Cualquier otra petición requiere autenticación
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Permitir todos los orígenes en desarrollo, especificar en producción
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        
        // Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Headers permitidos
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Permitir credenciales
        configuration.setAllowCredentials(true);
        
        // Aplicar a todas las rutas
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
```

## 2. Controladores para Endpoints Públicos

### NoticiasController - Método público:
```java
@RestController
@RequestMapping("/api/noticias")
@CrossOrigin(origins = "*")
public class NoticiasController {

    @Autowired
    private NoticiasService noticiasService;

    // Endpoint público específico para el frontend
    @GetMapping("/publicas")
    public ResponseEntity<?> obtenerNoticiasPublicas(
            @RequestParam(defaultValue = "10") int limite,
            @RequestParam(defaultValue = "true") boolean esPublica) {
        
        try {
            Map<String, Object> response = noticiasService.obtenerNoticiasPublicas(limite);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("mensaje", "Error al obtener noticias públicas");
            error.put("detalle", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Mantener endpoint existente para compatibilidad
    @GetMapping("/todas")
    public ResponseEntity<?> listarTodasLasNoticias(
            @RequestParam(defaultValue = "1") int pagina,
            @RequestParam(defaultValue = "20") int tamaño) {
        // Tu implementación existente
    }
}
```

### EventosController - Método público:
```java
@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "*")
public class EventosController {

    @Autowired
    private EventosService eventosService;

    // Endpoint público específico para el frontend
    @GetMapping("/publicos")
    public ResponseEntity<List<Evento>> obtenerEventosPublicos(
            @RequestParam(defaultValue = "8") int limite) {
        
        try {
            List<Evento> eventos = eventosService.obtenerEventosPublicos(limite);
            return ResponseEntity.ok(eventos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Mantener endpoint existente para compatibilidad
    @GetMapping("/listar")
    public ResponseEntity<List<Evento>> listarEventos() {
        // Tu implementación existente
    }
}
```

## 3. Servicios - Métodos para contenido público

### NoticiasService:
```java
@Service
public class NoticiasService {

    @Autowired
    private NoticiasRepository noticiasRepository;

    public Map<String, Object> obtenerNoticiasPublicas(int limite) {
        List<Noticia> noticias = noticiasRepository.findTop10ByOrderByFechaPublicacionDesc();
        
        // Limitar según el parámetro
        if (noticias.size() > limite) {
            noticias = noticias.subList(0, limite);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("noticias", noticias);
        response.put("total", noticias.size());
        response.put("esPublica", true);
        
        return response;
    }
}
```

### EventosService:
```java
@Service
public class EventosService {

    @Autowired
    private EventosRepository eventosRepository;

    public List<Evento> obtenerEventosPublicos(int limite) {
        List<Evento> eventos = eventosRepository.findTop8ByOrderByFechaDesc();
        
        // Limitar según el parámetro
        if (eventos.size() > limite) {
            eventos = eventos.subList(0, limite);
        }
        
        return eventos;
    }
}
```

## 4. Repositories - Métodos optimizados

### NoticiasRepository:
```java
@Repository
public interface NoticiasRepository extends JpaRepository<Noticia, Long> {
    
    @Query("SELECT n FROM Noticia n ORDER BY n.fechaPublicacion DESC")
    List<Noticia> findTop10ByOrderByFechaPublicacionDesc();
    
    // Tus métodos existentes...
}
```

### EventosRepository:
```java
@Repository
public interface EventosRepository extends JpaRepository<Evento, Long> {
    
    @Query("SELECT e FROM Evento e ORDER BY e.fecha DESC")
    List<Evento> findTop8ByOrderByFechaDesc();
    
    // Tus métodos existentes...
}
```

## 5. Verificación de Funcionamiento

Una vez implementados estos cambios:

1. **Reinicia tu aplicación Spring Boot**
2. **Verifica que los endpoints respondan sin autenticación:**
   ```bash
   curl -X GET "http://localhost:8080/api/noticias/publicas?limite=10"
   curl -X GET "http://localhost:8080/api/eventos/publicos?limite=8"
   ```
3. **Verifica CORS desde el frontend**
4. **Prueba el dashboard del frontend sin estar logueado**

## Puntos Importantes

- ✅ Los endpoints `/publicas` y `/publicos` son específicos para el frontend modernizado
- ✅ Mantén los endpoints existentes (`/todas`, `/listar`) para compatibilidad
- ✅ CORS configurado para permitir todas las peticiones del frontend
- ✅ Los métodos del service retornan data limitada apropiada para usuarios públicos
- ✅ Manejo de errores incluido en los controladores

## Testing

Después de implementar, el frontend debería:
- ✅ Mostrar 10 noticias para usuarios no registrados
- ✅ Mostrar 8 eventos para usuarios no registrados  
- ✅ Mostrar overlay en contenido bloqueado
- ✅ Permitir navegación sin errores de CORS
- ✅ Funcionar tanto para usuarios logueados como no logueados
