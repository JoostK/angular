/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AstFactory} from '@angular/compiler-cli/src/ngtsc/translator';

import {AstHost} from '../ast/ast_host';

import {LinkerOptions} from './linker_options';
import {Translator} from './translator';

export class LinkerEnvironment<TStatement, TExpression> {
  readonly translator = new Translator<TStatement, TExpression>(this.factory);
  constructor(
      readonly host: AstHost<TExpression>, readonly factory: AstFactory<TStatement, TExpression>,
      readonly options: LinkerOptions) {}
}
