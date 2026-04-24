import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskPagination } from './task-pagination';

describe('TaskPagination', () => {
  let component: TaskPagination;
  let fixture: ComponentFixture<TaskPagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskPagination],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskPagination);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
