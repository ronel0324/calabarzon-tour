const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// payagan ang .wasm files
config.resolver.assetExts.push('wasm');

// headers para gumana ang SharedArrayBuffer
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;