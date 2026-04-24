import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { Chart } from 'chart.js/auto';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-task-stats',
  imports: [AsyncPipe],
  templateUrl: './task-stats.html',
  styleUrl: './task-stats.css',
})
export class TaskStats implements OnInit {
  @Input() total!: Observable<number>;
  @Input() pending!: Observable<number>;
  @Input() inProgress!: Observable<number>;
  @Input() completed!: Observable<number>;
  @Input() overdue!: Observable<number>;

  @ViewChild('chartCanvas') canvas!: ElementRef;

  chart!: Chart;

  ngOnInit() {
    combineLatest([this.completed, this.pending, this.overdue]).subscribe(
      ([completed, pending, overdue]) => {
        this.renderChart(completed, pending, overdue);
      },
    );
  }

  renderChart(completed: number, pending: number, overdue: number) {
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending', 'Overdue'],
        datasets: [
          {
            data: [completed, pending, overdue],
          },
        ],
      },
    });
  }
}
