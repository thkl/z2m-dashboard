import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Groupinfo } from './groupinfo';

describe('Groupinfo', () => {
  let component: Groupinfo;
  let fixture: ComponentFixture<Groupinfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Groupinfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Groupinfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
