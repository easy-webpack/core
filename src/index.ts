import {WebpackConfig} from './webpack'
import {assign, literalReplace} from '@easy-webpack/assign'
export * from './webpack'
export type EasyWebpackConfig = WebpackConfig | ((this: WebpackConfig) => WebpackConfig)

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1
}

export default function generateConfig(...configs: Array<EasyWebpackConfig>) {
  let config = {
    metadata: {
      port: process.env.WEBPACK_PORT || 8080,
      host: process.env.WEBPACK_HOST || 'localhost',
      ENV: process.env.NODE_ENV || process.env.ENV || 'development',
      HMR: hasProcessFlag('hot'),
    }
  } as WebpackConfig

  for (let configMethod of configs) {
    if (typeof configMethod === 'function') {
      let overlayConfig = configMethod.apply(config) as WebpackConfig
      config = assign(config, overlayConfig, configMethod['name'] || 'config', 'replace')
    } else {
      let overlayConfig = configMethod
      config = assign(config, overlayConfig, configMethod['name'] || 'config', 'append')
    }
  }
  return config
}