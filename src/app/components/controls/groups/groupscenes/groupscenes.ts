import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { GroupStore } from '@/app/datastore/group.store';
import { Group } from '@/app/models/group';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ExpansionPanelComponent } from '../../expansionpanel/expansionpanel';
import { BridgeService } from '@/app/services/bridge.service';
import { Dialog } from '@angular/cdk/dialog';
import { DeleteObjectDialog } from '@/app/components/dialogs/deleteobject/deleteobject';
import { DeleteObjectOptions } from '@/app/models/types';

@Component({
  selector: 'GroupSceneComponent',
  imports: [TranslateModule, ExpansionPanelComponent],
  templateUrl: './groupscenes.html',
  styleUrl: './groupscenes.scss'
})
export class GroupSceneComponent {
  protected readonly groupStore = inject(GroupStore);
  protected readonly bridgeService = inject(BridgeService);
  protected readonly dialog = inject(Dialog);

  group_id = input.required<number | undefined>();
  group = computed(() => {
    //Filter the coordinator from the devices
    let groupView: Signal<Group[]> = createStoreView(this.groupStore, {
      criteria: [
        { property: "id", value: this.group_id(), operator: "equals" }
      ],
      logicalOperator: SearchOperator.AND
    }, false, undefined);

    return groupView().length > 0 ? groupView()[0] : null
  });

  recallScene(sceneId: number) {
    if (this.group()) {
      this.bridgeService.recallScene(this.group()!.friendly_name, sceneId);
    }
  }


  deleteScene(sceneId: number, sceneName: string) {
    const data: DeleteObjectOptions = {
      title: "DELETE_SCENE",
      message: "WANT_DELETE_SCENE",
      objectName: sceneName,
      delete: false,
    }

    const dialogRef = this.dialog.open(DeleteObjectDialog, {
      height: '400px',
      width: '600px',
      data
    });

    dialogRef.closed.subscribe((result:any) => {
      if (result !== undefined && result.delete===true) {
        this.bridgeService.deleteScene(this.group()!.friendly_name, sceneId);
      }
    });
  }


  deleteAllScenes(){
    const data: DeleteObjectOptions = {
      title: "DELETE_ALL_SCENES",
      message: "WANT_DELETE_ALL_SCENES",
      objectName: "",
      delete: false,
    }

    const dialogRef = this.dialog.open(DeleteObjectDialog, {
      height: '400px',
      width: '600px',
      data
    });

    dialogRef.closed.subscribe((result:any) => {
      if (result !== undefined && result.delete===true) {
        this.bridgeService.deleteAllScenes(this.group()!.friendly_name);
      }
    });
  }

}
