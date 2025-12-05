import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionVehiculos } from './seleccion-vehiculos';

describe('SeleccionVehiculos', () => {
  let component: SeleccionVehiculos;
  let fixture: ComponentFixture<SeleccionVehiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionVehiculos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionVehiculos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
