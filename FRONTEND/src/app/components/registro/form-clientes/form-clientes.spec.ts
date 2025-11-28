import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormClientes } from './form-clientes';

describe('FormClientes', () => {
  let component: FormClientes;
  let fixture: ComponentFixture<FormClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
