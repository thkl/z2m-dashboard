export interface SwitchElement {
  label:string;
  value?:string;
  isActive:boolean;
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
