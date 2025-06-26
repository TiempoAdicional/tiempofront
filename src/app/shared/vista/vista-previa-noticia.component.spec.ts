import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaPreviaNoticiaComponent } from './vista-previa-noticia.component';

describe('VistaPreviaNoticiaComponent', () => {
  let component: VistaPreviaNoticiaComponent;
  let fixture: ComponentFixture<VistaPreviaNoticiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaPreviaNoticiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VistaPreviaNoticiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
