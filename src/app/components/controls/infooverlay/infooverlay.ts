import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, input } from '@angular/core';

@Component({
  selector: 'InfoOverlayComponent',
  standalone: true,
  imports: [OverlayModule],
  templateUrl: './infooverlay.html',
  styleUrl: './infooverlay.scss'
})
export class InfoOverlayComponent {
  public isOpen = false;
  message = input.required<string>()
  pointer = 'tooltip-top';
  private openTimeout?: ReturnType<typeof setTimeout>;
  private closeTimeout?: ReturnType<typeof setTimeout>;

  positions: ConnectedPosition[] = [
    {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -8
    },
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: 8
    }
  ];

  toggle():void {
    if (this.isOpen) {
      this.closeImmediate();
    } else {
      this.openImmediate();
    }
  }

  openImmediate():void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }
    this.isOpen = true;
  }

  closeImmediate():void {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    this.isOpen = false;
  }

  open():void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
    }
    this.openTimeout = setTimeout(() => {
      this.isOpen = true;
    }, 200);
  }

 close():void {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.closeTimeout = setTimeout(() => {
      this.isOpen = false;
    }, 300);
  }

  pos(event:any) {
    this.pointer = event.connectionPair.originY === 'top' ? 'tooltip-top':'tooltip-bottom'
  }
}
