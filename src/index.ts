import {WebpackConfig} from './webpack'
import {assign, literalReplace} from '@easy-webpack/assign'
export {get} from 'lodash'
export * from './webpack'
export * from '@easy-webpack/assign'
export type EasyWebpackConfig = WebpackConfig | ((this: WebpackConfig) => WebpackConfig)

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1
}

export function generateConfig(...configs: Array<EasyWebpackConfig>) {
  let config = {
    metadata: {
      port: process.env.WEBPACK_PORT || 9000,
      host: process.env.WEBPACK_HOST || 'localhost',
      ENV: process.env.NODE_ENV || process.env.ENV || 'development',
      HMR: hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
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

export default generateConfig;