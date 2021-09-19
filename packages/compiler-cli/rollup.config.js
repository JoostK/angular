/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

const {nodeResolve} = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const preserveShebang = require('rollup-plugin-preserve-shebang');
const sourcemaps = require('rollup-plugin-sourcemaps');

module.exports = {
  output: {
    // We set the interop to `esModule` so that import semantics match with how
    // they are understood in TypeScript. This is necessary to also work around:
    // https://github.com/rollup/rollup/issues/4009. Builtin NodeJS modules do not
    // work as expected in some scenarios. e.g. `cluster` in ngcc exposes an `on`
    // function that is only enumerable on the export prototype.
    interop: 'esModule'
  },
  external: ['typescript', 'chokidar', 'yargs'],
  onwarn: customWarningHandler,
  plugins: [
    nodeResolve({preferBuiltins: true}),
    // In combination to the `esModule` interop from above, we need to treat
    // all external dependencies as ESM-compatible. This ensures that all
    // CommonJS `require` calls are translated to namespace imports.
    commonjs({esmExternals: true}), sourcemaps(), preserveShebang()
  ]
};

/** Custom warning handler for Rollup. */
function customWarningHandler(warning, defaultHandler) {
  // If rollup is unable to resolve an import, we want to throw an error
  // instead of silently treating the import as external dependency.
  // https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
  if (warning.code === 'UNRESOLVED_IMPORT') {
    throw Error(`Unresolved import: ${warning.message}`);
  }

  defaultHandler(warning);
}
