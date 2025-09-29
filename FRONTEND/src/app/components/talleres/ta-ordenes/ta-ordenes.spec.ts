import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaOrdenes } from './ta-ordenes';

describe('TaOrdenes', () => {
  let component: TaOrdenes;
  let fixture: ComponentFixture<TaOrdenes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaOrdenes]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaOrdenes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
