import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignGraphiqueComponent } from './design-graphique.component';

describe('DesignGraphiqueComponent', () => {
  let component: DesignGraphiqueComponent;
  let fixture: ComponentFixture<DesignGraphiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignGraphiqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignGraphiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
