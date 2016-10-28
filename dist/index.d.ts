import { Webpack as WebpackConfig } from '../webpack';
export { get } from 'lodash';
export { Webpack as WebpackConfig } from '../webpack';
export * from '@easy-webpack/assign';
export declare type WebpackConfigWithMetadata = WebpackConfig & {
    metadata: any;
};
export declare type EasyWebpackConfig = WebpackConfigWithMetadata | ((this: WebpackConfigWithMetadata) => WebpackConfigWithMetadata);
export declare function generateConfig(...configs: Array<EasyWebpackConfig>): WebpackConfigWithMetadata;
export declare function stripMetadata(config: EasyWebpackConfig): WebpackConfig;
export default generateConfig;
