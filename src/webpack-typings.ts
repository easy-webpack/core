export interface Test {
  /**
   * A condition may be a RegExp (tested against absolute path), a string containing the absolute path, a function(absPath): bool, or an array of one of these combined with “and”.
   */
  test?: RegExp | string | ((absPath: string) => boolean) | Array<RegExp> | Array<string> | Array<(absPath: string) => boolean>;
  exclude?: Array<string>;
  include?: Array<string>;
}

export type External = string | { [require: string]: string | boolean } | ((context, request, callback: (err: Error, result) => void) => void) | RegExp | Array<string | { [require: string]: string | boolean } | ((context, request, callback: (err: Error, result) => void) => void) | RegExp>;

export interface Loader extends Test {
  /**
   * A string of “!” separated loaders
   */
  loader?: string;
  /**
   * An array of loaders as string
   */
  loaders?: Array<string>;
}

export interface WebpackConfig {
  [index: string]: any;

  /**
   * Switch loaders to debug mode.
   */
  debug?: boolean;

  metadata?: any;
  
  /**
   * Choose a developer tool to enhance debugging.
  eval - Each module is executed with eval and //@ sourceURL.
  source-map - A SourceMap is emitted. See also output.sourceMapFilename.
  hidden-source-map - Same as source-map, but doesn’t add a reference comment to the bundle.
  inline-source-map - A SourceMap is added as DataUrl to the JavaScript file.
  eval-source-map - Each module is executed with eval and a SourceMap is added as DataUrl to the eval.
  cheap-source-map - A SourceMap without column-mappings. SourceMaps from loaders are not used.
  cheap-module-source-map - A SourceMap without column-mappings. SourceMaps from loaders are simplified to a single mapping per line.
  Prefixing @, # or #@ will enforce a pragma style. (Defaults to @ in webpack@1 and # in webpack@2; using # is recommended)
  Combinations are possible. hidden, inline, eval and pragma style are exclusive.
  i. e. cheap-module-inline-source-map, cheap-eval-source-map, #@source-map
   */
  devtool?: string;

  // deep obj.
  /**
   * The entry point for the bundle.
    If you pass a string: The string is resolved to a module which is loaded upon startup.
    If you pass an array: All modules are loaded upon startup. The last one is exported.
    If you pass an object: Multiple entry bundles are created. The key is the chunk name. The value can be a string or an array.
   */
  entry?: { [bundle: string]: string | Array<string> } | Array<string> | string;
  output?: {
    filename?: string;
    path?: string;
    publicPath?: string;
    chunkFilename?: string;
    sourceMapFilename?: string;
    devtoolModuleFilenameTemplate?: string;
    devtoolFallbackModuleFilenameTemplate?: string;
    devtoolLineToLine?: string | Test;
    hotUpdateChunkFilename?: string;
    hotUpdateMainFilename?: string;
    jsonpFunction?: string;
    hotUpdateFunction?: string;
    pathinfo?: boolean;
    library?: string;
    libraryTarget?: "var" | "this" | "commonjs" | "commonjs2" | "amd" | "umd";
    umdNamedDefine?: boolean;
    sourcePrefix?: string;
    crossOriginLoading?: boolean | "anonymous" | "use-credentials";
  };
  resolve?: {
    /**
     * The directory (absolute path) that contains your modules. May also be an array of directories. This setting should be used to add individual directories to the search path.
     */
    root?: string | Array<string>;
    /**
     * An array of directory names to be resolved to the current directory as well as its ancestors, and searched for modules. This functions similarly to how node finds “node_modules” directories. For example, if the value is ["mydir"], webpack will look in “./mydir”, “../mydir”, “../../mydir”, etc.
     */
    modulesDirectories?: Array<string>;
    fallback?: Array<string>;
    /**
     * An array of extensions that should be used to resolve modules. For example, in order to discover CoffeeScript files, your array should contain the string ".coffee".
     */
    extensions?: Array<string>;

    /**
     * Check these fields in the package.json for suitable files.
     */
    packageMains?: Array<string | Array<string>>;
    /**
     * Check these fields in the package.json for suitable files. (Webpack2)
     */
    mainFields?: Array<string | Array<string>>;
    
    /**
     * Check this field in the package.json for an object. Key-value-pairs are threaded as aliasing according to this spec.
     * https://github.com/defunctzombie/package-browser-field-spec
     */
    packageAlias?: any;

    unsafeCache?: Array<RegExp> | boolean;

    resolveLoader?: {
      modulesDirectories?: Array<string>;
      extensions?: Array<string>;
      packageMains?: Array<string>;
      mainFields?: Array<string | Array<string>>;
      alias?: { [packageName: string]: string };
      /**
       * That’s a resolveLoader only property.
       * It describes alternatives for the module name that are tried.
       */
      moduleTemplates?: Array<string>;
      /**
       * Webpack2 Equivalent of resolve.root & resolve.modulesDirectories
       */
      modules?: Array<string>;
    }

    alias?: { [packageName: string]: string }

    /**
     * Webpack2 Equivalent of resolve.root & resolve.modulesDirectories
     */
    modules?: Array<string>;
  };
  module?: {
    preLoaders?: Array<Loader>;
    loaders?: Array<Loader>;
    postLoaders?: Array<Loader>;
    noParse?: RegExp | Array<RegExp>;
    unknownContextRegExp?: RegExp;
    unknownContextCritical?: boolean;
    exprContextRegExp?: RegExp;
    exprContextCritical?: boolean;
    wrappedContextCritical?: boolean;
  };
  /**
   * Add additional plugins to the compiler.
   */
  plugins?: Array<any>;
  node?: {
    console?: boolean;
    global?: boolean;
    process?: boolean | "mock";
    Buffer?: boolean;
    __filename?: boolean | "mock";
    __dirname?: boolean | "mock";
    setImmediate?: boolean | "mock" | "empty";
    [nodeBuildin: string]: boolean | "mock" | "empty";
  };
  externals?: External | Array<External>;
  /**
    "web" Compile for usage in a browser-like environment (default)
    "webworker" Compile as WebWorker
    "node" Compile for usage in a node.js-like environment (use require to load chunks)
    "async-node" Compile for usage in a node.js-like environment (use fs and vm to load chunks async)
    "node-webkit" Compile for usage in webkit, uses jsonp chunk loading but also supports builtin node.js modules plus require(“nw.gui”) (experimental)
    "electron" Compile for usage in Electron – supports require-ing Electron-specific modules.
    "electron-renderer" Compile for electron renderer process, provide a target using JsonpTemplatePlugin, FunctionModulePlugin for browser environment and NodeTargetPlugin and ExternalsPlugin for commonjs and electron bulit-in modules. Note: need webpack >= 1.12.15.
   */
  target?: "web" | "webworker" | "node" | "async-node" | "node-webkit" | "electron" | "electron-renderer" | ((compiler) => void);

  /**
   * Report the first error as a hard error instead of tolerating it.
   */
  bail?: boolean;

  /**
   * Cache generated modules and chunks to improve performance for multiple incremental builds.
   * This is enabled by default in watch mode.
   * You can pass false to disable it.
   * You can pass an object to enable it and let webpack use the passed object as cache. This way you can share the cache object between multiple compiler calls. Note: Don’t share the cache between calls with different options.
   */
  cache?: boolean | Object;

  devServer?: any;
}
