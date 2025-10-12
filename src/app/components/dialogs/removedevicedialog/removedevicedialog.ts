import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OptionComponent } from '../../controls/option/option';
import { RemoveDeviceOptions, SwitchElement } from '../../../models/types';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'RemoveDeviceDialog',
  imports: [TranslateModule, OptionComponent],
  templateUrl: './removedevicedialog.html',
  styleUrl: './removedevicedialog.scss'
})
export class RemoveDeviceDialog {

  blockDevice: SwitchElement;
  forceDelete: SwitchElement;

  translate = inject(TranslateService);
  dialogRef = inject<DialogRef<RemoveDeviceOptions>>(DialogRef<RemoveDeviceOptions>);
  data = inject(DIALOG_DATA);

  constructor() {

    this.blockDevice = {label: this.translate.instant("DELETE_BLOCK_DEVICE"), isActive: this.data.blockDevice};
    this.forceDelete =  {label: this.translate.instant("DELETE_FORCE_DELETE"), isActive: this.data.forceDelete};

  }

  blockDeviceChanged(event: any) {
    this.data.blockDevice = event.isActive;
  }

  forceDeleteChanged(event: any) {
    this.data.forceDelete = event.isActive;
  }

  cancel(): void {
    this.dialogRef.close();
  }


  ok(): void {
    this.dialogRef.close(this.data);
  }
}
