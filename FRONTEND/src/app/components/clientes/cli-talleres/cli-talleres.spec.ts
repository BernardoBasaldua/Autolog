import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliTalleres } from './cli-talleres';

describe('CliTalleres', () => {
  let component: CliTalleres;
  let fixture: ComponentFixture<CliTalleres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliTalleres]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CliTalleres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
