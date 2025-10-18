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

/**
 * Defines the width constraints for a table column
 */
export interface TableColumnConfig {
  /** Column identifier */
  name: string;
  /** Display label for the column header */
  label: string;
  /** Minimum column width in pixels */
  minWidth: number;
  /** Maximum column width in pixels */
  maxWidth: number;
}