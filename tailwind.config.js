const { platformSelect } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    // Device-oriented breakpoints (points, not CSS pixels). Verified to work on
    // native: react-native-css-interop evaluates min/max-width against a viewport
    // observable seeded from Dimensions with a `change` subscription, so these
    // react live to rotation and iPad Split View resizing.
    screens: {
      sm: '380px',   // large phone
      md: '744px',   // iPad mini portrait
      lg: '1024px',  // iPad landscape / 11" portrait
      xl: '1180px',  // 11"/13" landscape
    },
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
      },
      fontFamily: {
        // Was ['SF Compact Rounded'] — a face name that does not exist, making
        // `font-rounded` a silent no-op at ~20 call sites. React Native resolves
        // fonts by family name and cannot reach iOS's rounded *design* that way
        // (it's a UIFontDescriptor trait), so this maps to the correct system
        // stack instead. If a rounded face becomes part of the identity, bundle
        // a Google font here and map weight -> family behind the primitives.
        rounded: platformSelect({ ios: "'system font'", android: 'sans-serif' }),
      },
      // Named radii so the scale has a rule instead of scattered lg/xl/2xl/3xl.
      // px, not rem — radii should not scale with the root font size.
      borderRadius: {
        field: '12px',    // text inputs
        control: '12px',  // buttons, chips-with-actions
        card: '16px',     // cards, list rows
        sheet: '24px',    // modal sheets
        pill: '9999px',   // badges, tags, circular icon buttons
      },
      // Replaces the inline 720/760/980/480 ladder.
      maxWidth: {
        sheet: '480px',
        prose: '640px',
        content: '720px',
        wide: '960px',
      },
      // Tuned depth ladder. The preset's default is rgba(0,0,0,0.35) across all
      // steps — far too heavy on #ffffff and invisible on #121212.
      //
      // IMPORTANT: the shadows plugin hardcodes `-rn-shadow-opacity: 1`, so the
      // alpha must live in the colour. And because these are static theme values
      // they CANNOT switch between light and dark like colours do — dark-mode
      // depth comes from surface -> surface-2 plus a hairline border instead.
      // Both mechanisms live inside the Card primitive; screens should not reach
      // for shadow-* directly and expect it to read in dark mode.
      boxShadow: {
        e1: '0px 1px 2px rgba(0, 0, 0, 0.06)',
        e2: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        e3: '0px 8px 24px rgba(0, 0, 0, 0.12)',
      },
      // Android counterpart, keyed to the boxShadow names above.
      elevation: {
        e1: '1',
        e2: '3',
        e3: '8',
      },
      // The native preset caps tracking-widest at 1px; section eyebrows want 2.
      letterSpacing: {
        eyebrow: '2px',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
    },
  },
  plugins: [],
};
