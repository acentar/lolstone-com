const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Enable CSS for web builds
  isCSSEnabled: true,
});

// Add Buffer polyfill
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
};

// Add fallback for Node.js modules
config.resolver.fallback = {
  ...config.resolver.fallback,
  crypto: false,
  stream: false,
  util: false,
  path: false,
  fs: false,
  os: false,
  http: false,
  https: false,
  url: false,
  querystring: false,
  zlib: false,
  assert: false,
  constants: false,
};

module.exports = config;

