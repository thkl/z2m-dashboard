import { TableSettingsControl } from "../components/tablesettings/tablesettings";
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

export interface DeleteObjectOptions {
  title: string,
  message: string,
  objectName: string,
  delete: boolean
}

export interface AddRemoveDeviceFromGroupOptions {
  group: string;
  device: string;
  endpoint: string;
}

export interface SelectOption {
  isSelected: boolean;
  label: string;
  value?: string
}

/**
 * Defines the width constraints for a table column
 * @deprecated Use ColumnDef instead
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

/**
 * Column definition for generic table component
 */
export interface ColumnDef<T = any> {
  /** Column identifier (must be unique) */
  id: string;

  /** Display label for header (translation key) */
  label: string;

  hideLabel?: boolean;

  /** Minimum width in pixels */
  minWidth?: number;

  /** Maximum width in pixels */
  maxWidth?: number;

  /** Enable sorting for this column */
  sortable?: boolean;

  /** Sort key (defaults to id if not specified) */
  sortKey?: string;

  /** Custom sort value extractor function */
  sortValueFn?: (item: T) => any;

  /** Hide column by default */
  hidden?: boolean;

  /** CSS classes for header cell */
  headerClass?: string;

  /** CSS classes for data cell */
  cellClass?: string;
}

/**
 * Configuration for generic table component
 */
export interface TableConfig<T = any> {
  /** Column definitions */
  columns: ColumnDef<T>[];

  /** Track by function for ngFor performance */
  trackByFn?: (index: number, item: T) => any;

  /** Enable row selection/highlighting */
  selectable?: boolean;

  /** Currently selected item */
  selectedItem?: T;

  /** Row click handler */
  onRowClick?: (item: T) => void;

  /** Initial sort configuration */
  initialSort?: {
    column: string;
    direction: 'asc' | 'desc';
  };

  settingsControl?: TableSettingsControl;

}

export type SceneStoreData = {
  ID: number,
  name: string
}


export type GroupSceneData = {
  scene_store: SceneStoreData,
}



export interface AddObjectDialogData {
  control: {
    name: string,
    label: string
  }[],
  data: { [key: string]: any },
  title: string,
  message: string,
  created: boolean
}

export interface Z2MServer {
  name:string,
  secure:boolean,
  host:string,
  port:number,
  token?:string
}