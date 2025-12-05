import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormVehiculos } from './form-vehiculos';

describe('FormVehiculos', () => {
  let component: FormVehiculos;
  let fixture: ComponentFixture<FormVehiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormVehiculos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormVehiculos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
