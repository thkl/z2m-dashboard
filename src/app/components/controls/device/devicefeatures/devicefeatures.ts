import { DeviceStore } from '@/app/datastore/device.store';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { FeatureDisplayMode } from '@/app/models/constants';
import { AccessMode, DeviceFeatureVisual, Device, DeviceFeature, DeviceTargetState } from '@/app/models/device';
import { SelectOption, SwitchElement } from '@/app/models/types';
import { HumanReadablePipe } from '@/app/pipes/human.pipe';
import { DeviceService } from '@/app/services/device.service';
import { hsvToHtmlRgb, xyToHtmlRgb } from '@/app/utils/color.util';
import { flattenExposures, isValidForDashboard, isValidForScenes } from '@/app/utils/filter.utils';
import { Component, computed, effect, inject, input, model, signal, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColorSelectorComponent } from '../../colorselector/colorselector';
import { ColorTemperatureSelectorComponent } from '../../colortemperatureselector/colortemperatureselector';
import { DropdownComponent } from '../../dropdown/dropdown';
import { ExpansionPanelComponent } from '../../expansionpanel/expansionpanel';
import { InfoOverlayComponent } from '../../infooverlay/infooverlay';
import { LevelSelectorComponent, LevelMarkOption } from '../../levelselector/levelselector';
import { OptionComponent } from '../../option/option';
import { RadiolistComponent, RadioElement } from '../../radiolist/radiolist';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';
import { DeviceImage } from '@/app/components/controls/device/device-image/device-image';


@Component({
  selector: 'DeviceFeaturesComponent',
  imports: [TranslateModule, HumanReadablePipe, LevelSelectorComponent, InfoOverlayComponent, ExpansionPanelComponent, RadiolistComponent, OptionComponent, ColorSelectorComponent, ColorTemperatureSelectorComponent, DropdownComponent],
  templateUrl: './devicefeatures.html',
  styleUrl: './devicefeatures.scss'
})

export class DeviceFeaturesComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  readonly AccessMode = AccessMode;
  protected readonly tabManager = inject(PropertyTabManagerService);

  deviceFeatures = signal<DeviceFeatureVisual[]>([]);
  displayMode = input<FeatureDisplayMode>('settings');

  filterEndpoints = input<string[]>();

  levelMarks: LevelMarkOption[] = [{ percent: 0, label: "0" }, { percent: 25, label: "25" }, { percent: 50, label: "50" }, { percent: 75, label: "75" }, { percent: 100, label: "100" }];

  ieee_address = input.required<string | undefined>();
  device = computed(() => {
    //Filter the coordinator from the devices
    let devicesView: Signal<Device[]> = createStoreView(this.deviceStore, {
      criteria: [
        { property: "ieee_address", value: this.ieee_address(), operator: "equals" }
      ],
      logicalOperator: SearchOperator.AND
    }, false, undefined);

    return devicesView().length > 0 ? devicesView()[0] : null
  });

  constructor() {
    effect(() => {
      const expos = this.device()?.definition.exposes;
      const states = this.device()?.state;
      const endpointFilter = this.filterEndpoints();
      if (endpointFilter === undefined) {
        const result = flattenExposures(expos || [], states || []);
        this.deviceFeatures.set(result);
      } else {
        const result = flattenExposures(expos || [], states || []);

        const filtered = result.filter(f => (endpointFilter?.includes(f.property.endpoint!) || f.property.endpoint === undefined));
        this.deviceFeatures.set(filtered);
      }
    })
  }

  radioItems(property: DeviceFeature, currentValue: any): RadioElement[] {
    return property.values ? property.values.map(v => { return { label: v, isActive: v === currentValue } }) : [];
  }

  selectItems(property: DeviceFeature, currentValue: any): SelectOption[] {
    return property.values ? property.values.map(v => { return { label: v, isSelected: v === currentValue } }) : [];
  }

  switch(property: DeviceFeature, item: SwitchElement): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.property || property.name] = item.isActive ? property.value_on ?? "ON" : property.value_off ?? "OFF"
      this.deviceService.updateDeviceState(device.friendly_name, state)
    }
  }

  enumClick(property: DeviceFeature, item: RadioElement): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.property || property.name] = item ? item.label : ''
      this.deviceService.updateDeviceState(device.friendly_name, state)
    }
  }

  optionClick(property: DeviceFeature, item: SelectOption): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.property || property.name] = item ? item.label : ''
      this.deviceService.updateDeviceState(device.friendly_name, state)
    }
  }

  colorTemperatureChange(property: DeviceFeature, newTemp: number): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.property || property.name] = newTemp;
      this.deviceService.updateDeviceState(device.friendly_name, state);
    }
  }

  colorChange(property: DeviceFeature, newColor: string): void {
    if (property && property.subtype === "composite" && property.features) {
      const state: DeviceTargetState = {};
      state[property.property] = { "hex": newColor }
      if (this.device()) {
        this.deviceService.updateDeviceState(this.device()!.friendly_name, state);
      }
    }

  }

  valueChange(property: DeviceFeature, newValue: number): void {
    if (this.device()) {
      const state: DeviceTargetState = {};
      state[property.property] = newValue;
      this.deviceService.updateDeviceState(this.device()!.friendly_name, state);
    }
  }

  hasAccess(access: number, mode: AccessMode): boolean {
    return (access & mode) !== 0;
  }

  async visitDevice(): Promise<void> {
     const { DeviceInspectorComponent } = await import('@/app/pages/deviceinspector/deviceinspector.component');
   
    const device = this.device();
    if (device) {
      this.tabManager.openTab({
        id: device.ieee_address,
        label: device.friendly_name,

        data: { ieee_address: device.ieee_address },
        component: DeviceInspectorComponent,
        iconComponent: DeviceImage,
        iconData: { device }
      });
    }
  }
}
