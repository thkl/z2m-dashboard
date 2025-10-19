import { DeleteObjectOptions } from '@/app/models/types';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'DeleteObjectDialog',
  imports: [TranslateModule],
  templateUrl: './deleteobject.html',
  styleUrl: './deleteobject.scss'
})
export class DeleteObjectDialog {
  translate = inject(TranslateService);
  dialogRef = inject<DialogRef<DeleteObjectOptions>>(DialogRef<DeleteObjectOptions>);
  data = inject(DIALOG_DATA);
  

    cancel(): void {
    this.dialogRef.close();
  }


  ok(): void {
    this.dialogRef.close({... this.data,delete:true});
  }

}
