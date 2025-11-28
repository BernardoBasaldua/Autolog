import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTalleres } from './form-talleres';

describe('FormTalleres', () => {
  let component: FormTalleres;
  let fixture: ComponentFixture<FormTalleres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTalleres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTalleres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
