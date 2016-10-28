"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var assign_1 = require('@easy-webpack/assign');
var lodash_1 = require('lodash');
exports.get = lodash_1.get;
__export(require('@easy-webpack/assign'));
function hasProcessFlag(flag) {
    return process.argv.join('').indexOf(flag) > -1;
}
function generateConfig() {
    var configs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        configs[_i - 0] = arguments[_i];
    }
    var config = {
        metadata: {
            port: process.env.WEBPACK_PORT || 9000,
            host: process.env.WEBPACK_HOST || 'localhost',
            ENV: process.env.NODE_ENV || process.env.ENV || 'development',
            HMR: hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
        }
    };
    for (var _a = 0, configs_1 = configs; _a < configs_1.length; _a++) {
        var configMethod = configs_1[_a];
        if (typeof configMethod === 'function') {
            var overlayConfig = configMethod.apply(config);
            config = assign_1.assign(config, overlayConfig, configMethod['name'] || 'config', 'replace');
        }
        else {
            var overlayConfig = configMethod;
            config = assign_1.assign(config, overlayConfig, configMethod['name'] || 'config', 'append');
        }
    }
    return config;
}
exports.generateConfig = generateConfig;
function stripMetadata(config) {
    var overlayConfig;
    if (typeof config === 'function') {
        overlayConfig = config.apply(config);
    }
    delete overlayConfig.metadata;
    return overlayConfig;
}
exports.stripMetadata = stripMetadata;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateConfig;
//# sourceMappingURL=index.js.map