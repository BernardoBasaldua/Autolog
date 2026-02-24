import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdenesVehiculoComponent } from './ordenes-vehiculo';

describe('OrdenesVehiculoComponent', () => {
  let component: OrdenesVehiculoComponent;
  let fixture: ComponentFixture<OrdenesVehiculoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdenesVehiculoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdenesVehiculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
