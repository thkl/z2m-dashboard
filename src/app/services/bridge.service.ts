import { effect, inject, Injectable, Signal, signal } from "@angular/core";
import { Websocket } from "./websocket";
import { ApplicationService } from "./app.service";
import { Bridge, BridgeDefinitions, Networkmap } from "../models/bridge";
import { BridgeEventStore } from "../datastore/logging.store";
import * as dummy from '../pages/networkmap/dummy';
import { Device, ReportingExt } from "../models/device";
import { createDeviceStoreExtensions, DeviceStore } from "../datastore/device.store";
import { GroupStore } from "../datastore/group.store";
import { TranslateService } from "@ngx-translate/core";
import { Group } from "../models/group";
import { GroupSceneData } from "../models/types";
import { SignalBusService } from "@/app/services/sigbalbus.service";

@Injectable({
  providedIn: 'root'
})
export class BridgeService {
  private ws = inject(Websocket);
  protected readonly appService = inject(ApplicationService);
  protected readonly eventStore = inject(BridgeEventStore);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly groupStore = inject(GroupStore);
  private translate = inject(TranslateService);
  protected readonly signalBusService = inject(SignalBusService);
  public bridgeInfo = signal<Bridge | null>(null);
  private lastSeenTimer?: number;

  private extensions = createDeviceStoreExtensions(this.deviceStore, this.translate);
  private clearSignal = this.signalBusService.onEvent<any>("clear_stores");

  constructor() {

    effect(() => {
      const cs = this.clearSignal();
      if (cs !== null && cs.data) {
        this.bridgeInfo.set(null);
        this.deviceStore.clear();
        this.groupStore.clear();
      }
    })

    this.ws.subscribeTopicCallback('bridge/info', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
          this.mergeBridgeInfo(payload, null);
          //this.bridgeInfo.set(payload);
        }
      }
    });

    this.ws.subscribeTopicCallback('bridge/definitions', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
          this.mergeBridgeInfo(null, payload);
          //this.bridgeInfo.set(payload);
        }
      }
    })


    this.ws.subscribeTopicCallback('bridge/devices', (message) => {
      if (message) {
        const { payload } = message;
        if ((payload !== null) && (Array.isArray(payload))) {
          this.addDevices(payload);
        }
      }
    });


    this.ws.subscribeTopicCallback('bridge/groups', (message) => {
      if (message) {
        const { payload } = message;
        if ((payload !== null) && (Array.isArray(payload))) {
          this.addGroups(payload);
        }
      }
    });

    this.ws.subscribeTopicCallback('bridge/logging', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
          const record = { date: new Date(), level: payload.level, message: payload.message };
          this.eventStore.addLocal(record, crypto.randomUUID());
        }
      }
    });


    this.ws.subscribeTopicCallback('bridge/response/networkmap', (message) => {
      const bridgeInfo = this.bridgeInfo();
      if (bridgeInfo) {
        console.log("set new bridgeinfo")
        this.bridgeInfo.set({ ...bridgeInfo, networkMap: message.payload.data });
      }
    });

    // "bridge/response/device/ota_update/check"

  }

  mergeBridgeInfo(bridge: Bridge | null, definitions: BridgeDefinitions | null) {
    console.log("MBI",bridge,definitions)
    const bi = this.bridgeInfo();
    const bd = definitions ?? (bi !== null ? bi.definitions : null)
    if (bridge) {
      console.log(bd);
      this.bridgeInfo.set({ ...bridge, definitions: bd });
    } else {
      this.bridgeInfo.set({ ...bi!, definitions: bd });
    }
  }

  permitJoin(time?: number): void {
    this.appService.sendBridgeRequest("bridge/request/permit_join", { device: null, time: time ?? 254 });
  }

  updateOptions(options: any): void {
    this.appService.sendBridgeRequest("bridge/request/options", options);
  }

  startTouchlinkScan(): void {
    this.appService.sendBridgeRequest("bridge/request/touchlink/scan", { value: true });
  }

  requestMap(): void {
    this.appService.sendBridgeRequest("bridge/request/networkmap", { routes: false, type: "raw" });
  }

  setDeviceTimeUpdater() {
    if (this.lastSeenTimer) {
      clearInterval(this.lastSeenTimer);
    }
    this.lastSeenTimer = setInterval(() => {
      this.extensions.updateDeviceLastSeenTime();
    }, 3000);

    this.extensions.updateDeviceLastSeenTime();
  }

  addDevices(deviceList: Device[]): void {
    console.log("Set All Devices")
    const devicelist = this.deviceStore.entities();

    // copy the old state or create an empty one
    deviceList.forEach(device => {

      // set the device option values from the bridge info devices 
      const bridgeDevice = this.bridgeInfo()?.config.devices[device.ieee_address];
      if (bridgeDevice) {
        device.options = bridgeDevice;
      }
      const oldDevice = devicelist.find(d => d.ieee_address === device.ieee_address);
      if (oldDevice) {
        device.state = oldDevice.state;
      } else {
        device.state = {
          availability: "",
          lastseenhuman: "",
          last_seen: "", linkquality: 0, battery: 0
        };
      }
    })

    this.deviceStore.addAll(deviceList);

    setTimeout(() => {
      this.setDeviceTimeUpdater();
    }, 1000);
  }

  addGroups(groupList: Group[]): void {
    // we have to do a weird little conversion .. the endpoint is everywhere a string
    // but the api will send here a number .. so just convert this little sckr
    const converted = groupList.map(group => {
      const members = group.members.map(member => {
        return { ...member, endpoint: String(member.endpoint) }
      })
      return { ...group, members }
    })
    this.groupStore.addAll(converted);
  }

  clear(): void {
    this.bridgeInfo.set(null);
  }

  saveScene(groupName: string, data: GroupSceneData) {
    return this.appService.sendBridgeRequest(`${groupName}/set`, data, false);
  }

  recallScene(groupName: string, sceneID: number) {
    return this.appService.sendBridgeRequest(`${groupName}/set`, { scene_recall: sceneID }, false);
  }

  deleteScene(groupName: string, sceneID: number) {
    return this.appService.sendBridgeRequest(`${groupName}/set`, { scene_remove: sceneID }, false);
  }

  deleteAllScenes(groupName: string) {
    return this.appService.sendBridgeRequest(`${groupName}/set`, { scene_remove_all: "" }, false);
  }

  addGroup(groupId: string, groupName: string) {
    return this.appService.sendBridgeRequest("bridge/request/group/add", { id: groupId, friendly_name: groupName });
  }

  deleteGroup(groupName: string) {
    return this.appService.sendBridgeRequest("bridge/request/group/remove", { id: groupName });
  }

  renameGroup(groupName: string, newName: string) {
    return this.appService.sendBridgeRequest("bridge/request/group/rename", { from: groupName, to: newName });
  }

  requestBackup() {
    return this.appService.sendBridgeRequest("bridge/request/backup", {});
    /**
     * result is 
     * bridge/response/backup
     * payload: {
     *  data: {
     *    zip:....
     *  },
     *  status: 'ok|error',
     *  transaction: ...
     * }
     */
  }

  requestRestart() {
    return this.appService.sendBridgeRequest("bridge/request/restart", {});
  }

  configureReporting(deviceName:string,repData:ReportingExt) {
    const data  = {
      attribute : repData.attribute,
      cluster : repData.cluster,
      endpoint : repData.endpoint,
      id : deviceName,
      maximum_report_interval:repData.maximum_report_interval,
      minimum_report_interval:repData.minimum_report_interval,
      reportable_change:repData.reportable_change
    }
    return this.appService.sendBridgeRequest("bridge/request/device/configure_reporting", data);
  }
}
