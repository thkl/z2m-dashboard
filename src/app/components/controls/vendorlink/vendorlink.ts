import { Component, computed, input } from '@angular/core';
import { Device } from '../../../models/device';
import { SUPPORT_NEW_DEVICES_URL, VENDOR_ROOT_URL } from '../../../models/constants';

@Component({
  selector: 'VendorLink',
  imports: [],
  templateUrl: './vendorlink.html',
  styles: `
    .link {
      color:var(--button-text-color)
    }
  `
})
export class VendorLink {
  device = input.required<Device>();


  url = computed(() => {
    const device = this.device();
    let url = SUPPORT_NEW_DEVICES_URL;

    if (device.supported && device.definition) {
      url = VENDOR_ROOT_URL.replace("{id}", `${encodeURIComponent(device.definition.vendor)}`);
    }
    return url;
  })

  label = computed(() => {
    const device = this.device();
    let label = "unsupported"
    if (device.supported) {
      label = device.definition.vendor;
    }
    return label;
  });
}
