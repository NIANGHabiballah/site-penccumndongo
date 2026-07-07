import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormationsProComponent } from './formations-pro.component';

describe('FormationsProComponent', () => {
  let component: FormationsProComponent;
  let fixture: ComponentFixture<FormationsProComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormationsProComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormationsProComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
