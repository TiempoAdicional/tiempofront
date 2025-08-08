# 🔧 SOLUCIÓN ERROR 400 EN PRODUCCIÓN - CREAR MIEMBROS EQUIPO

## 🚨 **PROBLEMA IDENTIFICADO**

### **Error en Producción**:
- ✅ **Local**: Funciona correctamente
- ❌ **Producción**: Error 400 al crear miembros del equipo
- **Síntoma**: Usuario no puede crear miembros del equipo en producción

## 🔍 **ANÁLISIS DEL PROBLEMA**

### **Posibles Causas**:

1. **🔐 Problemas de Autenticación**
   - Token no se está enviando correctamente
   - Token expirado o inválido
   - Headers de autorización malformados

2. **🌐 Problemas de CORS**
   - Configuración de CORS en producción diferente a local
   - Headers de preflight no configurados correctamente

3. **📦 Problemas de FormData**
   - Formato de datos incorrecto para multipart/form-data
   - Content-Type mal configurado

4. **🔧 Problemas de Backend**
   - Validación más estricta en producción
   - Endpoints diferentes entre local y producción

## ✅ **SOLUCIONES IMPLEMENTADAS**

### **1. Mejora del Interceptor de Autenticación**

```typescript
// src/app/auth/interceptors/auth.interceptor.ts
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  // URLs públicas que no requieren autenticación
  const publicUrls = [
    '/api/noticias/publicas',
    '/api/eventos/publicos',
    '/api/auth/login',
    '/api/auth/register',
    '/api/equipo/publico'  // 🆕 Agregado
  ];

  // Logging para debugging en producción
  console.log('🔐 AuthInterceptor:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    isPublicUrl,
    tokenLength: token ? token.length : 0
  });

  // Solo agregar token si no es una URL pública y el token existe
  if (token && !isPublicUrl) {
    // Verificar que el token no esté vacío o malformado
    if (token.trim() === '' || token === 'null' || token === 'undefined') {
      console.warn('⚠️ Token inválido detectado:', token);
      return next(req);
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': req.headers.get('Content-Type') || 'application/json'
      },
    });

    console.log('✅ Token agregado a la petición:', {
      url: req.url,
      tokenPreview: token.substring(0, 20) + '...'
    });

    return next(authReq);
  }

  return next(req);
};
```

### **2. Mejora del Servicio de Equipo**

```typescript
// src/app/core/services/equipo.service.ts
crearMiembro(miembroData: CrearMiembroDTO, imagen?: File): Observable<MiembroEquipo> {
  console.log('📤 Creando miembro del equipo...', miembroData);
  
  const miembroConDefaults = {
    nombre: miembroData.nombre,
    apellido: miembroData.apellido || '',
    correo: miembroData.correo,
    rol: miembroData.rol,
    cargo: miembroData.cargo || '',
    biografia: miembroData.biografia || '',
    telefono: miembroData.telefono || '',
    ordenVisualizacion: miembroData.ordenVisualizacion || 0,
    activo: miembroData.activo !== undefined ? miembroData.activo : true
  };
  
  const formData = new FormData();
  const miembroJSON = JSON.stringify(miembroConDefaults);
  const miembroBlob = new Blob([miembroJSON], { type: 'application/json' });
  formData.append('miembro', miembroBlob);
  
  if (imagen) {
    formData.append('imagen', imagen, imagen.name);
  }

  // 🆕 Headers más específicos para debugging
  const headers: any = {
    // No establecer Content-Type aquí, Angular lo hará automáticamente para FormData
  };

  console.log('🌐 URL del endpoint:', `${this.apiUrl}/admin`);
  console.log('🔐 Headers de la petición:', headers);
  console.log('📦 FormData contenido:', {
    hasMiembro: formData.has('miembro'),
    hasImagen: formData.has('imagen'),
    miembroSize: miembroJSON.length
  });

  return this.http.post<any>(`${this.apiUrl}/admin`, formData, { headers })
    .pipe(
      // ... resto del código
      catchError(error => {
        console.error('❌ Error al crear miembro:', error);
        
        // 🆕 Logging más detallado para debugging en producción
        console.error('🔍 Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        
        // Si es error 400, mostrar información específica
        if (error.status === 400) {
          console.error('🚨 Error 400 - Posibles causas:');
          console.error('   - Token inválido o expirado');
          console.error('   - Datos malformados');
          console.error('   - Validación del backend falló');
          console.error('   - Headers incorrectos');
          
          if (error.error && error.error.message) {
            console.error('📝 Mensaje del backend:', error.error.message);
          }
        }
        
        return throwError(() => error);
      })
    );
}
```

### **3. Mejora del Servicio de Autenticación**

```typescript
// src/app/auth/services/auth.service.ts
guardarToken(token: string): void {
  // 🆕 VALIDACIÓN: Verificar que el token no esté vacío o malformado
  if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
    console.error('❌ Token inválido recibido:', token);
    return;
  }
  
  console.log('🔐 Guardando token:', {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('jwt', token);
  this.autenticadoSubject.next(this.estaAutenticado());
}

estaAutenticado(): boolean {
  const token = this.obtenerToken();
  if (!token) {
    console.log('🔍 No hay token almacenado');
    return false;
  }

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const ahora = Math.floor(Date.now() / 1000);
    const esValido = decoded.exp > ahora;
    
    console.log('🔍 Verificando token:', {
      exp: decoded.exp,
      ahora,
      esValido,
      tiempoRestante: decoded.exp - ahora
    });
    
    return esValido;
  } catch (error) {
    console.error('❌ Error decodificando token:', error);
    return false;
  }
}
```

## 🔧 **PASOS PARA VERIFICAR EN PRODUCCIÓN**

### **1. Verificar Token en Consola del Navegador**

```javascript
// En la consola del navegador en producción:
console.log('Token actual:', localStorage.getItem('jwt'));
console.log('Usuario:', localStorage.getItem('nombre'));
console.log('Rol:', localStorage.getItem('rol'));
```

### **2. Verificar Peticiones en Network Tab**

1. Abrir DevTools → Network
2. Intentar crear un miembro del equipo
3. Buscar la petición a `/api/equipo/admin`
4. Verificar:
   - Headers de Authorization
   - Content-Type
   - Payload de la petición

### **3. Verificar Logs del Backend**

En el backend de producción, verificar:
- Logs de autenticación
- Logs de validación
- Logs de CORS

## 🚀 **DEPLOY Y TESTING**

### **1. Build para Producción**
```bash
npm run build --prod
```

### **2. Verificar Variables de Entorno**
```typescript
// src/environment/environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://tiempobackend.onrender.com',
  tinyApiKey: '5tih1fbrikzwqwsoual38fk8cjntepo2indbjl3evoppebut'
};
```

### **3. Testing en Producción**

1. **Login como EDITOR_JEFE**
2. **Acceder a `/admin/equipo`**
3. **Intentar crear un miembro**
4. **Verificar logs en consola**

## 📋 **CHECKLIST DE VERIFICACIÓN**

### ✅ **Frontend**
- [ ] Token se guarda correctamente en localStorage
- [ ] Interceptor agrega token a peticiones protegidas
- [ ] FormData se envía con formato correcto
- [ ] Logs de debugging están habilitados

### ✅ **Backend**
- [ ] Endpoint `/api/equipo/admin` está protegido
- [ ] CORS configurado para producción
- [ ] Validación de token funciona
- [ ] FormData se procesa correctamente

### ✅ **Red**
- [ ] Peticiones llegan al backend
- [ ] Headers de autorización están presentes
- [ ] Content-Type es correcto
- [ ] No hay errores de CORS

## 🔍 **DEBUGGING ADICIONAL**

### **Si el problema persiste:**

1. **Verificar Token Manualmente**
```javascript
// En consola del navegador
fetch('https://tiempobackend.onrender.com/api/equipo/admin', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('jwt'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nombre: 'Test',
    apellido: 'User',
    correo: 'test@test.com',
    rol: 'EDITOR'
  })
}).then(r => r.json()).then(console.log);
```

2. **Verificar Backend Directamente**
```bash
curl -X POST https://tiempobackend.onrender.com/api/equipo/admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","apellido":"User","correo":"test@test.com","rol":"EDITOR"}'
```

## 📝 **NOTAS IMPORTANTES**

- **El problema más común es que el token no se envía correctamente**
- **En producción, los headers deben ser exactos**
- **FormData requiere Content-Type automático de Angular**
- **Los logs de debugging ayudan a identificar el problema específico**

---

*Esta documentación debe actualizarse según los resultados del debugging en producción.*
