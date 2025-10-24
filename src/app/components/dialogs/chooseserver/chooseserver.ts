import { Z2MServer } from '@/app/models/types';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, model } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OptionComponent } from '../../controls/option/option';



export interface ChooseServerDialogData {
  knownServer: Z2MServer[],
  newServer?: Z2MServer
}

@Component({
  selector: 'ChooseServerDialog',
  imports: [TranslateModule, OptionComponent],
  templateUrl: './chooseserver.html',
  styleUrl: './chooseserver.scss'
})
export class ChooseServerDialog {
  translate = inject(TranslateService);
  dialogRef = inject<DialogRef<ChooseServerDialogData>>(DialogRef<ChooseServerDialogData>);
  dialogData = inject(DIALOG_DATA);

  host = model<string>("");
  port = model<number>(8080);
  secure = model<boolean>(false);
  name = model<string>('localhost');

  isSecure = computed(() => {

    return {
      label: '',
      value: "true",
      isActive: this.secure() === true
    }
  })

  save(): void {
    const newServer: Z2MServer = {
      name: this.name(),
      hostname: this.host(),
      port: this.port(),
      secure: this.secure() ?? false
    }
    this.dialogRef.close({ ...this.dialogData, newServer });
  }

  changeHost(event: any) {
    this.host.set(event.target.value)
  }

  changePort(event: any) {
    this.port.set(event.target.value)
  }

  changeName(event: any) {
    this.name.set(event.target.value);
  }

  changeIsSecure(event: any) {
    this.secure.set(event.isActive);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
