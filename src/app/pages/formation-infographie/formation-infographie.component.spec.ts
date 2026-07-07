import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormationInfographieComponent } from './formation-infographie.component';

describe('FormationInfographieComponent', () => {
  let component: FormationInfographieComponent;
  let fixture: ComponentFixture<FormationInfographieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormationInfographieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormationInfographieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
