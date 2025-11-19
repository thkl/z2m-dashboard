import { inject, Injectable } from "@angular/core";
import { Websocket } from "./websocket";
import { DeviceStore } from "../datastore/device.store";
import { Device, DeviceTargetState, DeviceBindingRequest, Endpoint, VisualCluster } from "../models/device";

import { ApplicationService } from "./app.service";
import { BridgeService } from "./bridge.service";
import { AddRemoveDeviceFromGroupOptions, RemoveDeviceOptions, RenameDeviceOptions } from "../models/types";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private ws = inject(Websocket);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly appService = inject(ApplicationService);
  protected readonly bridgeService = inject(BridgeService);
  protected readonly updateChecks: { [key: string]: string } = {};


  constructor() {


    this.ws.subscribeTopicCallback('*/availability', (message) => {
      const { topic, payload } = message;
      this.updateAvailability(topic, payload.state);
    });

    this.ws.subscribeTopicCallback("bridge/response/device/ota_update/check",(message)=>{
      const { topic, payload } = message;
      const ta = payload.transaction;
      if (ta) {
        const runningCheck = this.updateChecks[ta];
        if (runningCheck) {
          //this is the deviceid reset the update flag
          const device = this.deviceStore.entities().find(d=>d.ieee_address === runningCheck);
          if (device && device.update) {
            console.log("removing check",device)
            device.update.check = false;
          }
          delete this.updateChecks[ta]
        }
      }
    });

    this.ws.subscribeCatchAllCallback((message) => {
      const { topic, payload } = message;
      this.doUpdateState(topic, payload);

    });


  }

  updateAvailability(topic: string, status: string) {
    // the device is the first in the topci
    const deviceName = topic.split("/")[0];
    this.deviceStore.mergeBySearch("state/availability", status, "friendly_name", deviceName);

  }

  private doUpdateState(topic: string, state: any) {
    const splits = topic.split("/");
    if (splits.length === 1) {
      // the device is the first in the topic
      const deviceName = splits[0];
      this.deviceStore.mergeBySearch("state", state, "friendly_name", deviceName);
      if (state.update) { // also put the update date into the device data
        this.deviceStore.mergeBySearch("update", state.update, "friendly_name", deviceName)
      }
      this.bridgeService.setDeviceTimeUpdater();
    }
  }

  public updateDeviceState(deviceName: string, data: DeviceTargetState): void {
    const topic = `${deviceName}/set`;
    this.appService.sendBridgeRequest(topic, data, false);
  }


  private sendBridgeDeviceRequest(topic: string, parameters: { [key: string]: any }) {

    const payload: any = {
      transaction: crypto.randomUUID()
    }

    Object.keys(parameters).forEach(key => {
      payload[key] = parameters[key];
    })

    return this.appService.sendBridgeRequest(topic, payload);
  }

  startInterview(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/interview", {
      id: device.friendly_name,
    });
  }

  interviewCompleted(device: Device): void {

  }

  startReconfig(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/configure", {
      id: device.friendly_name,
    });
  }

  removeDevice(options: RemoveDeviceOptions): void {
    this.sendBridgeDeviceRequest("bridge/request/device/remove", { id: options.device.friendly_name, block: options.blockDevice, force: options.forceDelete });
  }

  changeDeviceDescription(device: Device): void {
    this.updateSetting(device, { description: device.description });
  }

  updateSetting(device: Device, settings: { [key: string]: any }) {
    this.sendBridgeDeviceRequest("bridge/request/device/options", {
      id: device.ieee_address,
      options: settings
    });
  }

  checkUpdate(device: Device) {
    const ta = this.sendBridgeDeviceRequest("bridge/request/device/ota_update/check", {
      id: device.friendly_name,
    });
    console.log("Adding check",ta);
    this.updateChecks[ta] = device.ieee_address;
    return ta;
  }

  performUpdate(device: Device) {
    return this.sendBridgeDeviceRequest("bridge/request/device/ota_update/update", {
      id: device.friendly_name,
    });
  }


  scheduleUpdate(device: Device) {
    return this.sendBridgeDeviceRequest("bridge/request/device/ota_update/schedule", {
      id: device.friendly_name,
    });
  }

  renameDevice(renameOptions: RenameDeviceOptions): void {
    this.sendBridgeDeviceRequest("bridge/request/device/rename", { from: renameOptions.device.friendly_name, to: renameOptions.newName, homeassistant_rename: renameOptions.renameHomeAssiatant });
  }


  addDeviceToGroup(options: AddRemoveDeviceFromGroupOptions) {
    this.appService.sendBridgeRequest("bridge/request/group/members/add", options, true);
  }


  removeDeviceFromGroup(options: AddRemoveDeviceFromGroupOptions): void {
    this.sendBridgeDeviceRequest("bridge/request/group/members/remove", options);
  }

  readEndpoint(device: Device, endpoint: number, cluster: string, attributes: string[], readOptions: any) {
    const options = {
      payload: {
        read: {
          attributes,
          cluster,
          options: readOptions
        }
      }
    }
    this.sendBridgeDeviceRequest(`${device.friendly_name}/${endpoint}/set`, options);
  }

  writeEndpoint(device: Device, endpoint: number, cluster: string, payload: any, writeOptions: any) {
    const options = {
      payload: {
        write: {
          payload,
          cluster,
          options: writeOptions
        }
      }
    }
    this.sendBridgeDeviceRequest(`${device.friendly_name}/${endpoint}/set`, options);
  }


  updateBinding(request: DeviceBindingRequest) {
    return this.sendBridgeDeviceRequest("bridge/request/device/bind", request);
  }

  removeBinding(request: DeviceBindingRequest) {
    return this.sendBridgeDeviceRequest("bridge/request/device/unbind", request);
  }


  //Some Utility Methods 


  /** Helper function to create a deep copy of cluster objects */
  copyClusterArray(clusters: VisualCluster[]): VisualCluster[] {
    return clusters.map(c => ({ ...c }));
  }


  /**
   * This will collect all valid clusters for a binding from the device with the given endpoint
   * @param device the source device
   * @param targetDevice  the target device
   * @param sourceEndpoint the source endpoint
   * @param targetEndpoint the target endpoint
   * @param bindingType the type of the binding EndDevice Coordinator or Group
   * @returns a list of valid Clusters
   */

  collectClusters(device: Device, targetDevice: Device | undefined, sourceEndpoint: string, targetEndpoint: Endpoint | undefined, bindingType: string) {
    const endpoint = device.endpoints[sourceEndpoint]; // get the source endpoint
    // get the source clusters and transform them into a list of vistual clusters
    const clusters: VisualCluster[] = [...endpoint.clusters.input, ...endpoint.clusters.output].map(c => { return { label: c, isSelected: false } });
    // if its the coordinator all clusters are our friend

    const allValid = targetDevice?.type === 'Coordinator' || bindingType === 'group';
    //
    let validClusters: VisualCluster[] = [];
    if (allValid) { // if all valid just go
      validClusters = this.copyClusterArray(clusters);
    } else {
      for (const cluster of clusters) { // loop thru the clusters
        //check if its a input to output cluster and its not allready there
        if (endpoint.clusters.input.includes(cluster.label) && targetEndpoint?.clusters.output.includes(cluster.label) && (validClusters.find(c => c.label === cluster.label) === undefined)) {
          validClusters.push({ ...cluster });
        }
        //check if its a output to input cluster and its not allready there
        if (endpoint.clusters.output.includes(cluster.label) && targetEndpoint?.clusters.input.includes(cluster.label) && (validClusters.find(c => c.label === cluster.label) === undefined)) {
          validClusters.push({ ...cluster });
        }
      }
    }
    return validClusters;
  }
}
