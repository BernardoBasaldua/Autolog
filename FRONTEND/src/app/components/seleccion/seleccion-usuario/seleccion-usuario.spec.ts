import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionUsuario } from './seleccion-usuario';

describe('SeleccionUsuario', () => {
  let component: SeleccionUsuario;
  let fixture: ComponentFixture<SeleccionUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
