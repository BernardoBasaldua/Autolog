import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaConfig } from './ta-config';

describe('TaConfig', () => {
  let component: TaConfig;
  let fixture: ComponentFixture<TaConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaConfig]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
