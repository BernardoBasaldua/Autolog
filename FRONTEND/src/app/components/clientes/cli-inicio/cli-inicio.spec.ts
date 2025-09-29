import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliInicio } from './cli-inicio';

describe('CliInicio', () => {
  let component: CliInicio;
  let fixture: ComponentFixture<CliInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliInicio]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CliInicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
