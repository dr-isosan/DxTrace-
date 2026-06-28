const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// React Native 0.81.x ships Flow-typed source files under src/
// which use private class fields (#field) and Flow annotations.
// Metro must transpile these through Babel, otherwise Hermes
// crashes with "private properties are not supported" and
// "Property 'DOMRect' doesn't exist".

const { resolver: { sourceExts, assetExts } } = config;

// Ensure JS source extensions are handled
config.resolver.sourceExts = sourceExts;

// The default transformIgnorePatterns ignores ALL of node_modules.
// We override to explicitly allow react-native's src/ to be transformed.
config.transformer = {
  ...config.transformer,
  // Override: transpile everything EXCEPT specific safe-to-skip packages
  transformIgnorePatterns: [
    // Only ignore truly pre-compiled packages; transform the rest
    // This regex means: ignore node_modules EXCEPT react-native and expo packages
    'node_modules/(?!(react-native|@react-native|react-native-.*|@expo|expo|expo-.*|@unimodules|unimodules-.*)/)',
  ],
};

module.exports = config;
