/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Options to configure the linking behavior.
 */
export interface LinkerOptions {
  /**
   * Whether this file should be considered an ECMAScript module.
   */
  isESModule: boolean;
  /**
   * Whether to generate legacy i18n message ids.
   */
  enableI18nLegacyMessageIdFormat: boolean;
  /**
   * Whether to convert all line-endings in ICU expressions to `\n` characters.
   */
  i18nNormalizeLineEndingsInICUs: boolean;
}

/**
 * The default linker options to use if properities are not provided.
 */
export const DEFAULT_LINKER_OPTIONS: LinkerOptions = {
  isESModule: true,
  enableI18nLegacyMessageIdFormat: true,
  i18nNormalizeLineEndingsInICUs: false,
};
