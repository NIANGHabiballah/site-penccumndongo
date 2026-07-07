import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloppementWebComponent } from './developpement-web.component';

describe('DeveloppementWebComponent', () => {
  let component: DeveloppementWebComponent;
  let fixture: ComponentFixture<DeveloppementWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloppementWebComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeveloppementWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
