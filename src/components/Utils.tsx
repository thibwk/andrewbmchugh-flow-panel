import { GrafanaTheme2, colorManipulator } from '@grafana/data';
import { SvgAttribs, SvgCell } from 'components/SvgUpdater'
import { Background, HighlightFactors, Link, PanelConfigCellColor, Threshold, VariableThresholdScalars } from 'components/Config';
import { HighlightState } from './Highlighter';


export type CellIdMaker = () => string;

const gRegExpCache: Map<string, RegExp> = new Map<string, RegExp>();
const gColorCache: Map<string, number[]> = new Map<string, number[]> ();

//-----------------------------------------------------------------------------
// Cell IDs
//-----------------
// Used to create unique cell Ids from a given root
export function cellIdFactory(base: string): CellIdMaker {
  let callCount = 0;
  return function() {
    return base + (callCount++).toString();
  }
}

//-----------------------------------------------------------------------------
// URL Manipulation
//-----------------
// params to be appended must start with a ?. This function
// changes the ? to & if params already exist on the url.
export function appendUrlParams(url: string, params: string): string {
  if (url.includes('?')) {
    return url + params.replace('\?', '&');
  }
  return url + params;
}

export function isUrl(str: string) {
  try {
    return Boolean(new URL(str));
  }
  catch(err) {
    return false;
  }
}

export function createUrl(link: Link) {
  try {
    link.url = new URL(link.url, document.baseURI).href;
    return link;
  }
  catch(err) {
    console.log('invalid url link', link.url, 'error:', err);
    return undefined;
  }
}

//-----------------------------------------------------------------------------
// RegExp
//-------
export function regExpMatch(pattern: string, text: string | undefined): boolean {
  if (typeof text !== 'string') {
    return false;
  }
  else {
    let regexp = gRegExpCache.get(pattern);
    if (!regexp) {
      regexp = new RegExp(pattern);
      gRegExpCache.set(pattern, regexp);
    }
    return text.search(regexp) >= 0;
  }
}

//-----------------------------------------------------------------------------
// Color
//------

function rgbToString(rgb: number[], highlight: HighlightState, highlightFactors: HighlightFactors) {
  let brightFactor = highlight === HighlightState.Highlight ? highlightFactors.highlightRgbFactor : 1.0;
  brightFactor = Math.min(brightFactor, (255 / Math.max(1, rgb[0], rgb[1], rgb[2])));

  const alpha = (highlight === HighlightState.Lowlight) ? highlightFactors.lowlightAlphaFactor : 1.0;

  const red = Math.floor(rgb[0] * brightFactor);
  const green = Math.floor(rgb[1] * brightFactor);
  const blue = Math.floor(rgb[2] * brightFactor);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function primeColorCache(theme: GrafanaTheme2, svgAttribs: SvgAttribs, background: Background) {
  function initCache(thresholds: Threshold[] | undefined) {
    if (thresholds) {
      thresholds.forEach(function(threshold) {
        colorStringToRgb(theme, threshold.color);
      });
    }
  }

  svgAttribs.cells.forEach((cellData) => {
    initCache(cellData.cellProps.fillColor && cellData.cellProps.fillColor.thresholds);
    initCache(cellData.cellProps.labelColor && cellData.cellProps.labelColor.thresholds);
  });

  if (background.darkThemeColor) {
    colorStringToRgb(theme, background.darkThemeColor);
  }
  if (background.lightThemeColor) {
    colorStringToRgb(theme, background.lightThemeColor);
  }
}

export function colorStringToRgb(theme: GrafanaTheme2, colorStr: string) {
  let rgb = gColorCache.get(colorStr);
  if (rgb) {
    return rgb;
  }
  else {
    try {
      const colorCode = colorStr.trim();
      const preamble = colorCode.substring(0, 3).toLowerCase();
      let rgbStr = null;
      if (preamble[0] === '#') {
        rgbStr = colorManipulator.hexToRgb(colorCode);
      }
      else if (preamble === 'rgb') {
        rgbStr = colorStr;
      }
      else if (preamble === 'hsl') {
        rgbStr = colorManipulator.hslToRgb(colorCode);
      }
      else {
        rgbStr = colorManipulator.hexToRgb(theme.visualization.getColorByName(colorCode));
      }
      if (rgbStr) {
        rgb = rgbStr.replace(/[^\d,]/g, '').split(',').map(Number).slice(0, 3);
        gColorCache.set(colorStr, rgb);
      }
    }
    catch(err) {
      console.log('Unable to transform color to rgb. color =', colorStr, ', err =', err);
    }
  }
  return rgb || colorStr;
}

export function colorLookup(color: string, highlight: HighlightState, highlightFactors: HighlightFactors) {
  // We want the cached version as that's been through the grafana
  // transformations so will be correctly translated as per the theme.
  // If it's not in the cache we return the raw color and it will fallback
  // on html interpretation.
  const rgb = gColorCache.get(color);
  return rgb ? rgbToString(rgb, highlight, highlightFactors) : color;
}

export function colorGradient(color1: string, color2: string, scalar: number, highlight: HighlightState, highlightFactors: HighlightFactors) {
  const scalarBounded = isFinite(scalar) ? Math.min(1, Math.max(0, scalar)) : 1;
  const color1Vals = gColorCache.get(color1);
  const color2Vals = gColorCache.get(color2);

  if (color1Vals && color2Vals) {
    let blend = {...color1Vals};
    for (let i = 0; i < 3; i++) {
      blend[i] += ((color2Vals[i] - blend[i]) * scalarBounded);
    }
    return rgbToString(blend, highlight, highlightFactors);
  }
  else {
    // If the colors aren't in the cache they weren't translatable to rgb
    // so blending is not possible. Just return the active threshold color.
    return color1;
  }
}

export function variableThresholdScalarsInit(
  variableValues: Map<string, string>,
  cells: Map<string, SvgCell>,
  variableThresholdScalars: Map<string, VariableThresholdScalars[]>) {
  if (variableThresholdScalars) {
    // For each cellId
    cells.forEach((cell, cellIdShort) => {
      let variableRules = cell.variableThresholdScalars;
      
      // For each variable name
      variableThresholdScalars.forEach((rules, variableName) => {

        // For each variable rule
        rules.forEach((rule) => {

          // For each cellIdScope
          rule.cellIdPatternScope.forEach((pattern) => {

            // Add the rule to this cell for this variable if in scope
            if (regExpMatch(pattern, cellIdShort)) {
              let cellRules = variableRules.get(variableName);
              if (!cellRules) {
                cellRules = [];
                variableRules.set(variableName, cellRules);
                variableValues.set(variableName, '');
              }
              cellRules.push(rule);
            }
          });
        });
      });
    });
  }
}

export function variableThresholdScaleValue(variableValues: Map<string, string>, cellData: SvgCell, value: number | string | null) {
  if (typeof value !== 'number') {
    return value;
  }
  let scalar = 1.0;
  cellData.variableThresholdScalars.forEach((rules, variableName) => {
    const variableValue = variableValues.get(variableName);
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (regExpMatch(rule.variableValuePattern, variableValue)) {
        scalar *= rule.thresholdScalar || 1;
        break;
      }
    };
  });
  return value / scalar;
}

export function getColor(cellColorData: PanelConfigCellColor, value: number, highlight: HighlightState, highlightFactors: HighlightFactors) {
  if (cellColorData.thresholds && cellColorData.thresholds.length > 0) {
    const thresholds = cellColorData.thresholds;
    let threshold = thresholds[0];
    for (let i = 1; i < thresholds.length; i++) {
      threshold = thresholds[i];
      if (value < threshold.level) {
        const thresholdLwr = thresholds[i - 1];
        if (cellColorData.gradientMode === 'hue') {
          const scalar = (value - thresholdLwr.level) / (threshold.level - thresholdLwr.level);
          return colorGradient(thresholdLwr.color, threshold.color, scalar, highlight, highlightFactors);
        }
        else {
          // The only other mode is 'none'
          return colorLookup(thresholdLwr.color, highlight, highlightFactors);
        }
      }
    }
    return colorLookup(threshold.color, highlight, highlightFactors);
  }
  return null;
}

function instrumenterTimer(label: string, fn: Function) {
  return function(...args: any[]) {
    const start = performance.now();
    const fnResult = fn(...args);
    const delta = performance.now() - start;
    console.log(`Debugging time: ${label}: ${delta.toFixed(3)} ms`);
    return fnResult;
  };
}

function instrumenterPassThrough(label: string, fn: Function) {
  return function(...args: any[]) {
    return fn(...args);
   };
}

export function getInstrumenter(timer: boolean) {
  return timer ? instrumenterTimer : instrumenterPassThrough;
}
