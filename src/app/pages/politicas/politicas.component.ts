import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';

interface TermsSection {
  title: string;
  content: string;
  icon: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatChipsModule,
    MatToolbarModule,
    MatCheckboxModule,
    RouterModule
  ],
  templateUrl: './politicas.component.html',
  styleUrls: ['./politicas.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.8s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-30px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandCollapse', [
      state('expanded', style({ height: '*', opacity: 1 })),
      state('collapsed', style({ height: '0', opacity: 0 })),
      transition('expanded <=> collapsed', animate('300ms ease-in-out'))
    ])
  ]
})
export class PoliticasComponent implements OnInit {
accepted = false;
  lastUpdated = new Date('2025-07-16');
  effectiveDate = new Date('2025-07-16');
  
  termsCategories = [
    'Información Recopilada',
    'Uso de Datos',
    'Compartir Información',
    'Seguridad',
    'Derechos del Usuario',
    'Cookies y Publicidad'
  ];

  termsSections: TermsSection[] = [
    {
      title: 'Introducción',
      icon: 'info',
      content: `En Tiempo Adicional valoramos y respetamos tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos tu información personal cuando visitas nuestro sitio web. Al acceder y utilizar nuestro sitio, aceptas los términos de esta Política de Privacidad. Si no estás de acuerdo con ella, te recomendamos no utilizar nuestros servicios.`,
      expanded: true
    },
    {
      title: 'Información que Recopilamos',
      icon: 'data_usage',
      content: `Podemos recopilar información personal y no personal cuando interactúas con nuestro sitio web. Información Personal: Datos de registro (nombre, correo electrónico, fecha de nacimiento), información de contacto, datos de pago procesados de forma segura a través de PayPal o Stripe, y comentarios de participación. Información No Personal: Datos de uso y navegación (dirección IP, tipo de navegador, dispositivo, páginas visitadas), y cookies propias y de terceros para analizar tráfico y personalizar contenido.`,
      expanded: false
    },
    {
      title: 'Uso de la Información',
      icon: 'settings',
      content: `Utilizamos tu información para: proporcionar, operar y mantener nuestro sitio y servicios; personalizar tu experiencia y ofrecer contenido relevante; gestionar suscripciones, sorteos o promociones; enviarte boletines informativos y actualizaciones; responder consultas y comentarios; analizar métricas de audiencia y tendencias de uso; y cumplir obligaciones legales o regulatorias.`,
      expanded: false
    },
    {
      title: 'Compartir Información',
      icon: 'share',
      content: `No vendemos ni alquilamos tu información personal. Sin embargo, podemos compartirla con: proveedores de servicios que nos asisten en la operación del sitio (hosting, análisis web como Google Analytics, publicidad como Google AdSense, procesamiento de pagos); para cumplimiento legal cuando sea requerido por ley; y con plugins y redes sociales (Facebook, X, Instagram, TikTok) según sus políticas cuando interactúas con sus widgets.`,
      expanded: false
    },
    {
      title: 'Seguridad de la Información',
      icon: 'security',
      content: `Implementamos medidas técnicas y organizativas razonables para proteger tu información personal. Sin embargo, ninguna transmisión por Internet o almacenamiento electrónico es completamente seguro. Te recomendamos utilizar contraseñas robustas, no compartir información sensible en espacios públicos y mantener actualizados tus dispositivos.`,
      expanded: false
    },
    {
      title: 'Derechos de los Usuarios',
      icon: 'account_circle',
      content: `Dependiendo de la legislación aplicable, tienes derecho a: acceder a tu información personal; solicitar la corrección de datos inexactos; solicitar la eliminación de tu información personal; oponerte al procesamiento de tus datos o retirar tu consentimiento; y solicitar la portabilidad de tus datos. Para ejercer estos derechos, contáctanos en: gerencia@tiempoadicional.com`,
      expanded: false
    },
    {
      title: 'Cookies y Publicidad',
      icon: 'cookie',
      content: `Utilizamos cookies propias y de terceros (como Google AdSense) para ofrecer anuncios personalizados y analizar el tráfico del sitio. Puedes configurar tu navegador para rechazar cookies o eliminarlas. Ten en cuenta que deshabilitar cookies puede afectar el funcionamiento de algunas funciones del sitio.`,
      expanded: false
    },
    {
      title: 'Enlaces a Terceros',
      icon: 'link',
      content: `Nuestro sitio puede contener enlaces a sitios web de terceros. No controlamos ni somos responsables de sus prácticas de privacidad. Te recomendamos leer las políticas de privacidad de cada sitio que visites.`,
      expanded: false
    },
    {
      title: 'Contacto',
      icon: 'contact_mail',
      content: `Si tienes preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad, puedes comunicarte con nosotros a través de: gerencia@tiempoadicional.com. Podemos actualizar esta Política de Privacidad periódicamente y publicaremos cualquier cambio en esta página.`,
      expanded: false
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Inicialización del componente
  }

  toggleAcceptance(): void {
    this.accepted = !this.accepted;
  }

  onPrintTerms(): void {
    window.print();
  }

  onDownloadTerms(): void {
    // Simular descarga de términos
    const element = document.createElement('a');
    const file = new Blob(['Términos del Servicio - Contenido completo...'], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'terminos-del-servicio.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  onContactSupport(): void {
    // Simular contacto con soporte
    window.open('mailto:gerencia@tiempoadicional.com?subject=Consulta sobre Política de Privacidad', '_blank');
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
