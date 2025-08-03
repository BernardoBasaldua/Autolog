import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliSelTurno } from './cli-sel-turno';

describe('CliSelTurno', () => {
  let component: CliSelTurno;
  let fixture: ComponentFixture<CliSelTurno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliSelTurno]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CliSelTurno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
