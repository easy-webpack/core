import {Webpack as WebpackConfig} from './webpack'
import {assign, literalReplace} from '@easy-webpack/assign'
export {get} from 'lodash'
export {Webpack as WebpackConfig} from './webpack'
export * from '@easy-webpack/assign'

function hasProcessFlag(flag) {
  return process.argv.join('').indexOf(flag) > -1
}

export const mergeSummary = { dependencies: [], merged: [], skipped: [] }
export interface ConfigDescription {
  name?: string
  dependencies?: Array<string>
  description?: string
  enabled?: undefined | boolean | ((config?: WebpackConfig) => boolean)
  action?: 'append' | 'prepend' | 'replace' | ((previousConfig: WebpackConfig, thisConfig?: WebpackConfig, name?: string) => WebpackConfig)
}

export const description = '📄'
export type WebpackConfigWithDescription = WebpackConfig & { '📄'?: ConfigDescription }

export function merge(config: WebpackConfig, ...configs: Array<WebpackConfigWithDescription>) {
  mergeSummary.dependencies = []
  mergeSummary.merged = []
  mergeSummary.skipped = []
  let i = 0
  for (let overlayConfig of configs) {
    let configDescription = overlayConfig[description] || { }
    let name = configDescription.name || `unnamed config ${String(i++)}`
    let enabled = configDescription.enabled
    let action = configDescription.action || 'append'
    if (configDescription.dependencies && configDescription.dependencies.length) {
      mergeSummary.dependencies.push(...overlayConfig[description].dependencies)
    }
    delete overlayConfig[description]
    if (enabled === undefined || enabled === true || (typeof enabled === 'function' && enabled(config))) {
      config = typeof action === 'function' ? action(config, overlayConfig, name) : assign(config, overlayConfig, name, action)
      mergeSummary.merged.push(name)
    } else {
      mergeSummary.skipped.push(name)
    }
  }
  return config
}

/**
 * Below are backwards compatibile easy-webpack configs:
 */

/**
 * A webpack config object with optional 'metadata'
 */
export type WebpackConfigWithMetadata = WebpackConfig & { metadata?: any }
export type EasyWebpackConfig = WebpackConfigWithMetadata | ((this: WebpackConfigWithMetadata) => WebpackConfigWithMetadata)
export const generateConfigOptions = { addDefaultMetadata: true, alwaysAddBaseMetadata: false }

export function generateConfig(...configs: Array<EasyWebpackConfig>) {
  let config = {} as WebpackConfigWithMetadata
  if (generateConfigOptions.alwaysAddBaseMetadata || (!config.metadata && generateConfigOptions.addDefaultMetadata)) {
    config.metadata = {
      port: parseInt(process.env.WEBPACK_PORT) || 9000,
      host: process.env.WEBPACK_HOST || 'localhost',
      ENV: process.env.NODE_ENV || process.env.ENV || 'development',
      HMR: hasProcessFlag('hot') || !!process.env.WEBPACK_HMR,
    }
  }

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
