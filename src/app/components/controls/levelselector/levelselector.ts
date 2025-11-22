import { Component, input, output, ElementRef, viewChild, signal, effect, AfterViewInit, OnDestroy } from '@angular/core';

export interface LevelMarkOption {
  percent : number;
  label: string;
}


@Component({
  selector: 'LevelSelectorComponent',
  imports: [],
  templateUrl: './levelselector.html',
  styleUrl: './levelselector.scss'
})
export class LevelSelectorComponent implements AfterViewInit, OnDestroy {

    marks = input<LevelMarkOption[]>([]);
    value = input<number>(0);
    min = input<number>(0);
    max = input<number>(100);
    valueChange = output<number>();

    thumbElement = viewChild<ElementRef>('thumb');
    trackElement = viewChild<ElementRef>('track');
    currentValue = signal<number>(0); // Internal percentage (0-100)

    private isDragging = false;
    private snapThreshold = 5; // Snap within 5% of a mark

    constructor() {
        // Sync input value to internal percentage
        effect(() => {
            if (!this.isDragging) {
                const percent = this.valueToPercent(this.value());
                this.currentValue.set(percent);
            }
        });
    }

    ngAfterViewInit() {
        const thumb = this.thumbElement()?.nativeElement;
        if (thumb) {
            thumb.addEventListener('touchstart', this.onThumbTouchStart, { passive: true });
        }
    }

    ngOnDestroy() {
        const thumb = this.thumbElement()?.nativeElement;
        if (thumb) {
            thumb.removeEventListener('touchstart', this.onThumbTouchStart);
        }
    }

    private valueToPercent(value: number): number {
        const minVal = this.min();
        const maxVal = this.max();
        if (maxVal === minVal) return 0;
        return ((value - minVal) / (maxVal - minVal)) * 100;
    }

    private percentToValue(percent: number): number {
        const minVal = this.min();
        const maxVal = this.max();
        return minVal + (percent / 100) * (maxVal - minVal);
    }

    onThumbMouseDown(event: MouseEvent) {
        event.preventDefault();
        this.isDragging = true;

        // Add global mouse event listeners
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private onThumbTouchStart = () => {
        this.isDragging = true;

        // Add global touch event listeners
        document.addEventListener('touchmove', this.onTouchMove, { passive: false });
        document.addEventListener('touchend', this.onTouchEnd);
    }

    private onMouseMove = (event: MouseEvent) => {
        if (!this.isDragging) return;
        this.updatePosition(event.clientX);
    }

    private onTouchMove = (event: TouchEvent) => {
        if (!this.isDragging || event.touches.length === 0) return;
        event.preventDefault();
        this.updatePosition(event.touches[0].clientX);
    }

    private onMouseUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.snapToNearestMark();

        // Remove global listeners
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    private onTouchEnd = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.snapToNearestMark();

        // Remove global listeners
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    private updatePosition(clientX: number) {
        const track = this.trackElement()?.nativeElement;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        let percent = (offsetX / rect.width) * 100;

        // Clamp between 0 and 100
        percent = Math.max(0, Math.min(100, percent));

        this.currentValue.set(percent);
    }

    private snapToNearestMark() {
        const currentPercent = this.currentValue();
        const marksList = this.marks();

        if (marksList.length === 0) {
            // No marks, just emit the current value
            this.valueChange.emit(this.percentToValue(currentPercent));
            return;
        }

        // Find nearest mark
        let nearestMark = marksList[0];
        let minDistance = Math.abs(currentPercent - marksList[0].percent);

        for (const mark of marksList) {
            const distance = Math.abs(currentPercent - mark.percent);
            if (distance < minDistance) {
                minDistance = distance;
                nearestMark = mark;
            }
        }

        // Snap if within threshold
        if (minDistance <= this.snapThreshold) {
            this.currentValue.set(nearestMark.percent);
            this.valueChange.emit(this.percentToValue(nearestMark.percent));
        } else {
            this.valueChange.emit(this.percentToValue(currentPercent));
        }
    }

    onTrackClick(event: MouseEvent) {
        // Allow clicking on track to jump to position
        const track = event.currentTarget as HTMLElement;
        const rect = track.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        let percent = (offsetX / rect.width) * 100;

        percent = Math.max(0, Math.min(100, percent));
        this.currentValue.set(percent);
        this.snapToNearestMark();
    }
}
