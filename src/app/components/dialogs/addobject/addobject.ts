import { AddObjectDialogData } from '@/app/models/types';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'AddObjectDialog',
  imports: [TranslateModule],
  templateUrl: './addobject.html',
  styleUrl: './addobject.scss'
})

export class AddObjectDialog {
  translate = inject(TranslateService);
  dialogRef = inject<DialogRef<AddObjectDialogData>>(DialogRef<AddObjectDialogData>);
  dialogData = inject(DIALOG_DATA);



  cancel(): void {
    this.dialogRef.close();
  }

  changeProperty(key:string,event:any) {
    if (key && event.target.value) {
        this.dialogData.data[key]=event.target.value;
    }
  }
  
  ok(): void {
    this.dialogRef.close({ ... this.dialogData, created: true });
  }

}
