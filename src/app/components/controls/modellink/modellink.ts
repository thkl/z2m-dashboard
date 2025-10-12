import { Component, computed, input } from '@angular/core';
import { Device } from '../../../models/device';
import { DEVICES_ROOT_URL, SUPPORT_NEW_DEVICES_URL } from '../../../models/constants';
import { normalizeDeviceModel } from '../../../utils/filter.utils';

@Component({
  selector: 'ModelLink',
  imports: [],
  templateUrl: './modellink.html',
  styles:`
    .link {
      color:var(--button-text-color)
    }
  `
})
export class ModelLink {

  device = input.required<Device>();


  url = computed(() => {
    const device = this.device();
    let url = SUPPORT_NEW_DEVICES_URL;

    if (device.supported && device.definition) {
      const detailData = [
        encodeURIComponent(device.definition.vendor.toLowerCase()),
        encodeURIComponent(device.definition.model.toLowerCase()),
      ].join("-");

      url = DEVICES_ROOT_URL.replace("{id}", `${encodeURIComponent(
        normalizeDeviceModel(device.definition.model),
      )}.html#${encodeURIComponent(normalizeDeviceModel(detailData))}`)

    }
    return url;
  })

  label = computed(() => {
    const device = this.device();
    let label = device.model_id;
    if (device.supported && device.definition) {
      label = device.definition.model;
    }
    return label;
  });
}


