import { Z2MServer } from '@/app/models/types';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, effect, inject, input, model } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OptionComponent } from '../../controls/option/option';
import { InfoOverlayComponent } from '../../controls/infooverlay/infooverlay';
import { TokenService } from '@/app/services/token.service';
import { SignalBusService } from '@/app/services/sigbalbus.service';



export interface ChooseServerDialogData {
  knownServer: Z2MServer[],
  newServer?: Z2MServer,
  message?: string;
}

@Component({
  selector: 'ChooseServerDialog',
  imports: [TranslateModule, OptionComponent, InfoOverlayComponent],
  templateUrl: './chooseserver.html',
  styleUrl: './chooseserver.scss'
})
export class ChooseServerDialog {
  translate = inject(TranslateService);
  dialogRef = inject<DialogRef<ChooseServerDialogData>>(DialogRef<ChooseServerDialogData>);
  dialogData = inject(DIALOG_DATA);
  tokenService = inject(TokenService);
  
  host = model<string>("");
  port = model<number>(8080);
  secure = model<boolean>(false);
  name = model<string>('localhost');
  token = model<string | undefined>();
  selectedId : string = crypto.randomUUID();

  isSecure = computed(() => {

    return {
      label: '',
      value: "true",
      isActive: this.secure() === true
    }
  })
 

  async save(): Promise<void> {
    let encryptedToken: string | undefined;

    // Encrypt token if provided
    if (this.token()) {
      encryptedToken = await this.tokenService.encryptToken(this.token()!);
    }

    const newServer: Z2MServer = {
      id:this.selectedId,
      name: this.name(),
      host: this.host(),
      port: this.port(),
      secure: this.secure() ?? false,
      token: encryptedToken
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

  changeToken(event: any) {
    this.token.set(event.target.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async connect(server: Z2MServer): Promise<void> {
    this.dialogRef.close({ ...this.dialogData, newServer: server });
  }

  async edit(server: Z2MServer) {
    this.host.set(server.host);
    this.port.set(server.port);
    this.name.set(server.name);
    this.secure.set(server.secure);
    this.selectedId = server.id ?? crypto.randomUUID();
    if (server.token) {
      let decryptedToken = await this.tokenService.decryptToken(server.token);
      console.log(server.token,decryptedToken)
      this.token.set(decryptedToken!);
    } else {
      this.token.set("")
    }
  }
}
