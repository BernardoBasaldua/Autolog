import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliConfig } from './cli-config';

describe('CliConfig', () => {
  let component: CliConfig;
  let fixture: ComponentFixture<CliConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliConfig]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CliConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
