const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Fix for Firebase import.meta issue
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'crypto': 'expo-crypto',
};

config.resolver.unstable_enablePackageExports = false;

// Exclude test files from bundling
config.resolver.blacklistRE = /(.*\.test\.(js|jsx|ts|tsx)|.*\.spec\.(js|jsx|ts|tsx))$/;

module.exports = withNativeWind(config, { input: './global.css' });