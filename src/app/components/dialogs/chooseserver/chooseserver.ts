import { Z2MServer } from '@/app/models/types';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, model } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OptionComponent } from '../../controls/option/option';
import { InfoOverlayComponent } from '../../controls/infooverlay/infooverlay';
import { TokenService } from '@/app/services/token.service';



export interface ChooseServerDialogData {
  knownServer: Z2MServer[],
  newServer?: Z2MServer
}

@Component({
  selector: 'ChooseServerDialog',
  imports: [TranslateModule, OptionComponent,InfoOverlayComponent],
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
  token = model<string|undefined>();

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

  changeToken(event:any) {
     this.token.set(event.target.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async connect(server:Z2MServer):Promise<void> {
    // Encrypt token if provided
    let encryptedToken: string | undefined;
    if (server.token) {
      encryptedToken = await this.tokenService.encryptToken(server.token);
    }

    const serverWithEncryptedToken = { ...server, token: encryptedToken };
    this.dialogRef.close({ ...this.dialogData, newServer: serverWithEncryptedToken });
  }
}
