
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, state, style, transition, animate, keyframes, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [ CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule],
  templateUrl: './historia.component.html',
  styleUrls: ['./historia.component.scss'],
  animations: [
    trigger('backButtonAnimation', [
      state('in', style({ opacity: 1, transform: 'translateX(0) scale(1)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateX(-40px) scale(0.7)' }),
        animate('0.7s 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55)')
      ])
    ]),
    trigger('heroAnimation', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(-50px)' }),
        animate('1s ease-out')
      ])
    ]),
    trigger('logoAnimation', [
      state('in', style({ opacity: 1, transform: 'scale(1) rotate(0deg)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'scale(0.5) rotate(-180deg)' }),
        animate('1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)')
      ])
    ]),
    trigger('subtitleAnimation', [
      state('in', style({ opacity: 1, transform: 'translateX(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateX(-100px)' }),
        animate('0.8s 0.5s ease-out')
      ])
    ]),
    trigger('descriptionAnimation', [
      state('in', style({ opacity: 1, transform: 'translateX(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateX(100px)' }),
        animate('0.8s 0.8s ease-out')
      ])
    ]),
    trigger('bounceAnimation', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [
        style({ opacity: 0 }),
        animate('0.5s 1.5s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('cardSlideIn', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(100px)' }),
        animate('0.8s ease-out')
      ])
    ]),
    trigger('storyContentAnimation', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [
        query('.story-paragraph, .founding-highlight', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(200, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ])
    ]),
    trigger('titleAnimation', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.6s ease-out')
      ])
    ]),
    trigger('cardAnimation', [
      state('in', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(50px) scale(0.9)' }),
        animate('0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ])
    ]),
    trigger('visionCardAnimation', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('1s cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ])
    ]),
    trigger('visionContentAnimation', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [
        query('.vision-text, .vision-features', [
          style({ opacity: 0, transform: 'translateX(-50px)' }),
          stagger(300, [
            animate('0.8s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ])
      ])
    ]),
    trigger('chipAnimation', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s ease-out')
      ])
    ]),
    trigger('valueCardAnimation', [
      state('in', style({ opacity: 1, transform: 'translateY(0) rotateY(0deg)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(30px) rotateY(90deg)' }),
        animate('0.8s ease-out')
      ])
    ]),
    trigger('ctaAnimation', [
      state('in', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => *', [
        animate('1s ease-out', keyframes([
          style({ opacity: 0, transform: 'scale(0.3)', offset: 0 }),
          style({ opacity: 0.5, transform: 'scale(1.1)', offset: 0.7 }),
          style({ opacity: 1, transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class HistoriaComponent implements OnInit, AfterViewInit {
  backButtonState = 'in';
  heroState = 'in';
  logoState = 'in';
  subtitleState = 'in';
  descriptionState = 'in';
  bounceState = 'in';
  storyCardState = 'out';
  storyContentState = 'out';
  missionTitleState = 'out';
  missionCard1State = 'out';
  missionCard2State = 'out';
  missionCard3State = 'out';
  visionCardState = 'out';
  visionContentState = 'out';
  valuesTitleState = 'out';
  ctaState = 'out';

  visionFeatures = [
    { icon: 'groups', text: 'Comunidad' },
    { icon: 'hearing', text: 'Escucha Activa' },
    { icon: 'forum', text: 'Debate Constructivo' },
    { icon: 'celebration', text: 'Celebración' },
    { icon: 'favorite', text: 'Pertenencia' }
  ];

  values = [
    {
      icon: 'verified',
      title: 'Autenticidad',
      description: 'Contamos las historias reales del fútbol, sin filtros ni artificios.'
    },
    {
      icon: 'diversity_3',
      title: 'Inclusión',
      description: 'Todas las voces de la afición tienen un lugar en nuestra plataforma.'
    },
    {
      icon: 'favorite',
      title: 'Pasión',
      description: 'El amor por el fútbol es el motor que impulsa cada contenido que creamos.'
    },
    {
      icon: 'handshake',
      title: 'Respeto',
      description: 'Valoramos cada opinión y fomentamos el diálogo respetuoso entre hinchas.'
    },
    {
      icon: 'psychology',
      title: 'Profundidad',
      description: 'Vamos más allá de la superficie para entender la cultura futbolística.'
    },
    {
      icon: 'connect_without_contact',
      title: 'Conexión',
      description: 'Unimos a la comunidad futbolística a través de historias compartidas.'
    }
  ];

  private valueCardStates: string[] = [];
  private chipStates: string[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeStates();
    this.setupScrollAnimations();
  }

  onBackToDashboard() {
    // Puedes ajustar la lógica según cómo manejes la autenticación
    // Aquí se asume que si hay un token en localStorage, el usuario está logueado
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      this.router.navigate(['/usuarios/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  ngAfterViewInit() {
    this.observeElements();
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  private initializeStates() {
    this.valueCardStates = this.values.map(() => 'out');
    this.chipStates = this.visionFeatures.map(() => 'out');
  }

  private setupScrollAnimations() {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const balls = document.querySelectorAll('.floating-ball');
      
      balls.forEach((ball, index) => {
        const speed = 0.3 + (index * 0.1);
        const yPos = -(scrolled * speed);
        (ball as HTMLElement).style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
      });
    });
  }

  private observeElements() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          if (element.classList.contains('story-card')) {
            this.storyCardState = 'in';
            setTimeout(() => this.storyContentState = 'in', 300);
          }
          
          if (element.classList.contains('mission-section')) {
            this.missionTitleState = 'in';
            setTimeout(() => this.missionCard1State = 'in', 200);
            setTimeout(() => this.missionCard2State = 'in', 400);
            setTimeout(() => this.missionCard3State = 'in', 600);
          }
          
          if (element.classList.contains('vision-card')) {
            this.visionCardState = 'in';
            setTimeout(() => {
              this.visionContentState = 'in';
              this.animateChips();
            }, 500);
          }
          
          if (element.classList.contains('values-section')) {
            this.valuesTitleState = 'in';
            this.animateValueCards();
          }
          
          if (element.classList.contains('cta-card')) {
            this.ctaState = 'in';
          }
        }
      });
    }, {
      threshold: 0.2
    });

    const elementsToObserve = document.querySelectorAll(
      '.story-card, .mission-section, .vision-card, .values-section, .cta-card'
    );

    elementsToObserve.forEach(element => {
      observer.observe(element);
    });
  }

  private animateChips() {
    this.visionFeatures.forEach((_, index) => {
      setTimeout(() => {
        this.chipStates[index] = 'in';
      }, index * 100);
    });
  }

  private animateValueCards() {
    this.values.forEach((_, index) => {
      setTimeout(() => {
        this.valueCardStates[index] = 'in';
      }, index * 150);
    });
  }

  getChipState(index: number): string {
    return this.chipStates[index] || 'out';
  }

  getValueCardState(index: number): string {
    return this.valueCardStates[index] || 'out';
  }

}
