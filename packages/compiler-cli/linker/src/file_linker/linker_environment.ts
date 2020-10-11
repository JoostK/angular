/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AstFactory} from '@angular/compiler-cli/src/ngtsc/translator';

import {AstHost} from '../ast/ast_host';
import {FileLinker} from './file_linker';

import {DEFAULT_LINKER_OPTIONS, LinkerOptions} from './linker_options';
import {Translator} from './translator';

export function createLinkerEnvironment<TStatement, TExpression>(
    host: AstHost<TExpression>, factory: AstFactory<TStatement, TExpression>,
    options: Partial<LinkerOptions>): LinkerEnvironment<TStatement, TExpression> {
  return new LinkerEnvironment(host, factory, {...DEFAULT_LINKER_OPTIONS, ...options})
}

export class LinkerEnvironment<TStatement, TExpression> {
  readonly translator = new Translator<TStatement, TExpression>(this.factory);
  constructor(
      readonly host: AstHost<TExpression>, readonly factory: AstFactory<TStatement, TExpression>,
      readonly options: LinkerOptions) {}

  createFileLinker(sourceUrl: string, code: string): FileLinker<TStatement, TExpression> {
    return new FileLinker(this, sourceUrl, code);
  }
}
