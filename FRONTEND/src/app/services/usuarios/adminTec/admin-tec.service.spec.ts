import { TestBed } from '@angular/core/testing';

import { AdminTecService } from './admin-tec.service';

describe('AdminTecService', () => {
  let service: AdminTecService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminTecService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
