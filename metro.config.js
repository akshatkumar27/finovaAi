const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
    // Honor `exports` conditional-subpath fields in package.json.
    // Required for lucide-react-native subpath imports (`lucide-react-native/icons/*`)
    // and any other modern package that ships only the `exports` map.
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);
