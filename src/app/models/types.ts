import { Device } from "./device";

export interface SwitchElement {
  label: string;
  value?: string;
  isActive: boolean;
}

/**
 * Represents a predefined color option in the color picker
 */
export interface ColorOption {
  /** Display name of the color */
  name: string;
  /** Hexadecimal color value */
  value: string;
}

/**
 * Represents a predefined color temperature option
 */
export interface ColorTemperatureOption {
  /** Display name of the temperature preset */
  name: string;
  /** Color temperature in mireds */
  value: number;
}


export interface RenameDeviceOptions {
  device: Device,
  newName: string,
  renameHomeAssiatant: boolean;
}

export interface RemoveDeviceOptions {
  device: Device,
  blockDevice: boolean,
  forceDelete: boolean
}

export interface SelectOption {
  isSelected:boolean;
  label:string;
  value?:string
}