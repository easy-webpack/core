# Easy Webpack

Creating and maintaining configuration files for [Webpack](https://webpack.github.io/) can be both intimidating and a real chore, especially for people who don't want to invest hours or even days to studying the [far-from-great-but-slowly-getting-better docs](https://webpack.github.io/docs/), testing and debugging various options, when in reality, they only wanted to get on with their **real work**: developing apps, sites or libraries.

**Easy Webpack** presents solutions to this problem to a variety of users in different ways:
- to those that simply "want things to work out of the box", by easily stacking together [pre-made *preset configs*](#the-easy-webpack-ecosystem---feature-and-configuration-presets) to achieve the desired effect
- to more advanced users, by exposing [useful helper methods](#generating-configs) that make it possible to separate concerns and make parts of the config easily extendable or conditional (e.g. based on `NODE_ENV`).

Instead of defining the Webpack configuration file as a flat, "black box" that contains all the features mixed up together in a long file of strings, objects, plugin imports and arrays, it makes it possible to **modularize** and **clean-up** the config by clearly separating individual *features* - as stackable configuration blocks, which in turn increase readability, [reusability and ease-of-maintainance](#the-easy-webpack-ecosystem---feature-and-configuration-presets).

## Usage

To install the core functionality of **easy-webpack** run the following command:

```sh
npm install @easy-webpack/core --save-dev
```

> Note: You'll also need to have `webpack` installed.

Now, you can use the Easy Webpack's core function, `generateConfig` in your `webpack.config.js` file.

```js
const generateConfig = require('@easy-webpack/core').generateConfig;
```

### Generating Configs

`generateConfig` is a helper method that can be used to generate a desired config file from different "configuration parts" or "presets" that are passed into it as arguments. The arguments can either be [simple `Objects`](#example-with-pure-objects) or [a `Function`](#object-generators), that returns the desired configuration `Object`, or a mixture of both. The order of arguments matters.

It is possible to run `generateConfig` many times consecutively, by using the output of the previous execution as the first argument of the next one. This might be useful in situations where you'd like to add a set of features  conditionally.

**Depending on your current knowledge of Webpack, please either read on or jump ahead**:

- I know very little about Webpack, I'd just like to use it, please. [Jump here](#the-easy-webpack-ecosystem---feature-and-configuration-presets).
- I have already created configuration files for Webpack in the past and I'd like to know how Easy Webpack can help simplify my workflow. Awesome! Read on.

#### How it works

By default, when passing an `Object`, the `generateConfig` function does the following:
- recursively merge nested objects (so that new configuration fields can be added, rather than overwritten by successive configs)
- non-recursively append `Array`s (so you can add plugins on top of existing ones, rather than replace all the previously defined ones)
- override `string`s, `boolean`s, `number`s and other types -- in case they were defined in one of the previous configs

When passing an [Object generating Function](#object-generators), the effects are similar, with one exception:
- `Array`s are always literally replaced

To get an intuitive feel of what it does in its most basic form, take a look at the following code:
```js
const a = { a: { text: 'abc', array: [ 1, 2, 3 ] } };
const b = { a: { text: 'xyz', array: [ 4, 5, 6 ] }, b: 'something else' };

const merged = generateConfig(a, b);

// 'merged' is now a combination of both 'a' and 'b', 
// with the exception of 'a.text' which was replaced with the value from 'b'
// { a: { text: 'xyz', array: [ 1, 2, 3, 4, 5, 6 ] }, b: 'something else' };
```

#### Example with pure `Object`s

To illustrate how Easy Webpack works, let's create a simple Webpack configuration file using its highlight feature - `generateConfig`. 

First, let's define some configuration objects, each clearly representing separate concerns we'd like to address in the output config file:

<details>
<summary>**Click here to expand the example**</summary>
```js
const path = require('path');
const DefinePlugin = require('webpack/lib/DefinePlugin');

const common = {
  entry: {
    'app': ['./src/main']
  },
  output: {
    path: path.resolve('dist'),
  }
}

const development = {
  devtool: 'cheap-module-inline-source-map',
  debug: true,
  output: {
    filename: '[name].bundle.js',
    sourceMapFilename: '[name].bundle.map',
    chunkFilename: '[id].chunk.js'
  },
  plugins: [
    new DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    })
  ]
}

const production = {
  devtool: 'source-map',
  debug: false,
  
  output: {
    filename: '[name].[chunkhash].bundle.js',
    sourceMapFilename: '[name].[chunkhash].bundle.map',
    chunkFilename: '[id].[chunkhash].chunk.js'
  },
  
  plugins: [
    new DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ]
}

const css = {
  module: {
    loaders: [{
      test: /\.css$/i,
      loaders: ['style', 'css']
    }]
  }
}
```
</details>

We can now use the `generateConfig` function from `@easy-webpack/core` to combine those parts into one, functional configuration object, which differs depending on the `NODE_ENV`:

```js
const generateConfig = require('@easy-webpack/core').generateConfig;

let config;

switch (process.env.NODE_ENV) {
  case 'development':
    config = generateConfig(common, development, css);
    break;
  case 'production':
    config = generateConfig(common, production, css);
    break;
}

module.exports = config;
```

This offers you a clear separation of concern in terms of defining your configuration files. 

#### Advanced usage
##### Literal Replace

You can achieve literal manipulations by using `literalReplace`:

```js
const literalReplace = require('@easy-webpack/core').literalReplace;

const initial = {
  plugins: [ new SomeWebpackPlugin() ]
}

const override = {
  plugins: literalReplace( [ AnotherWebpackPlugin() ] )
}

const config = generateConfig(initial, override);
// the output config will only have 'AnotherWebpackPlugin()', but not SomeWebpackPlugin, because of literalReplace
```

##### Object Generators

If you need more powerful and fine grained control over the blocks of your configuration (like prepending arrays or re-using current state), instead of passing in the object, you may also pass in a function, that generates the desired configuration part. 

The function you pass in will be evaluated with its `this` bound to the current configuration state, which means you can access previous values in order to modify or extend them. This makes it possible to do virtually any transformation to the config in a consistent manner, e.g. use values previously defined to compute the desired outcome. 

By further creating wrapper functions that generate functions that generate configuration objects (that's a mouthful!), you can create very clean wrappers for specific functionality (this is also how our preset configs are made):

<details>
<summary>**Click here to expand the example**</summary>
```js
import {get} from 'lodash'; // helper for extracting current value //

function css({ filename = '[name].css', allChunks = false, sourceMap = false, extractText = undefined, resolveRelativeUrl = undefined } = {}) {
  return function css() {
    const loaders = ['style', `css${sourceMap ? '?sourceMap' : ''}`];

    if (resolveRelativeUrl) {
      loaders.push(`resolve-url${sourceMap ? '?sourceMap' : ''}`);
      sourceMap = true; // source maps need to always be on for this
    }

    const extractCss = extractText === false;
    const providedInstance = extractText instanceof ExtractTextPlugin;

    if (!providedInstance)
      extractText = extractCss ? new ExtractTextPlugin(filename, extractText instanceof Object ? extractText : { allChunks, sourceMap }) : null;

    const config = {
      module: {
        loaders: get(this, 'module.loaders', []).concat([{
          test: /\.css$/i,
          loaders: extractCss ? extractText.extract(...loaders.slice(1)) : loaders
        }])
      }
    }

    if (extractText && !providedInstance) {
      config.plugins = [
        extractText
      ].concat(get(this, 'plugins', []))
    }

    if (resolveRelativeUrl instanceof Object) {
      config['resolveUrlLoader'] = resolveRelativeUrl
    }

    return config
  }
}
```
</details>

Note that for simple uses, such as overriding a setting, or adding a plugin, using a simple object is usually enough.

## The Easy Webpack Ecosystem - Feature and Configuration Presets

Easy Webpack offers a number of pre-made **[feature preset NPM packages](https://www.npmjs.com/~easy-webpack)** that can be used to quickly add desired functionality to your Easy Webpack config file. Each feature comes with its own set of dependencies, so that you - the user - do not have to research changes, or worry about the best possible implementation of a given feature at a given time. The idea is as simple as it gets: you install the module, stick it into your config and it should just work.

This is great in a number of scenarios, such as:
- you're starting out a project and don't want to think too hard about how to configure Webpack
- you want to delegate the task of implementing the configuration of certain Webpack features to other people
- you don't neccessairly feel like researching *ze internets* every other month for an updated tutorial for the up-to-date best practices for implementing a given feature, you'd rather `npm update` and be done with it
- you want a clean "base" config that works, that you can override/append with your own custom features or parts

If you see value in any of the above mentioned scenarios, you should give feature-config presets a try.

### Using Feature Configuration Presets

You can see all the published feature configs on [NPM](https://www.npmjs.com/~easy-webpack). You'll find a range of packages, from opionionated Production and Development presets, through Babel, TypeScript, CSS, LESS and SASS support, to platform-specific support such as Aurelia or Electron.

As a rule, all the official Easy Webpack packages are made more robust by returning functions that generate Objects, meaning, the packages can expose a number of parameters to the end-user, which can be used for customization of a given feature (example below).

Every Easy Webpack package includes typings, which means IDEs such as Visual Studio, Visual Studio Code or Webstorm will show appropriate autocomplete listing all the possibile options. Since the feature configs are still mostly undocumented (Pull Requests appreciated!), its best to rely on the typings and refer to the source code as a last resort.

To use a given preset simply:

1. install it via NPM as you normally would any package
   
   ```sh
   npm install @easy-webpack/config-css --save-dev
   ```
   
2. insert a call to it as an argument to your `generateConfig` call (shown in the example below)

An example `webpack.config.js` that uses strictly configuration presets might then look like this:

```js
const baseConfig = { ... }; // project-specific config like the entry file(s)

module.exports = generateConfig(
  baseConfig,

  require('@easy-webpack/config-env-production')
    ({ compress: true }),
    
  require('@easy-webpack/config-aurelia')
    ({ title: 'My Awesome Website' }),

  require('@easy-webpack/config-typescript')(),
  require('@easy-webpack/config-html')(),

  require('@easy-webpack/config-css')
    ({ filename: 'styles.css', allChunks: true, sourceMap: false }),

  require('@easy-webpack/config-fonts-and-images')(),
  require('@easy-webpack/config-global-bluebird')(),
  require('@easy-webpack/config-global-jquery')(),
  require('@easy-webpack/config-global-regenerator')(),
  require('@easy-webpack/config-generate-index-html')
    ({ minify: true }),

  require('@easy-webpack/config-uglify')
    ({ debug: false }),
    
  // feel free to add your own overrides, custom plugins, add your own options... e.g.:
  // { plugins: [ new CustomPlugin() ] }, // <-- appends a plugin
  // { devtool: 'inline-source-map' },    // <-- replaces the devtool
  // function () { return { debug: !this.debug } } // <-- uses previous value to compute the new one
);
```

You may naturally replace, override or append any custom config by simply placing the desired config `Object` or `Object-generating Function` into the arguments passed into `generateConfig` like shown in the comments above.

For a fully-featured example, take a look at [Aurelia's Navigation Skeleton](https://github.com/aurelia/skeleton-navigation/blob/936693b68209f6c411d869e7f625fcdbbe9fe748/skeleton-typescript-webpack/webpack.config.js).

### Why delegate parts of my config file to *ze internets*, why a gazillion NPM modules, one per each simple feature?

The benefit of having parts of the config in separate NPM modules is that the community can fix bugs and optimize the config file without you - the developers - having to do anything else than `npm update`. No need for blog posts with tedious migrations to new settings -- the deal is: just update the package.

To the ney-sayers out there, my response is: When somebody wants their own, unmanaged settings, they probably know what and why they're doing something. One can always copy & paste the config out from the managed package or write their own from scratch. Ultimately, it's like the difference between managed and unmanaged webhosting -- you should always choose the right tool for the job.

### Notes on usage in production

If you're running a production-grade product that's using NPM packages, it is considered good practice to either lock your dependencies to a patch level, or use shrinkwrap to deep-lock them altogether and upgrade with the help of tests to confirm your code works in the updated scenario. If you just "upgrade the hell out of it" for the sake of upgrading, then I can't be blamed if things break.

Every config package follows SemVer, i.e. no breaking changes will be made to config files without bumping a major version. Minor bumps and bug fixes will only include: code maintenance, upgrade tasks, switches for better defaults (e.g. a better compression algorithm, a more compatible default `devtool` - things of that sort).

Note that it is ultimately the developers responsibility to ensure he has set correct SemVer range for the packages, just like it is the mainainers responsitility to follow SemVer in a SemVer environment.

## What are others saying

> Great job!! Something to 🤔: Make #webpack more usable vs. abstract it's complexity with another tool? What you've made is still 👌💯

-- Sean T. Larkin | [@TheLarkInn](https://twitter.com/TheLarkInn/) | Webpack Core Team | Source: [Twitter Status](https://twitter.com/TheLarkInn/status/752168761323450369)


> You have done a fantastic job by creating easy-webpack. Thank you so much. You don't know how frustrated I was learning Webpack and creating a working webpack.config.js

-- @rajajhansi | Source: [GitHub Issue](https://github.com/easy-webpack/core/issues/3#issuecomment-230328427)


> Webpack has quite a steep learning curve when you start getting knee-deep into it. That new Easy Webpack stuff is simply beautiful -- seriously it's so good. Lots of configurations for Webpack projects without needing to pull your hair out. 

-- @Vheissu | Source: [Gitter @ June 28, 2016 8:39 AM](https://gitter.im/aurelia/Discuss?at=57721bb58441a8124d6e1e84)


> easy webpack [is] a great idea

-- @rquast | Source: [Gitter @ June 28, 2016 8:42 AM](https://gitter.im/aurelia/Discuss?at=57721c3b8c9263ba3011f4cf)


## Contributing

We use [Semantic Release](https://github.com/semantic-release/semantic-release), which means:
- version is set during release, in the CI, not in Git's copy of `package.json`
- commits should conform to the AngularJS Commit Message Convention, i.e. [these rules](https://github.com/semantic-release/semantic-release#default-commit-message-format)

If you created an Easy Webpack feature configuration preset package please add the conventional `easy-webpack` tag, so that others may easily find it. In case you would like to migrate it under the `@easy-webpack` scope, open an issue here and we'll see what we can do! It would be best if you used one of the pre-existing packages as a template (Semantic Release + AVA + TypeScript).

## Prior art

Direct inspiration for this project:

- [webpack-merge](https://www.npmjs.com/package/webpack-merge) by @bebraw
- using Array and Object destructuring for Webpack configuration files (like [this](https://github.com/chentsulin/electron-react-boilerplate/blob/d6115ccc957d788c9c8b2a82c4cd2e1685fa0103/webpack.config.development.js#L6))

Other projects, of which I was not aware when developing Easy Webpack listed below. I still feel Easy Webpack's final design allows for more flexible usage scenarios than the projects cited below. Feel free to judge for yourself though!

- [webpack-config](https://mdreizin.github.io/webpack-config/) by @mdreizin
- [webpack-configurator](https://github.com/lewie9021/webpack-configurator) by @lewie9021

## Hall of Fame

Made possible thanks to these brave souls:
- @niieani (Bazyli Brzóska) https://invent.life
- @Vheissu (Dwayne Charrington) http://ilikekillnerds.com
