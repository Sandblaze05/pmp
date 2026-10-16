import { Component, inject } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { Toast } from '../toast';

@Component({
  imports: [LucideX],
  selector: 'app-toast-container',
  styleUrl: './toast-container.css',
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  protected toastService = inject(Toast);
}
