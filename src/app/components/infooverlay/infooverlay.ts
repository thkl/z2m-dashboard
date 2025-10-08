import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, input } from '@angular/core';

@Component({
  selector: 'InfoOverlayComponent',
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
      originY: 'center',
      overlayX: 'start',
      overlayY: 'center',
      offsetX: -100,
      offsetY: 20
    },
    {
      originX: 'center',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: 800
    }
  ];

  open():void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    this.openTimeout = setTimeout(() => {
      this.isOpen = true;
    }, 100);
  }
 close():void {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }
    this.closeTimeout = setTimeout(() => {
      this.isOpen = false;
    }, 100);
  }

  pos(event:any) {
    this.pointer = event.connectionPair.originY === 'top' ? 'tooltip-top':'tooltip-bottom'
  }
}
