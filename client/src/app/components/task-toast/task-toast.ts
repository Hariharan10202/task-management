import { Component } from '@angular/core';
import { ToastService } from '../../core/services/toast/toast-service';

@Component({
  selector: 'app-task-toast',
  imports: [],
  standalone: true,
  templateUrl: './task-toast.html',
  styleUrl: './task-toast.css',
})
export class TaskToast {
  constructor(public toastService: ToastService) {}
}
