import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskToast } from './task-toast';

describe('TaskToast', () => {
  let component: TaskToast;
  let fixture: ComponentFixture<TaskToast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskToast],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskToast);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
