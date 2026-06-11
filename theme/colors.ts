// SINGLE SOURCE OF TRUTH — keep in sync with global.css CSS variables.

export type ColorTokenName =
  | 'background'
  | 'surface'
  | 'surface2'
  | 'foreground'
  | 'muted'
  | 'border'
  | 'primary'
  | 'primaryForeground'
  | 'destructive';

export type ThemeColors = Record<ColorTokenName, string>;

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f2f2f7',
  surface2: '#ffffff',
  foreground: '#111111',
  muted: '#6c6c70',
  border: '#c6c6c8',
  primary: '#b8860b',
  primaryForeground: '#1a1a1a',
  destructive: '#ff3b30',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  surface2: '#2c2c2e',
  foreground: '#f5f5f5',
  muted: '#aeaeb2',
  border: '#38383a',
  primary: '#d4a017',
  primaryForeground: '#1a1a1a',
  destructive: '#ff453a',
};

// Converts `#rrggbb` or short `#rgb` to a space-separated decimal RGB triple,
// e.g. '#121212' -> '18 18 18'. Used to feed NativeWind's `vars()` so CSS
// variables consumed via `rgb(var(--token) / <alpha>)` switch reactively.
export function hexToRgbTriple(hex: string): string {
  let value = hex.replace(/^#/, '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

// Maps camelCase token keys to the CSS variable names declared in global.css.
const cssVarNames: Record<ColorTokenName, string> = {
  background: '--background',
  surface: '--surface',
  surface2: '--surface-2',
  foreground: '--foreground',
  muted: '--muted',
  border: '--border',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  destructive: '--destructive',
};

function buildVars(colors: ThemeColors): Record<string, string> {
  const result: Record<string, string> = {};
  (Object.keys(cssVarNames) as ColorTokenName[]).forEach((key) => {
    result[cssVarNames[key]] = hexToRgbTriple(colors[key]);
  });
  return result;
}

// Derived from the hex source of truth above — cannot drift from it.
export const lightVars: Record<string, string> = buildVars(lightColors);
export const darkVars: Record<string, string> = buildVars(darkColors);
