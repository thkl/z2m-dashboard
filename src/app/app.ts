import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Websocket } from './services/websocket';
import { DeviceService } from './services/device.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  providers:[DeviceService],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sigbee2mqtt-dashboard');
  protected readonly ds = inject(DeviceService);
  // In your component
constructor(private ws: Websocket) {


  this.ws.connect('wss://zigbee.th-kl.de/api');
  
  
}
}
