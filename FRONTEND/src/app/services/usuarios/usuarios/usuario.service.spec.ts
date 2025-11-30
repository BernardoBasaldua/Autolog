import { TestBed } from '@angular/core/testing';

import { RegistroUsuarioService } from '../usuario.service';

describe('RegistroClienteService', () => {
  let service: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistroUsuarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
