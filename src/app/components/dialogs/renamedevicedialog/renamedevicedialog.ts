import { Component, inject } from '@angular/core';

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RenameDeviceOptions, SwitchElement } from '../../../models/types';
import { OptionComponent } from '../../controls/option/option';



@Component({
  selector: 'RenamedeviceDialog',
  imports: [TranslateModule, OptionComponent],
  templateUrl: './renamedevicedialog.html',
  styleUrl: './renamedevicedialog.scss'
})

export class RenamedeviceDialog {
  deviceName: string;
  homeAssistantSwitch: SwitchElement;
  translate = inject(TranslateService);

  dialogRef = inject<DialogRef<RenameDeviceOptions>>(DialogRef<RenameDeviceOptions>);
  data = inject(DIALOG_DATA);

  constructor() {
    this.deviceName = this.data.device.friendly_name;
    this.homeAssistantSwitch = { label: this.translate.instant("RENAME HOMEASSISTANT"), isActive: false }
  }



  haOptionChanged(event: any) {
    this.data.renameHomeAssiatant = event.isActive;
  }

  changeName(event: any) {
    this.data.newName = event.target.value;
  }

  cancel(): void {
    this.dialogRef.close();
  }


  ok(): void {
    this.dialogRef.close(this.data);
  }
}