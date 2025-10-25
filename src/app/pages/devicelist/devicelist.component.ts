import { DeviceImage } from '@/app/components/controls/device/device-image/device-image';
import { TableComponent } from '@/app/components/controls/generic-table/generic-table.component';
import { OptionPanelComponent } from '@/app/components/controls/optionpanel/optionpanel';
import { ProgessBar } from '@/app/components/controls/progess-bar/progess-bar';
import { SearchInput } from '@/app/components/controls/searchinput/searchinput';
import { TableSettingsControl } from '@/app/components/tablesettings/tablesettings';
import { DeviceStore } from '@/app/datastore/device.store';
import { CDKDataSource } from '@/app/datastore/generic-store-ui';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { TableCellDirective } from '@/app/directives/table-cell.directive';
import { SortDirection, SortEvent } from '@/app/directives/table-sort.directive';
import { Device } from '@/app/models/device';
import { ColumnDef, TableConfig, SelectOption } from '@/app/models/types';
import { HexPipe } from '@/app/pipes/hex.pipe';
import { HumanReadablePipe } from '@/app/pipes/human.pipe';
import { ApplicationService } from '@/app/services/app.service';
import { BridgeService } from '@/app/services/bridge.service';
import { DeviceService } from '@/app/services/device.service';
import { filterData } from '@/app/utils/filter.utils';
import { sortData } from '@/app/utils/sort.utils';
import { Component, computed, inject, signal, effect, Signal, Injector, viewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';


const allColumns: ColumnDef<Device>[] = [
  { id: 'status', label: 'STATUS', hideLabel: true, minWidth: 30, maxWidth: 30, sortable: false },
  { id: 'icon', label: 'ICON', hideLabel: true, minWidth: 50, maxWidth: 50, sortable: false },
  { id: 'name', label: 'NAME', minWidth: 250, maxWidth: 450, sortable: true },
  { id: 'vendor', label: 'MANUFACTURER', minWidth: 150, maxWidth: 250, sortable: true },
  { id: 'model', label: 'MODEL', minWidth: 200, maxWidth: 400, sortable: true },
  { id: 'linkquality', label: 'LQI', minWidth: 60, maxWidth: 80, sortable: true },
  { id: 'battery', label: 'BATTERY', minWidth: 80, maxWidth: 120, sortable: true },
  { id: 'lastseenhuman', label: 'LAST_SEEN', minWidth: 120, maxWidth: 150, sortable: true },
  { id: 'ieee_address', label: 'IEEE_ADDRESS', minWidth: 250, maxWidth: 250, sortable: true },
  { id: 'supported', label: 'SUPPORT_STATUS', minWidth: 50, maxWidth: 100, sortable: true },
  { id: 'type', label: 'DEVICE_TYPE', minWidth: 50, maxWidth: 100, sortable: true },
  { id: 'firmware_state', label: 'FIRMWARE_STATE', minWidth: 50, maxWidth: 100, sortable: true },
];


@Component({
  selector: 'DeviceListComponent',
  templateUrl: './devicelist.component.html',
  styleUrl: './devicelist.component.scss',
  imports: [TranslateModule, SearchInput, OptionPanelComponent, DeviceImage, TableComponent, TableCellDirective, HexPipe, HumanReadablePipe, TableSettingsControl, ProgessBar]
})
export class DeviceListComponent {

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly applicationService = inject(ApplicationService);
  protected readonly injector = inject(Injector);
  protected readonly deviceService = inject(DeviceService);
  protected readonly bridgeService = inject(BridgeService);

  // Displayed columns signal for column visibility management
  displayedColumns = signal<string[]>([]);

  tableSettings = viewChild(TableSettingsControl);

  // Table configuration with column definitions
  tableConfig = computed<TableConfig<Device>>(() => {


    const selected = this.selectedDevice();
    const sortDir = this.sortDirection();
    return {
      columns: allColumns,
      trackByFn: (index: number, device: Device) => device.ieee_address || index,
      selectedItem: selected || undefined,
      onRowClick: (device: Device) => this.selectDevice(device.ieee_address),
      initialSort: {
        column: this.sortColumn(),
        direction: (sortDir === 'asc' || sortDir === 'desc') ? sortDir : 'asc'
      },
      settingsControl: this.tableSettings()
    };
  });


  bridgeInfo = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi();
  })


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
      this.devicesView().map((d: Device) => {

        if (d.definition && d.definition.model) {
          d.definition.image = d.definition.model.replaceAll("/", "-")
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

  finalyFilter = computed(() => {
    let prefiltered = this.devices();
    let selVendorNames = this.selectedVendors().map(v => v.label);
    let selModelNames = this.selectedModels().map(v => v.label);
    let selPowering = this.selectedPowering().map(v => v.label);
    let selAvailability = this.selectedAvailability().map(v => v.label);

    if (selVendorNames.length > 0) {

      prefiltered = prefiltered.filter(d => {
        return selVendorNames.indexOf(d.definition?.vendor) !== -1
      });
    }


    if (selModelNames.length > 0) {
      prefiltered = prefiltered.filter(d => {
        return selModelNames.indexOf(d.definition?.model) !== -1
      });
    }

    if (selPowering.length > 0) {
      prefiltered = prefiltered.filter(d => {
        return selPowering.indexOf(d.power_source) !== -1
      });
    }

    if (selAvailability.length > 0) {
      prefiltered = prefiltered.filter(d => {
        return selAvailability.indexOf(d.state?.availability) !== -1
      });
    }

    return prefiltered;
  });

  // Create a signal for the datasource that updates whenever finalyFilter changes
  datasourceSignal = signal<CDKDataSource<Device> | null>(null);

  get datasource(): CDKDataSource<Device> {
    return this.datasourceSignal() || new CDKDataSource(this.finalyFilter, this.injector);
  }

  private vendorsMap = new Map<string, SelectOption>();
  private modelMap = new Map<string, SelectOption>();
  private powerMap = new Map<string, SelectOption>();
  private avaliMap = new Map<string, SelectOption>();

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
    // Initialize datasource
    this.datasourceSignal.set(new CDKDataSource(this.finalyFilter, this.injector));

    // Update datasource whenever finalyFilter changes
    effect(() => {
      // Access finalyFilter to trigger effect dependency
      this.finalyFilter();
      // Create new datasource instance
      this.datasourceSignal.set(new CDKDataSource(this.finalyFilter, this.injector));
    });

    effect(() => {
      const devices = this.devices();
    });

    const cl = this.applicationService.getPreference("devicelist_columns");
    if (cl) {
      this.displayedColumns.set(cl);
    }

    this.applicationService.mainTitle = "DEVICE_VIEW";
  }

  trackByFn(index: number, item: Device): string {
    return item.friendly_name || item.ieee_address; // Use unique identifier
  }


  onSort(event: SortEvent) {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }


  columnOrderChange(newOrder: any): void {
    this.applicationService.setPreference('devicelist_columns', newOrder);
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
    this.applicationService.inspector = 'device';
  }

  vendorsSelectionChanged(event: SelectOption[]) {
    this.selectedVendors.set(event.filter(v => v.isSelected));
  }

  modelSelectionChanged(event: SelectOption[]) {
    this.selectedModels.set(event.filter(v => v.isSelected));
  }

  powerSelectionChanged(event: SelectOption[]) {
    this.selectedPowering.set(event.filter(v => v.isSelected));
  }

  availabilitySelectionChanged(event: SelectOption[]) {
    this.selectedAvailability.set(event.filter(v => v.isSelected));
  }


  permitJoin() {
    this.bridgeService.permitJoin(this.bridgeInfo()?.permit_join ? 0 : 254);
  }

}

