import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaClientes } from './ta-clientes';

describe('TaClientes', () => {
  let component: TaClientes;
  let fixture: ComponentFixture<TaClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaClientes]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
