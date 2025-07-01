import { TestBed } from '@angular/core/testing';

import { PartidosService } from '../../core/services/partidos.service';

describe('PartidoService', () => {
  let service: PartidosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartidosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
