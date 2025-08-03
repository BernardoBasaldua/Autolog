import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaDetail } from './ta-detail';

describe('TaDetail', () => {
  let component: TaDetail;
  let fixture: ComponentFixture<TaDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
