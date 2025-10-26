/**
 * Color conversion utilities for Zigbee2MQTT dashboard
 * Supports conversions between RGB, HSV (Hue/Saturation/Value), and XY color spaces
 */

import { DeviceFeature } from "@/app/models/device";

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface XY {
  x: number; // 0-1
  y: number; // 0-1
}

/**
 * Convert HTML RGB color string to RGB object
 * @param htmlColor - HTML color string (e.g., '#FF5733' or 'rgb(255, 87, 51)')
 */
export function htmlToRgb(htmlColor: string): RGB {
  let r = 0, g = 0, b = 0;

  // Handle hex format
  if (htmlColor.startsWith('#')) {
    const hex = htmlColor.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }
  // Handle rgb() format
  else if (htmlColor.startsWith('rgb')) {
    const match = htmlColor.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    }
  }

  return { r, g, b };
}

/**
 * Convert RGB object to HTML hex color string
 */
export function rgbToHtml(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSV (Hue/Saturation/Value)
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Convert RGB to XY color space (CIE 1931)
 * Uses Rec. 709 (sRGB) color space with D65 white point
 */
export function rgbToXy(rgb: RGB): XY {
  // Apply gamma correction
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ using Wide RGB D65 conversion matrix
  const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  const sum = X + Y + Z;

  if (sum === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: X / sum,
    y: Y / sum
  };
}

/**
 * Convert XY color space to RGB
 * Uses brightness value (Y) for reconstruction. Defaults to full brightness.
 */
export function xyToRgb(xy: XY, brightness: number = 254): RGB {
  const z = 1.0 - xy.x - xy.y;
  const Y = brightness / 254;
  const X = (Y / xy.y) * xy.x;
  const Z = (Y / xy.y) * z;

  // Convert XYZ to RGB using Wide RGB D65 conversion matrix
  let r = X * 3.2404542 + Y * -1.5371385 + Z * -0.4985314;
  let g = X * -0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  let b = X * 0.0556434 + Y * -0.2040259 + Z * 1.0572252;

  // Apply reverse gamma correction
  r = r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055;

  // Clamp values to [0, 1] and scale to [0, 255]
  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255)
  };
}

// High-level conversion functions

/**
 * Convert HTML RGB color to HSV
 */
export function htmlRgbToHsv(htmlColor: string): HSV {
  return rgbToHsv(htmlToRgb(htmlColor));
}

/**
 * Convert HTML RGB color to XY
 */
export function htmlRgbToXy(htmlColor: string): XY {
  return rgbToXy(htmlToRgb(htmlColor));
}

/**
 * Convert XY to HTML RGB color
 */
export function xyToHtmlRgb(xy: XY, brightness?: number): string {
  return rgbToHtml(xyToRgb(xy, brightness));
}

/**
 * Convert HSV to HTML RGB color
 */
export function hsvToHtmlRgb(hsv: HSV): string {
  return rgbToHtml(hsvToRgb(hsv));
}

/**
 * Convert color temperature in mireds to Kelvin
 * @param mireds - Color temperature in mireds (micro reciprocal degrees)
 * @returns Color temperature in Kelvin
 */
export function miredToKelvin(mireds: number): number {
  return Math.round(1000000 / mireds);
}

/**
 * Convert color temperature in Kelvin to mireds
 * @param kelvin - Color temperature in Kelvin
 * @returns Color temperature in mireds
 */
export function kelvinToMired(kelvin: number): number {
  return Math.round(1000000 / kelvin);
}

/**
 * Convert color temperature in Kelvin to RGB
 * Uses the algorithm by Tanner Helland
 * @param kelvin - Color temperature in Kelvin (1000-40000)
 * @returns RGB color object
 */
export function kelvinToRgb(kelvin: number): RGB {
  // Clamp temperature to valid range
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;

  let r: number, g: number, b: number;

  // Calculate red
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Calculate green
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));

  // Calculate blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
}

/**
 * Convert color temperature in mireds to RGB
 * @param mireds - Color temperature in mireds
 * @returns RGB color object
 */
export function miredToRgb(mireds: number): RGB {
  return kelvinToRgb(miredToKelvin(mireds));
}

/**
 * Convert color temperature in mireds to HTML hex color
 * @param mireds - Color temperature in mireds
 * @returns HTML hex color string
 */
export function miredToHtmlRgb(mireds: number): string {
  return rgbToHtml(miredToRgb(mireds));
}

/**
 * Convert color temperature in Kelvin to HTML hex color
 * @param kelvin - Color temperature in Kelvin
 * @returns HTML hex color string
 */
export function kelvinToHtmlRgb(kelvin: number): string {
  return rgbToHtml(kelvinToRgb(kelvin));
}



export function convertColorToHtml(colorFeature: DeviceFeature, value: any): string | null {
  if (!colorFeature.features) {
    return null;
  }

  // Check for hue and saturation properties
  const hasHue = colorFeature.features.some(f => f.property === 'hue');
  const hasSaturation = colorFeature.features.some(f => f.property === 'saturation');

  if (hasHue && hasSaturation && value.hue !== undefined && value.saturation !== undefined) {
    try {
      // Zigbee hue is 0-360, saturation is 0-254
      // Convert to 0-360 for hue and 0-100 for saturation
      const hsv = {
        h: value.hue,
        s: Math.round((value.saturation / 254) * 100),
        v: 100 // Assume full brightness for color display
      };
      return hsvToHtmlRgb(hsv);
    } catch (e) {
      console.error('Error converting HSV to HTML RGB:', e);
      return null;
    }
  }

  // Check for x and y properties (CIE color space)
  const hasX = colorFeature.features.some(f => f.property === 'x');
  const hasY = colorFeature.features.some(f => f.property === 'y');

  if (hasX && hasY && value.x !== undefined && value.y !== undefined) {
    try {
      // XY values are already in 0-1 range (not 0-65535)
      const xy = {
        x: value.x,
        y: value.y
      };
      return xyToHtmlRgb(xy);
    } catch (e) {
      console.error('Error converting XY to HTML RGB:', e);
      return null;
    }
  }

  return null;
}