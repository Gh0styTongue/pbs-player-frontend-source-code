// Captions style types

export interface CaptionsStyleVideoJs {
  fontPercent: CaptionsFontSize;
  fontSize?: CaptionsFontSize;
  fontFamily: CaptionsFontFamilyVideoJs;
  edgeStyle: CaptionsEdgeStyle;
  color: CaptionsColor;
  fontOpacity: CaptionsFontOpacity;
  backgroundColor: CaptionsColor;
  backgroundOpacity: CaptionsBackgroundOrWindowOpacity;
  windowColor: CaptionsColor;
  windowOpacity: CaptionsBackgroundOrWindowOpacity;
}

// Captions style constants

export type CaptionsFontFamilyVideoJs =
  | 'proportionalSansSerif'
  | 'monospaceSansSerif'
  | 'proportionalSerif'
  | 'monospaceSerif'
  | 'casual'
  | 'script'
  | 'small-caps';

export type CaptionsEdgeStyle =
  | 'none'
  | 'dropshadow'
  | 'raised'
  | 'depressed'
  | 'uniform';

export type CaptionsColor =
  | '#000'
  | '#00F'
  | '#0F0'
  | '#0FF'
  | '#F00'
  | '#F0F'
  | '#FF0'
  | '#FFF';

export type CaptionsFontOpacity = '0.5' | '1';

export type CaptionsBackgroundOrWindowOpacity = '0' | '0.5' | '1';

export type CaptionsFontSize =
  | '0.50'
  | '0.75'
  | '1.00'
  | '1.25'
  | '1.50'
  | '1.75'
  | '2.00'
  | '3.00'
  | '4.00'
  | number;

/**
 * ---------------
 * State constants
 * ---------------
 */

export const CaptionsFontFamilies: CaptionsFontFamilyVideoJs[] = [
  'proportionalSansSerif',
  'monospaceSansSerif',
  'proportionalSerif',
  'monospaceSerif',
  'casual',
  'script',
  'small-caps',
];

export const CaptionsFontFamilyVideoJsLabels = {
  proportionalSansSerif: 'Proportional Sans Serif',
  monospaceSansSerif: 'Monospace Sans Serif',
  proportionalSerif: 'Proportional Serif',
  monospaceSerif: 'Monospace Serif',
  casual: 'Casual',
  script: 'Script',
  'small-caps': 'Small Caps',
};

export const CaptionsEdgeStyles: CaptionsEdgeStyle[] = [
  'none',
  'dropshadow',
  'raised',
  'depressed',
  'uniform',
];

export const CaptionsEdgeStyleLabels = {
  none: 'None',
  dropshadow: 'Dropshadow',
  raised: 'Raised',
  depressed: 'Depressed',
  uniform: 'Uniform',
};

export const CaptionsColors: CaptionsColor[] = [
  '#000',
  '#00F',
  '#0F0',
  '#0FF',
  '#F00',
  '#F0F',
  '#FF0',
  '#FFF',
];

export const CaptionColorsLabels = {
  '#000': 'Black',
  '#00F': 'Blue',
  '#0F0': 'Green',
  '#0FF': 'Bluemarine',
  '#F00': 'Red',
  '#F0F': 'Magenta',
  '#FF0': 'Yellow',
  '#FFF': 'White',
};

export const CaptionsFontOpacities: CaptionsFontOpacity[] = ['1', '0.5'];

export const CaptionsBackgroundOpacities: CaptionsBackgroundOrWindowOpacity[] =
  ['1', '0.5', '0'];

export const CaptionsWindowOpacities: CaptionsBackgroundOrWindowOpacity[] = [
  '0',
  '0.5',
  '1',
];

export const CaptionsOpacityLabels = {
  '0': 'Transparent',
  '0.5': 'Semi-Transparent',
  '1': 'Opaque',
};

export const CaptionsFontSizes: CaptionsFontSize[] = [
  '0.50',
  '0.75',
  '1.00',
  '1.25',
  '1.50',
  '1.75',
  '2.00',
  '3.00',
  '4.00',
];

export const CaptionsFontSizesLabels = {
  '0.50': '50%',
  '0.75': '75%',
  '1.00': '100%',
  '1.25': '125%',
  '1.50': '150%',
  '1.75': '175%',
  '2.00': '200%',
  '3.00': '300%',
  '4.00': '400%',
};
