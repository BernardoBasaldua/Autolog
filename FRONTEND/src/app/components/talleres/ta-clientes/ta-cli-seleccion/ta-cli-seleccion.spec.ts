import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaCliSeleccion } from './ta-cli-seleccion';

describe('TaCliSeleccion', () => {
  let component: TaCliSeleccion;
  let fixture: ComponentFixture<TaCliSeleccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaCliSeleccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaCliSeleccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
