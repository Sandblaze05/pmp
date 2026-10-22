import { Component, DOCUMENT, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { LucideTriangleAlert } from '@lucide/angular';

@Component({
  imports: [LucideTriangleAlert],
  selector: 'app-not-found',
  styleUrl: './not-found.css',
  templateUrl: './not-found.html',
})
export class NotFound implements OnInit, OnDestroy {
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private router: Router
  ) {}

  goBack(): void {
    this.router.navigate([''])
  }

  ngOnInit(): void {
    this.disableScroll();
  }

  ngOnDestroy(): void {
    this.enableScroll();
  }

  disableScroll(): void {
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
  }

  enableScroll(): void {
    this.renderer.removeStyle(this.document.body, 'overflow');
  }
}
