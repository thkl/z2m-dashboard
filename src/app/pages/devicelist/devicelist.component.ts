import { Component, computed, inject, signal, effect } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { createStoreView } from '../../datastore/generic-store-view';
import { SearchOperator } from '../../datastore/generic.store';
import { CdkTableModule } from '@angular/cdk/table';
import { Device } from '../../models/device';
import { CDKDataSource } from '../../datastore/generic-store-ui';
import { TableSortDirective, SortEvent, SortDirection } from '../../directives/table-sort.directive';
import { sortData } from '../../utils/sort.utils';
import { filterData } from '../../utils/filter.utils';
import { SearchInput } from '../../components/controls/searchinput/searchinput';
import { OptionPanelComponent, SelectOption } from "../../components/controls/optionpanel/optionpanel";
@Component({
  selector: 'app-devicelist',
  templateUrl: './devicelist.component.html',
  styleUrl: './devicelist.component.scss',
  imports: [TranslateModule, CdkTableModule, TableSortDirective, SearchInput, OptionPanelComponent]
})
export class DeviceListComponent {

  protected readonly deviceStore = inject(DeviceStore);
  displayedColumns = ['status','icon', 'name', 'model', 'vendor', 'linkquality', 'battery', 'lastseenhuman'];

  // Sorting state
  sortColumn = signal<string>('name');
  sortDirection = signal<SortDirection>('asc');

  // Filter state
  searchText = signal<string>('');
  selectedVendors = signal<SelectOption[]>([]);
  selectedModels = signal<SelectOption[]>([]); 
  selectedPowering = signal<SelectOption[]>([]); 
  selectedAvailability = signal<SelectOption[]>([]); 


  //Filter the coordinator from the devices
  devicesView = createStoreView(this.deviceStore, {
    criteria: [
      { property: "type", value: "Coordinator", operator: "not" }
    ],
    logicalOperator: SearchOperator.AND
  }, false, undefined);

  // Filtered and sorted devices
  devices = computed<Device[]>(() => {
    const filtered = filterData<Device>(
      this.devicesView().map((d:Device)=>{

        if (d.definition && d.definition.model) {
          d.definition.image = d.definition.model.replaceAll("/","-")
        }
        return d;

      }),
      this.searchText(),
      (device) => this.getSearchableFields(device)
    );

    return sortData<Device>(
      filtered,
      this.sortColumn(),
      this.sortDirection(),
      (device, column) => this.getDeviceValue(device, column)
    );
  });

  finalyFilter = computed(()=>{
    let prefiltered = this.devices();
    let selVendorNames = this.selectedVendors().map(v=>v.label);
    let selModelNames = this.selectedModels().map(v=>v.label);
    let selPowering = this.selectedPowering().map(v=>v.label);
    let selAvailability = this.selectedAvailability().map(v=>v.label);

    if (selVendorNames.length > 0) {
  
      prefiltered = prefiltered.filter(d=>{
        return selVendorNames.indexOf(d.definition?.vendor)!==-1
      });
    }


    if (selModelNames.length > 0) {
      prefiltered = prefiltered.filter(d=>{
        return selModelNames.indexOf(d.definition?.model)!==-1
      });
    }

    if (selPowering.length > 0) {
      prefiltered = prefiltered.filter(d=>{
        return selPowering.indexOf(d.power_source)!==-1
      });
    }

    if (selAvailability.length > 0) {
      prefiltered = prefiltered.filter(d=>{
        return selAvailability.indexOf(d.state?.availability)!==-1
      });
    }

    return prefiltered;
  });


  datasource: CDKDataSource<Device> = new CDKDataSource(this.finalyFilter);

  private vendorsMap = new Map<string, SelectOption>();
  private modelMap = new Map<string,SelectOption>();
  private powerMap = new Map<string,SelectOption>();
  private avaliMap = new Map<string,SelectOption>();
  
  vendorList = computed(() => {
    const entitys = Array.from(new Set(this.deviceStore.entities()
      .map(entity => entity.definition ? entity.definition.vendor : undefined)
      .filter((e): e is string => e !== '' && e !== undefined)));

    return entitys.map(vendor => {
      if (!this.vendorsMap.has(vendor)) {
        this.vendorsMap.set(vendor, { label: vendor, isSelected: false });
      }
      return this.vendorsMap.get(vendor)!;
    });
  });

  modelList = computed(() => {
    const entitys = Array.from(new Set(this.deviceStore.entities()
      .map(entity => entity.definition ? entity.definition.model : undefined)
      .filter((e): e is string => e !== '' && e !== undefined)));

    return entitys.map(model => {
      if (!this.modelMap.has(model)) {
        this.modelMap.set(model, { label: model, isSelected: false });
      }
      return this.modelMap.get(model)!;
    });
  });


  powerOptionList = computed(() => {
    const entitys = Array.from(new Set(this.deviceStore.entities()
      .map(entity => entity.power_source)
      .filter((e): e is string => e !== '' && e !== undefined)));

    return entitys.map(pwsr => {
      if (!this.powerMap.has(pwsr)) {
        this.powerMap.set(pwsr, { label: pwsr, isSelected: false });
      }
      return this.powerMap.get(pwsr)!;
    });
  });

  availabilityList = computed(() => {
    const entitys = Array.from(new Set(this.deviceStore.entities()
      .map(entity => entity.state?.availability)
      .filter((e): e is string => e !== '' && e !== undefined)));

    return entitys.map(avent => {
      if (!this.avaliMap.has(avent)) {
        this.avaliMap.set(avent, { label: avent, isSelected: false });
      }
      return this.avaliMap.get(avent)!;
    });
  });

   

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

  applySearch(event: any): void {
    this.searchText.set(event);
  }

  getSearchableFields(device: Device): any[] {
    return [
      device.friendly_name,
      device.ieee_address,
      device.definition?.model,
      device.definition?.vendor,
      device.definition?.description,
      device.state?.availability
    ];
  }

  selectDevice(deviceID: string) {
    this.deviceStore.setSelectedEntityById(deviceID);
  }

  vendorsSelectionChanged(event:SelectOption[]) {
    this.selectedVendors.set(event.filter(v=>v.isSelected));
  }

  modelSelectionChanged(event:SelectOption[]) {
    this.selectedModels.set(event.filter(v=>v.isSelected));
  }

  powerSelectionChanged(event:SelectOption[]) {
    this.selectedPowering.set(event.filter(v=>v.isSelected));
  }

  availabilitySelectionChanged(event:SelectOption[]) {
    this.selectedAvailability.set(event.filter(v=>v.isSelected));
  }
}

