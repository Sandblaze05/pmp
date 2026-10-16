import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ToastContainer } from './toast-container/toast-container';

@Component({
  imports: [RouterOutlet, RouterLink, ToastContainer],
  standalone: true,
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  // protected readonly title = signal('pmp');
}
