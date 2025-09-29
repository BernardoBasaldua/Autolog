import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliPm } from './cli-pm';

describe('CliPm', () => {
  let component: CliPm;
  let fixture: ComponentFixture<CliPm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliPm]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CliPm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
