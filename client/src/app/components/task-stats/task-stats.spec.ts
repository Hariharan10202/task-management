import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskStats } from './task-stats';

describe('TaskStats', () => {
  let component: TaskStats;
  let fixture: ComponentFixture<TaskStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskStats],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
