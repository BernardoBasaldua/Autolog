import { TestBed } from '@angular/core/testing';

import { RegistroTallerService } from './registro-taller.service';

describe('RegistroTallerService', () => {
  let service: RegistroTallerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistroTallerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
