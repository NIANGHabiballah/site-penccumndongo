import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cp2iComponent } from './cp2i.component';

describe('Cp2iComponent', () => {
  let component: Cp2iComponent;
  let fixture: ComponentFixture<Cp2iComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cp2iComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cp2iComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
