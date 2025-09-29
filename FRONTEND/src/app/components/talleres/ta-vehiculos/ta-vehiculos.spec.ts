import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaVehiculos } from './ta-vehiculos';

describe('TaVehiculos', () => {
  let component: TaVehiculos;
  let fixture: ComponentFixture<TaVehiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaVehiculos]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaVehiculos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
