import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input } from '@angular/core';



export interface ModalDialogData {
  title: string;
  message: string;
  okMessage?: string;
  okClass?:string;
  cancelMessage?: string;
  cancelClass?:string;
  showCancel:boolean;
}


@Component({
  selector: 'ModalDialog',
  imports: [],
  templateUrl: './modaldialog.html',
  styleUrl: './modaldialog.scss'
})


export class ModalDialog {
  dialogRef = inject<DialogRef<ModalDialogData>>(DialogRef<ModalDialogData>);
  data = inject(DIALOG_DATA);


  cancel():void {
    this.dialogRef.close();
  }

  ok():void {
    this.dialogRef.close(this.data);
  }
}
