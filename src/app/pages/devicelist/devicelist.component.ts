import { Component, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { Expansionpanel } from '../../components/expansionpanel/expansionpanel';
import { createStoreView } from '../../datastore/generic-store-view';
import { SearchOperator } from '../../datastore/generic.store';
import { CdkTableModule, DataSource } from '@angular/cdk/table';
import { Device } from '../../models/device';
import { BehaviorSubject, Observable } from 'rxjs';
import { CDKDataSource } from '../../datastore/generic-store-ui';
import { TableSortDirective, SortEvent, SortDirection } from '../../directives/table-sort.directive';
import { sortData } from '../../utils/sort.utils';
@Component({
  selector: 'app-devicelist',
  templateUrl: './devicelist.component.html',
  styleUrl: './devicelist.component.scss',
  imports: [TranslateModule, Expansionpanel, CdkTableModule, TableSortDirective]
})
export class DeviceListComponent {

  protected readonly deviceStore = inject(DeviceStore);
  displayedColumns = ['icon', 'name', 'model', 'vendor', 'availability', 'linkquality', 'battery', 'lastseenhuman'];

  // Sorting state
  sortColumn = signal<string>('');
  sortDirection = signal<SortDirection>('');

  //Filter the coordinator from the devices
  devicesView = createStoreView(this.deviceStore, {
    criteria: [
      { property: "type", value: "Coordinator", operator: "not" }
    ],
    logicalOperator: SearchOperator.AND
  }
    , false, undefined);

  // Sorted devices
  devices = computed<Device[]>(() => {
    return sortData<Device>(
      this.devicesView(),
      this.sortColumn(),
      this.sortDirection(),
      (device, column) => this.getDeviceValue(device, column)
    );
  });

  datasource: CDKDataSource<Device> = new CDKDataSource(this.devices);



  manufacturers = computed(() => {
    return new Set(this.deviceStore.entities().map(entity => entity.definition ? entity.definition.vendor : undefined));
  });


  models = computed(() => {
    return new Set(this.deviceStore.entities().map(entity => entity.definition ? entity.definition.model : undefined));
  })

  selectedDevice = computed(() => {
    return this.deviceStore.selectedEntity();
  })

  constructor() {
    effect(() => {
      const devices = this.devices();

    });
  }

  trackByFn(index: number, item: Device): string {
    return item.friendly_name || item.ieee_address; // Use unique identifier
  }

  onSort(event: SortEvent) {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  getDeviceValue(device: Device, column: string): any {
    switch (column) {
      case 'name':
        return device.friendly_name?.toLowerCase() || '';
      case 'model':
        return device.definition?.model?.toLowerCase() || '';
      case 'vendor':
        return device.definition?.vendor?.toLowerCase() || '';
      case 'availability':
        return device.state?.availability?.toLowerCase() || '';
      case 'linkquality':
        return device.state?.linkquality ?? -1;
      case 'battery':
        return device.state?.battery ?? -1;
      case 'lastseenhuman':
        return device.state?.last_seen ?? 0;
      default:
        return '';
    }
  }

  selectDevice(deviceID: string) {
    this.deviceStore.setSelectedEntityById(deviceID);
  }
}

