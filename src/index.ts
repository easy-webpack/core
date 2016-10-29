import {Webpack as WebpackConfig} from './webpack'
import {assign, literalReplace} from '@easy-webpack/assign'
export {get} from 'lodash'
export {Webpack as WebpackConfig} from './webpack'
export * from '@easy-webpack/assign'

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1
}

export type WebpackConfigWithMetadata = WebpackConfig & { metadata?: any }
export type EasyWebpackConfig = WebpackConfigWithMetadata | ((this: WebpackConfigWithMetadata) => WebpackConfigWithMetadata)

export function generateConfig(...configs: Array<EasyWebpackConfig>) {
  let config = {
    metadata: {
      port: process.env.WEBPACK_PORT || 9000,
      host: process.env.WEBPACK_HOST || 'localhost',
      ENV: process.env.NODE_ENV || process.env.ENV || 'development',
      HMR: hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
    }
  } as WebpackConfigWithMetadata

  for (let configMethod of configs) {
    if (typeof configMethod === 'function') {
      let overlayConfig = configMethod.apply(config) as WebpackConfigWithMetadata
      config = assign(config, overlayConfig, configMethod['name'] || 'config', 'replace')
    } else {
      let overlayConfig = configMethod
      config = assign(config, overlayConfig, configMethod['name'] || 'config', 'append')
    }
  }
  return config
}

export function stripMetadata(config: EasyWebpackConfig) {
  let overlayConfig: WebpackConfigWithMetadata
  if (typeof config === 'function') {
    overlayConfig = config.apply({})
  } else {
    overlayConfig = Object.assign({}, config)
  }
  delete overlayConfig.metadata
  return overlayConfig as WebpackConfig
}

export default generateConfig
