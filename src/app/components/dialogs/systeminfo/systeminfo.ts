 
import { BridgeService } from '@/app/services/bridge.service';
import { DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'SystemInfoDialog',
  imports: [TranslateModule],
  templateUrl: './systeminfo.html',
  styleUrl: './systeminfo.scss',
})
export class SystemInfoDialog {
  dialogRef = inject<DialogRef<void>>(DialogRef<void>);
  private bridgeService = inject(BridgeService);

  bridgeInfo = this.bridgeService.bridgeInfo();

  close():void {
     this.dialogRef.close();
  }
}
