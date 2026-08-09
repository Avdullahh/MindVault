const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem: 16 — NativeWind defaults to 14, which silently rendered every
// rem-based class 12.5% small: `min-h-11` (the canonical Tailwind spelling of
// Apple's 44pt minimum touch target) resolved to 38.5pt, `text-2xl` to 21.
// 16 restores 1:1 parity with the design system's stated scale.
//
// Trade-off accepted: inlining freezes rem, so rem-based classes no longer
// respond to iOS Larger Text.
//
// This is a build-time Metro transform — changing it needs `npx expo start -c`
// and will not hot-reload.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
