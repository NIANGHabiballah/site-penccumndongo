import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpportunitesComponent } from './opportunites.component';

describe('OpportunitesComponent', () => {
  let component: OpportunitesComponent;
  let fixture: ComponentFixture<OpportunitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpportunitesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpportunitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
