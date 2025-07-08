import { Injectable } from '@angular/core';

export interface ConsentimientoCookies {
  esenciales: boolean;
  rendimiento: boolean;
  funcionales: boolean;
  marketing: boolean;
  fechaConsentimiento: string;
  version: string;
}

declare global {
  interface Window {
    gtag: any;
    dataLayer: any;
    fbq: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CookiesService {
  private readonly CLAVE_CONSENTIMIENTO = 'tiempoAdicional_cookies_consent';
  private readonly CLAVE_PREFERENCIAS = 'tiempoAdicional_cookies_preferences';
  private readonly VERSION_ACTUAL = '1.0';

  constructor() {}

  /**
   * Obtiene el consentimiento actual de cookies del usuario
   */
  obtenerConsentimiento(): ConsentimientoCookies | null {
    try {
      const consentimiento = localStorage.getItem(this.CLAVE_CONSENTIMIENTO);
      
      if (!consentimiento) {
        return null;
      }

      const datos = JSON.parse(consentimiento);
      
      // Verificar si la versión es actual
      if (datos.version !== this.VERSION_ACTUAL) {
        console.log('🍪 Versión de cookies desactualizada, solicitando nuevo consentimiento');
        this.limpiarConsentimiento();
        return null;
      }

      return datos;
    } catch (error) {
      console.error('Error al obtener consentimiento de cookies:', error);
      return null;
    }
  }

  /**
   * Guarda el consentimiento de cookies del usuario
   */
  guardarConsentimiento(consentimiento: ConsentimientoCookies): void {
    try {
      localStorage.setItem(this.CLAVE_CONSENTIMIENTO, JSON.stringify(consentimiento));
      localStorage.setItem(this.CLAVE_PREFERENCIAS, JSON.stringify({
        fechaActualizacion: new Date().toISOString(),
        configuracion: consentimiento
      }));

      console.log('🍪 Consentimiento de cookies guardado:', consentimiento);
      
      // Aplicar configuración inmediatamente
      this.aplicarConfiguracion(consentimiento);
    } catch (error) {
      console.error('Error al guardar consentimiento de cookies:', error);
    }
  }

  /**
   * Verifica si una categoría específica de cookies está permitida
   */
  estaPermitida(categoria: 'esenciales' | 'rendimiento' | 'funcionales' | 'marketing'): boolean {
    const consentimiento = this.obtenerConsentimiento();
    
    if (!consentimiento) {
      // Solo cookies esenciales permitidas por defecto
      return categoria === 'esenciales';
    }

    return Boolean(consentimiento[categoria]);
  }

  /**
   * Actualiza una categoría específica de cookies
   */
  actualizarCategoria(categoria: 'esenciales' | 'rendimiento' | 'funcionales' | 'marketing', permitida: boolean): void {
    const consentimientoActual = this.obtenerConsentimiento();
    
    if (consentimientoActual) {
      (consentimientoActual as any)[categoria] = permitida;
      consentimientoActual.fechaConsentimiento = new Date().toISOString();
      this.guardarConsentimiento(consentimientoActual);
    }
  }

  /**
   * Limpia todo el consentimiento de cookies
   */
  limpiarConsentimiento(): void {
    try {
      localStorage.removeItem(this.CLAVE_CONSENTIMIENTO);
      localStorage.removeItem(this.CLAVE_PREFERENCIAS);
      
      // Limpiar cookies existentes
      this.limpiarCookies();
      
      console.log('🍪 Consentimiento de cookies limpiado');
    } catch (error) {
      console.error('Error al limpiar consentimiento de cookies:', error);
    }
  }

  /**
   * Aplica la configuración de cookies
   */
  private aplicarConfiguracion(consentimiento: ConsentimientoCookies): void {
    // Limpiar servicios existentes primero
    this.deshabilitarTodosLosServicios();

    // Aplicar nuevas configuraciones
    if (consentimiento.rendimiento) {
      this.inicializarGoogleAnalytics();
    }

    if (consentimiento.funcionales) {
      this.inicializarServiciosFuncionales();
    }

    if (consentimiento.marketing) {
      this.inicializarServiciosMarketing();
    }
  }

  /**
   * Inicializa Google Analytics
   */
  inicializarGoogleAnalytics(): void {
    if (this.estaPermitida('rendimiento')) {
      try {
        // Configurar Google Analytics 4
        const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Reemplazar con tu ID real
        
        // Cargar script de Google Analytics
        if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
          document.head.appendChild(script);

          // Configurar dataLayer
          window.dataLayer = window.dataLayer || [];
          window.gtag = function() {
            window.dataLayer.push(arguments);
          };
          
          window.gtag('js', new Date());
          window.gtag('config', GA_MEASUREMENT_ID, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
          
          console.log('🍪 Google Analytics inicializado');
        }
      } catch (error) {
        console.error('Error al inicializar Google Analytics:', error);
      }
    }
  }

  /**
   * Inicializa servicios funcionales
   */
  inicializarServiciosFuncionales(): void {
    if (this.estaPermitida('funcionales')) {
      try {
        // Configurar almacenamiento de preferencias
        this.habilitarAlmacenamientoPreferencias();
        
        // Configurar tema personalizado
        this.aplicarTemaGuardado();
        
        console.log('🍪 Servicios funcionales inicializados');
      } catch (error) {
        console.error('Error al inicializar servicios funcionales:', error);
      }
    }
  }

  /**
   * Inicializa servicios de marketing
   */
  inicializarServiciosMarketing(): void {
    if (this.estaPermitida('marketing')) {
      try {
        // Facebook Pixel
        this.inicializarFacebookPixel();
        
        // Google Ads
        this.inicializarGoogleAds();
        
        console.log('🍪 Servicios de marketing inicializados');
      } catch (error) {
        console.error('Error al inicializar servicios de marketing:', error);
      }
    }
  }

  /**
   * Deshabilita todos los servicios de terceros
   */
  private deshabilitarTodosLosServicios(): void {
    // Deshabilitar Google Analytics
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        send_page_view: false
      });
    }

    // Deshabilitar Facebook Pixel
    if (window.fbq) {
      window.fbq('consent', 'revoke');
    }
  }

  /**
   * Inicializa Facebook Pixel
   */
  private inicializarFacebookPixel(): void {
    const FACEBOOK_PIXEL_ID = 'XXXXXXXXX'; // Reemplazar con tu ID real
    
    if (!window.fbq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${FACEBOOK_PIXEL_ID}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }
  }

  /**
   * Inicializa Google Ads
   */
  private inicializarGoogleAds(): void {
    // Configurar Google Ads si es necesario
    console.log('🍪 Google Ads configurado');
  }

  /**
   * Habilita almacenamiento de preferencias
   */
  private habilitarAlmacenamientoPreferencias(): void {
    // Permitir almacenamiento de preferencias del usuario
    console.log('🍪 Almacenamiento de preferencias habilitado');
  }

  /**
   * Aplica tema guardado del usuario
   */
  private aplicarTemaGuardado(): void {
    try {
      const temaGuardado = localStorage.getItem('tiempoAdicional_tema');
      if (temaGuardado) {
        document.body.className = temaGuardado;
      }
    } catch (error) {
      console.warn('No se pudo aplicar tema guardado:', error);
    }
  }

  /**
   * Limpia cookies del navegador
   */
  private limpiarCookies(): void {
    // Obtener todas las cookies
    const cookies = document.cookie.split(';');
    
    // Limpiar cookies relacionadas con analytics y marketing
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Limpiar cookies específicas (no esenciales)
      if (name.startsWith('_ga') || 
          name.startsWith('_gid') || 
          name.startsWith('_fbp') || 
          name.startsWith('_fbc')) {
        
        // Eliminar cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });
  }

  /**
   * Obtiene estadísticas de uso de cookies
   */
  obtenerEstadisticas(): any {
    const consentimiento = this.obtenerConsentimiento();
    
    if (!consentimiento) {
      return {
        tieneConsentimiento: false,
        fechaConsentimiento: null,
        categoriasActivas: ['esenciales']
      };
    }

    const categoriasActivas = Object.keys(consentimiento)
      .filter(key => key !== 'fechaConsentimiento' && key !== 'version')
      .filter(key => (consentimiento as any)[key] === true);

    return {
      tieneConsentimiento: true,
      fechaConsentimiento: consentimiento.fechaConsentimiento,
      categoriasActivas,
      version: consentimiento.version
    };
  }
}
