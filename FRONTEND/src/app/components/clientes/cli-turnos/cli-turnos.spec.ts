import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliTurnos } from './cli-turnos';

describe('CliTurnos', () => {
  let component: CliTurnos;
  let fixture: ComponentFixture<CliTurnos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliTurnos]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CliTurnos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
