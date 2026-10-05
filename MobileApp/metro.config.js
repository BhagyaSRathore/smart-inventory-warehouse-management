const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'lucide-react-native') {
        return context.resolveRequest(
          context,
          'lucide-react-native/dist/cjs/lucide-react-native.js',
          platform,
        );
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  config,
);