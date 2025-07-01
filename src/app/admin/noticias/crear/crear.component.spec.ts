import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CrearNoticiaComponent } from './crear.component';
import { NoticiasService } from '../../../core/services/noticias.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AsignacionSeccionService } from '../../../core/services/asignacion-seccion.service';

describe('CrearNoticiaComponent', () => {
  let component: CrearNoticiaComponent;
  let fixture: ComponentFixture<CrearNoticiaComponent>;
  let mockNoticiaService: jasmine.SpyObj<NoticiasService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // 🔥 Crear mocks para los métodos del servicio
    mockNoticiaService = jasmine.createSpyObj('NoticiasService', [
      'crear',
      'subirImagen',
      'obtenerPorId'
    ]);
    
    mockAuthService = jasmine.createSpyObj('AuthService', ['obtenerIdUsuario']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // 🔥 Configurar respuestas mock
    mockNoticiaService.crear.and.returnValue(of({
      id: 1,
      titulo: 'Test',
      resumen: 'Test resumen',
      contenidoUrl: 'https://example.com/test.html',
      imagenDestacada: 'https://example.com/test.jpg',
      esPublica: true,
      destacada: false,
      autorId: 1,
      autorNombre: 'Test Author',
      fechaPublicacion: '2025-06-30',
      visitas: 0
    }));
    
    mockAuthService.obtenerIdUsuario.and.returnValue(1);

    await TestBed.configureTestingModule({
      imports: [
        CrearNoticiaComponent,
        HttpClientTestingModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: NoticiasService, useValue: mockNoticiaService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: AsignacionSeccionService, useValue: jasmine.createSpyObj('AsignacionSeccionService', ['method']) }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearNoticiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('🔥 debería crear noticia usando método correcto', () => {
    // Arrange
    component.form.patchValue({
      titulo: 'Test Noticia',
      resumen: 'Test resumen',
      contenidoHtml: '<p>Contenido de prueba</p>',
      esPublica: true
    });

    // Act
    component.publicarNoticia();

    // Assert
    expect(mockNoticiaService.crear).toHaveBeenCalledWith(
      jasmine.objectContaining({
        titulo: 'Test Noticia',
        resumen: 'Test resumen',
        contenidoHtml: '<p>Contenido de prueba</p>',
        esPublica: true
      })
    );
  });

  it('🔥 debería guardar borrador correctamente', () => {
    // Arrange
    component.form.patchValue({
      titulo: 'Test',
      contenidoHtml: '<p>Test</p>'
    });

    // Act
    component.guardarBorrador();

    // Assert
    expect(mockNoticiaService.crear).toHaveBeenCalledWith(
      jasmine.objectContaining({
        titulo: 'Test',
        contenidoHtml: '<p>Test</p>',
        esPublica: false
      })
    );
  });
});
