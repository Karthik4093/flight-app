import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({ selector: '[appHighlight]', standalone: true })
export class HighlightDirective {
  highlightColor = input<string>('rgba(21, 101, 192, 0.08)', { alias: 'appHighlight' });
  private el = inject(ElementRef);

  @HostListener('mouseenter') onMouseEnter(): void {
    this.el.nativeElement.style.backgroundColor = this.highlightColor();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.el.nativeElement.style.backgroundColor = '';
  }
}
