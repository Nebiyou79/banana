// metro.config.js — Windows-compatible NativeWind v4 setup
// The ERR_UNSUPPORTED_ESM_URL_SCHEME error on Windows happens because
// Node's ESM loader cannot handle bare C:\ paths. We pass an absolute
// POSIX-style path for the CSS input to work around this.

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve the CSS file to an absolute path — works on Windows and Unix
const cssPath = path.join(__dirname, 'src', 'globals.css');

module.exports = withNativeWind(config, { input: cssPath });