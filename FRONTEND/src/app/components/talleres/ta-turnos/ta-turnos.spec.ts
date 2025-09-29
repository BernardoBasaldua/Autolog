import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaTurnos } from './ta-turnos';

describe('TaTurnos', () => {
  let component: TaTurnos;
  let fixture: ComponentFixture<TaTurnos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaTurnos]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaTurnos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
