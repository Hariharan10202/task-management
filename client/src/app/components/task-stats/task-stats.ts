import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-task-stats',
  templateUrl: './task-stats.html',
  styleUrl: './task-stats.css',
})
export class TaskStats implements OnChanges, AfterViewInit {
  @Input() total!: number;
  @Input() pending!: number;
  @Input() inProgress!: number;
  @Input() completed!: number;
  @Input() overdue!: number;

  @ViewChild('chartCanvas') canvas!: ElementRef;

  chart!: Chart;
  viewInitialized = false;

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.viewInitialized) {
      this.renderChart();
    }
  }

  renderChart() {
    if (!this.canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending', 'Overdue'],
        datasets: [
          {
            data: [this.completed, this.pending, this.overdue],
          },
        ],
      },
    });
  }
}
