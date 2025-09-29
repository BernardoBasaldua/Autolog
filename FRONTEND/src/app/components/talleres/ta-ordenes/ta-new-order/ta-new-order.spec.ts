import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaNewOrder } from './ta-new-order';

describe('TaNewOrder', () => {
  let component: TaNewOrder;
  let fixture: ComponentFixture<TaNewOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaNewOrder]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaNewOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
