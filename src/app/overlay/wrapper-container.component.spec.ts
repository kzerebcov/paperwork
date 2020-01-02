import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WrapperContainerComponent } from './wrapper-container.component';

describe('WrapperContainerComponent', () => {
  let component: WrapperContainerComponent;
  let fixture: ComponentFixture<WrapperContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapperContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
