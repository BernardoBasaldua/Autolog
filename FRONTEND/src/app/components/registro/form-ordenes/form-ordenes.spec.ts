import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormOrdenes} from './form-ordenes';

describe('FormOrdenes', () => {
  let component: FormOrdenes;
  let fixture: ComponentFixture<FormOrdenes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormOrdenes]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormOrdenes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
