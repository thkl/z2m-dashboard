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
import { AddObjectDialogData, DeleteObjectOptions, GroupSceneData } from '@/app/models/types';
import { AddObjectDialog } from '@/app/components/dialogs/addobject/addobject';
import { findSmallestMissingNumber } from '@/app/utils/sort.utils';

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

  updateSceneName(sceneId: number, event: any) {
    const sceneName = event.target.value;
    if (this.group() && sceneName) {
      const idx = this.group()!.scenes.findIndex(s => s.id === sceneId);
      if (idx>-1) {
        const newScene = { ...this.group()!.scenes[idx], name: sceneName };
        console.log(newScene);
        this.group()!.scenes[idx] = newScene;
      } else {
        console.log("ID NF", sceneId)
      }
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
      width: '600px',
      panelClass: 'overlay',
      data
    });

    dialogRef.closed.subscribe((result: any) => {
      if (result !== undefined && result.delete === true) {
        this.bridgeService.deleteScene(this.group()!.friendly_name, sceneId);
      }
    });
  }

  updateScene(sceneId: number, sceneName: string) {
    const data: GroupSceneData = {
      scene_store: {
        ID: sceneId,
        name: sceneName
      },
    }
    this.bridgeService.saveScene(this.group()!.friendly_name, data)
  }

  newScene() {
    const sceneIds = (this.group() && this.group()?.scenes) ? this.group()?.scenes.map(s => s.id) : [];
    const data = {
      id: findSmallestMissingNumber(sceneIds ?? []),
      name: ''
    };

    const dialogData: AddObjectDialogData = {
      data,
      title: "ADD_SCENE",
      message: "ADD_SCENE_DATA",
      control: [{ name: "id", label: "SCENE_ID" }, { name: "name", label: "SCENE_NAME" }],
      created: false
    }


    const dialogRef = this.dialog.open(AddObjectDialog, {
      width: '600px',
      panelClass: 'overlay',
      data: dialogData
    });

    dialogRef.closed.subscribe((result: any) => {
      if (result !== undefined && result.created === true) {
        const data: GroupSceneData = {
          scene_store: {
            ID: result.data['id'],
            name: result.data['name']
          },
        }
        this.bridgeService.saveScene(this.group()!.friendly_name, data)
      }
    });
  }


  deleteAllScenes() {
    const data: DeleteObjectOptions = {
      title: "DELETE_ALL_SCENES",
      message: "WANT_DELETE_ALL_SCENES",
      objectName: "",
      delete: false,
    }

    const dialogRef = this.dialog.open(DeleteObjectDialog, {
      width: '600px',
      panelClass: 'overlay',
      data
    });

    dialogRef.closed.subscribe((result: any) => {
      if (result !== undefined && result.delete === true) {
        this.bridgeService.deleteAllScenes(this.group()!.friendly_name);
      }
    });
  }

}

