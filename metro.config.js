const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@lottiefiles/dotlottie-react': path.resolve(__dirname, 'stubs/dotlottie-react-pkg'),
};

module.exports = config;
