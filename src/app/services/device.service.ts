import { inject, Injectable } from "@angular/core";
import { Websocket } from "./websocket";
import { DeviceStore } from "../datastore/device.store";
import { Device, DeviceTargetState, DeviceBindingRequest, Endpoint, VisualCluster } from "../models/device";

import { ApplicationService } from "./app.service";
import { BridgeService } from "./bridge.service";
import { AddRemoveDeviceFromGroupOptions, RemoveDeviceOptions, RenameDeviceOptions } from "../models/types";

/**
 * DeviceService manages all device-related operations and state updates.
 *
 * This service handles:
 * - Device state synchronization via WebSocket subscriptions
 * - Device operations (rename, remove, configure, update)
 * - Device cluster binding and unbinding
 * - OTA update checks and scheduling
 * - Device health monitoring
 *
 * @example
 * constructor(private deviceService: DeviceService) {}
 *
 * removeDevice(device: Device) {
 *   this.deviceService.removeDevice({
 *     device,
 *     blockDevice: true,
 *     forceDelete: false
 *   });
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private ws = inject(Websocket);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly appService = inject(ApplicationService);
  protected readonly bridgeService = inject(BridgeService);
  /** Maps transaction IDs to device IEEE addresses for tracking OTA update checks */
  protected readonly updateChecks: { [key: string]: string } = {};

  /**
   * Initializes the DeviceService by setting up WebSocket subscriptions.
   *
   * Subscribes to:
   * - Device availability updates
   * - OTA update check responses
   * - All device state changes
   * - Bridge health reports (device health status)
   */
  constructor() {


    this.ws.subscribeTopicCallback('*/availability', (message) => {
      const { topic, payload } = message;
      this.updateAvailability(topic, payload.state);
    });

    this.ws.subscribeTopicCallback("bridge/response/device/ota_update/check", (message) => {
      const { topic, payload } = message;
      const ta = payload.transaction;
      if (ta) {
        const runningCheck = this.updateChecks[ta];
        if (runningCheck) {
          //this is the deviceid reset the update flag
          const device = this.deviceStore.entities().find(d => d.ieee_address === runningCheck);
          if (device && device.update) {
            console.log("removing check", device)
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

    this.ws.subscribeTopicCallback('bridge/health', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
          if (payload.devices) {
            this.updateDeviceHealth(payload.devices)
          }
        }
      }
    });
  }

  /**
   * Updates the availability status of a device based on a topic message.
   *
   * @param topic - The MQTT topic in format "{device_name}/availability"
   * @param status - The availability status string (e.g., "online", "offline")
   */
  private updateAvailability(topic: string, status: string) {
    // Extract device name from the first part of the topic
    const deviceName = topic.split("/")[0];
    this.deviceStore.mergeBySearch("state/availability", status, "friendly_name", deviceName);
  }

  /**
   * Updates device state from a received message.
   *
   * Handles top-level device state updates (where topic is just the device name).
   * Also stores update information if present in the state payload.
   *
   * @param topic - The MQTT topic (e.g., "{device_name}" or "{device_name}/{endpoint}/...")
   * @param state - The state object containing device properties
   */
  private doUpdateState(topic: string, state: any) {
    const splits = topic.split("/");
    if (splits.length === 1) {
      // Top-level device state update (topic is just the device name)
      const deviceName = splits[0];
      this.deviceStore.mergeBySearch("state", state, "friendly_name", deviceName);

      // If the message contains update info, store it separately in the device data
      if (state.update) {
        this.deviceStore.mergeBySearch("update", state.update, "friendly_name", deviceName)
      }

      this.bridgeService.setDeviceTimeUpdater();
    }
  }


  /**
   * Updates health status for multiple devices.
   *
   * @param data - Object mapping IEEE addresses to health data
   */
  private updateDeviceHealth(data: any) {
    Object.entries(data).forEach(([ieee_address, health]) => {
      this.deviceStore.mergeBySearch("health", health, "ieee_address", ieee_address);
    });
  }



  /**
   * Updates the desired state of a device.
   *
   * @param deviceName - The friendly name of the device
   * @param data - The target state properties
   */
  public updateDeviceState(deviceName: string, data: DeviceTargetState): void {
    const topic = `${deviceName}/set`;
    this.appService.sendBridgeRequest(topic, data, false);
  }

  /**
   * Sends a bridge request with device parameters and a unique transaction ID.
   *
   * Automatically generates a unique transaction ID and merges all parameters
   * into the payload before sending to the bridge.
   *
   * @param topic - The bridge request topic (e.g., "bridge/request/device/...")
   * @param parameters - Parameters to include in the request payload
   * @returns The transaction ID for tracking the response
   */
  private sendBridgeDeviceRequest(topic: string, parameters: { [key: string]: any }) {
    // Generate a unique transaction ID for tracking responses
    const payload: any = {
      transaction: crypto.randomUUID()
    }

    // Merge all parameters into the payload
    Object.keys(parameters).forEach(key => {
      payload[key] = parameters[key];
    })

    return this.appService.sendBridgeRequest(topic, payload);
  }

  /**
   * Initiates an interview process for a device.
   *
   * @param device - The device to interview
   */
  startInterview(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/interview", {
      id: device.friendly_name,
    });
  }

  /**
   * Placeholder method called when device interview completes.
   *
   * @param device - The interviewed device
   */
  interviewCompleted(device: Device): void {
    // Placeholder for interview completion handling
  }

  /**
   * Requests device reconfiguration.
   *
   * @param device - The device to reconfigure
   */
  startReconfig(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/configure", {
      id: device.friendly_name,
    });
  }

  /**
   * Removes a device from the network.
   *
   * @param options - Removal options including whether to block and force delete
   */
  removeDevice(options: RemoveDeviceOptions): void {
    this.sendBridgeDeviceRequest("bridge/request/device/remove", {
      id: options.device.friendly_name,
      block: options.blockDevice,
      force: options.forceDelete
    });
  }

  /**
   * Updates a device's description.
   *
   * @param device - The device with updated description
   */
  changeDeviceDescription(device: Device): void {
    this.updateSetting(device, { description: device.description });
  }

  /**
   * Updates device settings/options.
   *
   * @param device - The device to update
   * @param settings - Object containing setting keys and values
   */
  updateSetting(device: Device, settings: { [key: string]: any }) {
    this.sendBridgeDeviceRequest("bridge/request/device/options", {
      id: device.ieee_address,
      options: settings
    });
  }

  /**
   * Checks for available OTA updates for a device.
   *
   * Tracks the request by storing the device's IEEE address against the transaction ID
   * for correlation with the response.
   *
   * @param device - The device to check for updates
   * @returns The transaction ID for tracking the response
   */
  checkUpdate(device: Device) {
    const ta = this.sendBridgeDeviceRequest("bridge/request/device/ota_update/check", {
      id: device.friendly_name,
    });
    // Track this update check using the transaction ID
    this.updateChecks[ta] = device.ieee_address;
    return ta;
  }

  /**
   * Performs an OTA firmware update on a device.
   *
   * @param device - The device to update
   * @returns The transaction ID for tracking the update
   */
  performUpdate(device: Device) {
    return this.sendBridgeDeviceRequest("bridge/request/device/ota_update/update", {
      id: device.friendly_name,
    });
  }

  /**
   * Schedules an OTA firmware update for a device.
   *
   * @param device - The device to schedule update for
   * @returns The transaction ID for tracking the scheduled update
   */
  scheduleUpdate(device: Device) {
    return this.sendBridgeDeviceRequest("bridge/request/device/ota_update/schedule", {
      id: device.friendly_name,
    });
  }

  /**
   * Renames a device.
   *
   * @param renameOptions - Options including the device, new name, and Home Assistant sync flag
   */
  renameDevice(renameOptions: RenameDeviceOptions): void {
    this.sendBridgeDeviceRequest("bridge/request/device/rename", {
      from: renameOptions.device.friendly_name,
      to: renameOptions.newName,
      homeassistant_rename: renameOptions.renameHomeAssiatant
    });
  }


  /**
   * Adds a device to a group.
   *
   * @param options - Group membership options including device and group information
   */
  addDeviceToGroup(options: AddRemoveDeviceFromGroupOptions) {
    this.appService.sendBridgeRequest("bridge/request/group/members/add", options, true);
  }

  /**
   * Removes a device from a group.
   *
   * @param options - Group membership options including device and group information
   */
  removeDeviceFromGroup(options: AddRemoveDeviceFromGroupOptions): void {
    this.sendBridgeDeviceRequest("bridge/request/group/members/remove", options);
  }

  /**
   * Reads attributes from a device endpoint cluster.
   *
   * @param device - The device to read from
   * @param endpoint - The endpoint number
   * @param cluster - The cluster name/ID
   * @param attributes - Array of attribute names/IDs to read
   * @param readOptions - Additional options for the read operation
   */
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

  /**
   * Writes attributes to a device endpoint cluster.
   *
   * @param device - The device to write to
   * @param endpoint - The endpoint number
   * @param cluster - The cluster name/ID
   * @param payload - The attribute payload containing values to write
   * @param writeOptions - Additional options for the write operation
   */
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

  /**
   * Creates or updates a binding between two device endpoints or a device and a group.
   *
   * @param request - The binding request containing source/target endpoints and cluster information
   * @returns The transaction ID for tracking the binding operation
   */
  updateBinding(request: DeviceBindingRequest) {
    return this.sendBridgeDeviceRequest("bridge/request/device/bind", request);
  }

  /**
   * Removes a binding between device endpoints or device and group.
   *
   * @param request - The binding request with the binding to remove
   * @returns The transaction ID for tracking the unbind operation
   */
  removeBinding(request: DeviceBindingRequest) {
    return this.sendBridgeDeviceRequest("bridge/request/device/unbind", request);
  }


  // ==================== Utility Methods ====================

  /**
   * Creates a shallow copy of an array of visual cluster objects.
   *
   * @param clusters - The cluster array to copy
   * @returns A new array with copied cluster objects
   */
  copyClusterArray(clusters: VisualCluster[]): VisualCluster[] {
    return clusters.map(c => ({ ...c }));
  }

  /**
   * Collects all valid clusters for a binding between two endpoints.
   *
   * Validates cluster compatibility based on binding type:
   * - For Coordinator targets or group bindings: all clusters are valid
   * - For device-to-device bindings: validates input/output cluster matching
   *   (input cluster on source must match output on target, and vice versa)
   *
   * @param device - The source device containing the source endpoint
   * @param targetDevice - The target device (undefined for group bindings)
   * @param sourceEndpoint - The source endpoint identifier
   * @param targetEndpoint - The target endpoint (undefined for Coordinator or group)
   * @param bindingType - The type of binding: "device", "group", or "Coordinator"
   * @returns Array of valid clusters available for binding
   */
  collectClusters(device: Device, targetDevice: Device | undefined, sourceEndpoint: string, targetEndpoint: Endpoint | undefined, bindingType: string) {
    // Get the source endpoint from the device
    const endpoint = device.endpoints[sourceEndpoint];

    // Collect all clusters from source endpoint (both input and output)
    const clusters: VisualCluster[] = [...endpoint.clusters.input, ...endpoint.clusters.output]
      .map(c => ({ label: c, isSelected: false }));

    // All clusters are valid for Coordinator targets or group bindings
    const allValid = targetDevice?.type === 'Coordinator' || bindingType === 'group';

    let validClusters: VisualCluster[] = [];

    if (allValid) {
      // Use all clusters for Coordinator or group bindings
      validClusters = this.copyClusterArray(clusters);
    } else {
      // For device-to-device bindings, validate cluster compatibility
      for (const cluster of clusters) {
        // Input cluster on source must match output on target
        if (endpoint.clusters.input.includes(cluster.label) &&
            targetEndpoint?.clusters.output.includes(cluster.label) &&
            !validClusters.find(c => c.label === cluster.label)) {
          validClusters.push({ ...cluster });
        }

        // Output cluster on source must match input on target
        if (endpoint.clusters.output.includes(cluster.label) &&
            targetEndpoint?.clusters.input.includes(cluster.label) &&
            !validClusters.find(c => c.label === cluster.label)) {
          validClusters.push({ ...cluster });
        }
      }
    }

    return validClusters;
  }
}
