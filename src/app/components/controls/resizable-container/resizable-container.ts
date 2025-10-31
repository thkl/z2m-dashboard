import { Component, OnDestroy, ElementRef, viewChild, AfterViewInit, HostBinding, input, effect, inject } from '@angular/core';
import { ApplicationService } from '../../../services/app.service';
import { SettingsService } from '@/app/services/settings.service';

export type ResizeSide = 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'app-resizable-container',
  standalone: true,
  templateUrl: './resizable-container.html',
  styleUrl: './resizable-container.scss'
})
export class ResizableContainerComponent implements OnDestroy, AfterViewInit {
  resizeSide = input<ResizeSide>('right');
  storageKey = input.required<string>();
  defaultSize = input<number>(250);
  minSize = input<number>(100);
  maxSize = input<number>(800);
  containerClass = input<string>();
  flexBehavior = input<boolean>(true); // Set to false for fixed height/width behavior
  fullHeight = input<boolean>(false); // Set to true to make container fill parent height

  @HostBinding('class.flex-mode') get isFlexMode() { return this.flexBehavior(); }
  @HostBinding('class.full-height-mode') get isFullHeightMode() { return this.fullHeight(); }

  containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');

  private currentSize: number = this.defaultSize();
  private isResizing = false;
  private startPos = 0;
  private startSize = 0;

  containerStyle = '';
  protected readonly settingsService = inject(SettingsService);   
  
  constructor() {
    // Load saved size from localStorage using effect
    effect(() => {
      const savedSize = this.settingsService.getPreference(`size_${this.storageKey()}`);
      if (savedSize) {
        this.currentSize = parseFloat(savedSize);
      } else {
        this.currentSize = this.defaultSize();
      }
      this.updateContainerStyle();
    });
  }

  ngAfterViewInit() {
    this.updateContainerStyle();
  }

  ngOnDestroy() {
    this.removeEventListeners();
  }

  private updateContainerStyle() {
    const resizeSide = this.resizeSide();
    const isVertical = resizeSide === 'top' || resizeSide === 'bottom';
    const property = isVertical ? 'height' : 'width';
    this.containerStyle = `${property}: ${this.currentSize}px;`;
  }

  startResize(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.startSize = this.currentSize;

    const resizeSide = this.resizeSide();
    // Store initial mouse position
    if (resizeSide === 'left' || resizeSide === 'right') {
      this.startPos = event.clientX;
    } else {
      this.startPos = event.clientY;
    }

    // Add global event listeners
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = resizeSide === 'left' || resizeSide === 'right' ? 'ew-resize' : 'ns-resize';
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isResizing) return;

    let delta = 0;
    const resizeSide = this.resizeSide();

    if (resizeSide === 'right') {
      delta = event.clientX - this.startPos;
    } else if (resizeSide === 'left') {
      delta = this.startPos - event.clientX;
    } else if (resizeSide === 'bottom') {
      delta = event.clientY - this.startPos;
    } else if (resizeSide === 'top') {
      delta = this.startPos - event.clientY;
    }

    let newSize = this.startSize + delta;

    // Apply constraints
    newSize = Math.max(this.minSize(), Math.min(this.maxSize(), newSize));

    this.currentSize = newSize;
    this.updateContainerStyle();
  };

  private onMouseUp = () => {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.removeEventListeners();

    // Restore body styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Save to localStorage
    this.settingsService.setPreference(`size_${this.storageKey()}`,this.currentSize.toString());
  };

  private removeEventListeners() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}
