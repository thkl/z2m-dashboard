import { Component, computed, effect, inject, signal } from '@angular/core';
import { Websocket } from '../../services/websocket';
import { Device } from '../../models/device';
import { DeviceStore } from '../../datastore/device.store';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

     protected readonly deviceStore = inject(DeviceStore);
 

}
