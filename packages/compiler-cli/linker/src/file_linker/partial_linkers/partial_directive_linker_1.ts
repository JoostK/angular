/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ConstantPool} from '@angular/compiler';

import {AstObject} from '../../ast/ast_value';
import {LinkerEnvironment} from '../linker_environment';

import {PartialLinker} from './partial_linker';

/**
 * A `PartialLinker` that is designed to process `$ngDeclareDirective()` call expressions.
 */
export class PartialDirectiveLinkerVersion1<TStatement, TExpression> implements
    PartialLinker<TStatement, TExpression> {
  linkPartialDeclaration(
      linkerEnvironment: LinkerEnvironment<TStatement, TExpression>, sourceUrl: string,
      code: string, constantPool: ConstantPool, metaObj: AstObject<TExpression>): TExpression {
    throw new Error('Not implemented.');
  }
}
