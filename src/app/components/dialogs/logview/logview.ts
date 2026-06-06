import { BridgeEvent } from '@/app/models/bridge';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'LogViewDialog',
  imports: [TranslateModule, DatePipe],
  templateUrl: './logview.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './logview.scss',
})
export class LogViewDialog {
  dialogRef = inject<DialogRef<BridgeEvent>>(DialogRef<BridgeEvent>);
  data = inject(DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
